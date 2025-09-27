<template>
  <el-container style="height: 100%;">
    <el-container>
      <el-aside width="350px" style="border-right: 1px solid #eee; padding: 20px;">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="节点管理" name="node">
            <el-form :model="nodeForm" label-position="top">
              <h4>创建 / 更新节点</h4>
              <el-form-item label="节点名称">
                <el-input v-model="nodeForm.name" placeholder="请输入唯一的节点名称"></el-input>
              </el-form-item>
              <el-form-item label="节点类型">
                <el-select v-model="nodeForm.type" placeholder="请选择类型" style="width: 100%;">
                  <el-option label="影响因素" value="factor"></el-option>
                  <el-option label="缺陷类型" value="defect"></el-option>
                </el-select>
              </el-form-item>
              <div v-if="nodeForm.type === 'factor'">
                <el-form-item label="执行标准 (可选)">
                  <el-input v-model="nodeForm.standard"></el-input>
                </el-form-item>
                <el-form-item label="描述 (可选)">
                  <el-input v-model="nodeForm.description" type="textarea"></el-input>
                </el-form-item>
              </div>
              <div v-if="nodeForm.type === 'defect'">
                <el-form-item label="典型表现 (可选)">
                  <el-input v-model="nodeForm.typicalManifestations" type="textarea"></el-input>
                </el-form-item>
              </div>
              <el-form-item>
                <el-button type="primary" @click="handleCreateOrUpdateNode">提交</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="关系管理" name="relationship">
            <el-form :model="relationshipForm" label-position="top">
              <h4>创建关系 (影响因素 -> 节点)</h4>
              <el-form-item label="起始节点名称">
                <el-input v-model="relationshipForm.startNodeName" placeholder="必须是影响因素"></el-input>
              </el-form-item>
              <el-form-item label="结束节点名称">
                <el-input v-model="relationshipForm.endNodeName" placeholder="影响因素或缺陷类型"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleCreateRelationship">创建关系</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="查询分析" name="query">
            <el-form label-position="top" class="query-form">
              <el-form-item label="查询影响因素">
                <el-input v-model="queryForm.factorName" placeholder="输入名称精确查找，不填则全查">
                  <template #append>
                    <el-button @click="handleQueryFactor">查询因素</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
            <el-form label-position="top" class="query-form">
              <el-form-item label="查询缺陷类型">
                <el-input v-model="queryForm.defectTypeName" placeholder="输入名称精确查找，不填则全查">
                  <template #append>
                    <el-button @click="handleQueryDefect">查询缺陷</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
            <el-form label-position="top" class="query-form">
              <el-form-item label="模糊搜索节点">
                <el-input v-model="queryForm.fuzzySearchName" placeholder="输入关键词查找节点">
                  <template #append>
                    <el-button @click="handleFuzzySearch">搜索</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
            <el-form label-position="top" class="query-form">
              <el-form-item label="查询缺陷的因果路径">
                <el-input v-model="queryForm.defectName" placeholder="输入缺陷名称">
                  <template #append>
                    <el-button @click="handleQueryCausalPaths">查询路径</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-aside>

      <el-main>
        <div ref="graphChart" style="width: 100%; height: 100%;"></div>
      </el-main>
    </el-container>
  </el-container>

  <NodeDetailDrawer
      v-model="drawerVisible"
      :node="selectedNode"
      @delete-node="handleDeleteNode"
  />

  <RelationshipDetailDrawer
      v-model="relationshipDrawerVisible"
      :relationship="selectedRelationship"
      @delete-relationship="handleDeleteRelationship"
  />
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import * as echarts from 'echarts';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as api from '../api/graphApi';
import NodeDetailDrawer from '../components/NodeDetailDrawer.vue';
import RelationshipDetailDrawer from '../components/RelationshipDetailDrawer.vue';


// --- 响应式状态定义 ---
const graphChart = ref(null);
let myChart = null;
const activeTab = ref('node');
const drawerVisible = ref(false);
const selectedNode = ref(null);
const loading = ref(false);

// 关系抽屉的状态
const relationshipDrawerVisible = ref(false);
const selectedRelationship = ref(null);

const nodeForm = reactive({ name: '', type: 'factor', standard: '', description: '', typicalManifestations: '' });
const relationshipForm = reactive({ startNodeName: '', endNodeName: '' });
const queryForm = reactive({
  factorName: '',     // 对应“查询影响因素”输入框
  defectTypeName: '', // 对应“查询缺陷类型”输入框
  fuzzySearchName: '', // 对应“模糊搜索节点”输入框
  defectName: '',     // 对应“查询因果路径”输入框
});

const chartOption = reactive({});
// ECharts 配置
Object.assign(chartOption, {
  tooltip: {
    formatter: (params) => {
      if (params.dataType === 'node') {
        return `<strong>${params.data.name}</strong><br/>类型: ${params.data.category === 0 ? '影响因素' : '缺陷类型'}`;
      }
      if (params.dataType === 'edge') {
        return `${params.data.source} -> ${params.data.target}`;
      }
    }
  },
  legend: [{ data: ['影响因素', '缺陷类型'] }],
  series: [{
    type: 'graph',
    layout: 'force',
    roam: true,
    label: { show: true, position: 'right', formatter: '{b}' },
    force: { repulsion: 700, edgeLength: 60 },

    // 关键：在这里明确地再次声明箭头样式，确保不会丢失
    edgeSymbol: ['none', 'arrow'],
    edgeSymbolSize: 15,

    lineStyle: {
      color: '#bcbcbc',
      width: 3,
      opacity: 1,
      curveness: 0.1
    },

    data: [],
    links: [],
    categories: [
      { name: '影响因素', itemStyle: { color: '#4592FF' } },
      { name: '缺陷类型', itemStyle: { color: '#FF5A45' } },
    ],
  }],
});


// --- 方法定义 ---

const fetchAllNodesAndRelationships = async () => {
  loading.value = true;
  try {
    // 1. 调用后端API，现在 res.data 的结构是 { nodes: [], links: [] }
    const res = await api.getAllNodes();
    const graphData = res.data;

    // 2. 处理节点数据（逻辑不变，只是数据来源变了）
    const nodes = graphData.nodes.map(node => {
      const isFactor = 'leadsToDefect' in node || 'leadsToFactor' in node;
      return {
        name: node.name,
        category: isFactor ? 0 : 1,
        symbolSize: isFactor ? 15 : 25,
        standard: isFactor ? node.standard : null,
        description: isFactor ? node.description : null,
        typicalManifestations: isFactor ? null : node.typicalManifestations
      };
    });

    // 3. 【核心简化】直接使用后端返回的关系数据，不再需要前端自己计算
    const links = graphData.links;

    // 4. 更新图表
    chartOption.series[0].data = nodes;
    chartOption.series[0].links = links;
    myChart.setOption(chartOption, true);
    ElMessage.success('图谱加载成功！');

  } catch (error) {
    ElMessage.error('图谱加载失败: ' + (error.response?.data || error.message));
  } finally {
    loading.value = false;
  }
};

const handleCreateOrUpdateNode = async () => {
  if (!nodeForm.name) {
    ElMessage.warning('节点名称不能为空！');
    return;
  }
  try {
    let res;
    if (nodeForm.type === 'factor') {
      res = await api.createOrUpdateFactor({ name: nodeForm.name, standard: nodeForm.standard, description: nodeForm.description });
    } else {
      res = await api.createOrUpdateDefect({ name: nodeForm.name, typicalManifestations: nodeForm.typicalManifestations });
    }
    ElMessage.success(`节点 "${res.data.name}" 操作成功！`);
    fetchAllNodesAndRelationships(); // 刷新图谱
    // 清空表单
    Object.assign(nodeForm, { name: '', standard: '', description: '', typicalManifestations: '' });
  } catch (error) {
    ElMessage.error('操作失败: ' + (error.response?.data || error.message));
  }
};

const handleCreateRelationship = async () => {
  if(!relationshipForm.startNodeName || !relationshipForm.endNodeName) {
    ElMessage.warning('起始和结束节点名称均不能为空！');
    return;
  }
  try {
    const res = await api.createRelationship(relationshipForm);
    ElMessage.success(res.data);
    fetchAllNodesAndRelationships(); // 刷新图谱
    Object.assign(relationshipForm, { startNodeName: '', endNodeName: '' });
  } catch (error) {
    ElMessage.error('关系创建失败: ' + (error.response?.data || error.message));
  }
}

/**
 * 查询因果路径
 */
const handleQueryCausalPaths = async () => {
  const defectName = (queryForm.defectName || '').trim();

  if (!defectName) {
    ElMessage.warning('请输入缺陷名称');
    myChart.setOption({ series: [chartOption.series[0]] }, true);
    return;
  }

  try {
    const res = await api.findCausalPathsForDefect(defectName);
    const paths = res.data; // paths 是一个路径数组, e.g., [[nodeA, nodeB], [nodeC]]
    console.log(paths)

    if (!paths || paths.length === 0) {
      ElMessage.info(`未找到关于缺陷 "${defectName}" 的因果路径`);
      myChart.setOption({ series: [{ ...chartOption.series[0], data: [], links: [] }] }, true);
      return;
    }

    const pathNodesMap = new Map(); // 使用 Map 存储节点，避免重复
    const pathLinks = [];          // 存储路径中的关系

    // 1. 先添加最终的缺陷节点
    const finalDefectNode = chartOption.series[0].data.find(n => n.name === defectName);
    if (finalDefectNode) {
      pathNodesMap.set(finalDefectNode.name, {
        name: finalDefectNode.name,
        category: 1,
        symbolSize: 25,
        typicalManifestations: finalDefectNode.typicalManifestations
      });
    } else {
      // 如果在原始数据中找不到，也手动添加一个
      pathNodesMap.set(defectName, { name: defectName, category: 1, symbolSize: 25 });
    }

    // 2. 遍历后端返回的所有路径
    paths.forEach(path => {
      for (let i = 0; i < path.length; i++) {
        const currentNode = path[i];

        // 将当前路径节点添加到 Map 中（如果不存在）
        if (!pathNodesMap.has(currentNode.name)) {
          pathNodesMap.set(currentNode.name, {
            name: currentNode.name,
            category: 0,
            symbolSize: 15,
            standard: currentNode.standard,
            description: currentNode.description });
        }

        // 创建关系：从当前节点指向路径中的下一个节点
        if (i < path.length - 1) {
          pathLinks.push({
            source: currentNode.name,
            target: path[i + 1].name
          });
        } else {
          // 如果是路径的最后一个节点，则创建指向最终缺陷节点的关系
          pathLinks.push({
            source: currentNode.name,
            target: defectName
          });
        }
      }
    });
    // console.log(pathNodesMap)
    // console.log(pathLinks)

    const pathNodes = Array.from(pathNodesMap.values());
    // console.log(pathNodes)
    // console.log('【最终节点数据】:', JSON.stringify(pathNodes, null, 2));
    // console.log('【最终关系数据】:', JSON.stringify(pathLinks, null, 2));

    const newOption = {
      tooltip: chartOption.tooltip, // 复用旧的提示框配置
      legend: [{ data: ['影响因素', '缺陷类型'] }], // 复用图例
      series: [{
        type: 'graph',
        layout: 'force',
        roam: true,
        label: { show: true, position: 'right', formatter: '{b}' },
        force: {
          repulsion: 700,
          edgeLength: 150,
          layoutAnimation: true,
          gravity: 0.1
        },

        // 关键：在这里明确地再次声明箭头样式，确保不会丢失
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 15,

        lineStyle: {
          color: '#e6a23c',
          width: 3,
          opacity: 1,
          curveness: 0.1
        },

        data: pathNodes,   // 使用我们新构造的节点数据
        links: pathLinks,  // 使用我们新构造的关系数据
        categories: chartOption.series[0].categories // 复用分类样式
      }]
    };

    myChart.setOption(newOption, true); // 使用 true 参数确保旧图被完全替换

    ElMessage.success(`已筛选显示 ${paths.length} 条关于 "${defectName}" 的因果路径`);

  } catch (error) {
    ElMessage.error('查询失败: ' + (error.response?.data || error.message));
  }
};

/**
 * 处理模糊搜索逻辑
 */
const handleFuzzySearch = async () => {
  const name = queryForm.fuzzySearchName.trim();
  if (!name) {
    ElMessage.warning('请输入搜索关键词！');
    return;
  }

  try {
    // 1. 调用我们新添加的API
    const res = await api.findNodesByNameFuzzy(name);
    const foundNodes = res.data;

    if (!foundNodes || foundNodes.length === 0) {
      ElMessage.info(`未找到名称包含 "${name}" 的节点`);
      // 清空图表
      myChart.setOption({ series: [{ ...chartOption.series[0], data: [], links: [] }] }, true);
      return;
    }

    // 2. 将后端返回的数据转换为 ECharts 需要的格式
    //    (此处的逻辑与 fetchAllNodesAndRelationships 中处理节点的逻辑保持一致，以确保数据结构统一)
    const nodesForGraph = foundNodes.map(node => {
      const isFactor = 'leadsToDefect' in node || 'leadsToFactor' in node;
      return {
        name: node.name,
        category: isFactor ? 0 : 1,
        symbolSize: isFactor ? 15 : 25,
        // 带上节点的详细信息，以便点击时抽屉能显示
        standard: isFactor ? node.standard : null,
        description: isFactor ? node.description : null,
        typicalManifestations: isFactor ? null : node.typicalManifestations
      };
    });

    // 3. 更新图表，只显示搜索到的节点，不显示关系
    myChart.setOption({
      series: [{
        ...chartOption.series[0],
        data: nodesForGraph,
        links: []
      }]
    }, true);

    ElMessage.success(`已筛选显示 ${foundNodes.length} 个相关节点`);

  } catch (error) {
    ElMessage.error('搜索失败: ' + (error.response?.data || error.message)); //
  }
};

/**
 * 获取所有影响因素
 */
const fetchAllFactors = async () => {
  const allFactors = chartOption.series[0].data.filter(node => node.category === 0);
  if (allFactors.length === 0) {
    ElMessage.info('当前图中没有影响因素节点');
    return;
  }
  myChart.setOption({
    series: [{
      ...chartOption.series[0],
      data: allFactors,
      links: [] // 显示全部同类节点时，不显示关系线以避免混乱
    }]
  }, true);
  ElMessage.success(`已显示全部 ${allFactors.length} 个影响因素`);
}

/**
 * 获取所有缺陷类型
 */
const fetchAllDefects = async () => {
  const allDefects = chartOption.series[0].data.filter(node => node.category === 1);
  if (allDefects.length === 0) {
    ElMessage.info('当前图中没有缺陷类型节点');
    return;
  }
  myChart.setOption({
    series: [{
      ...chartOption.series[0],
      data: allDefects,
      links: []
    }]
  }, true);
  ElMessage.success(`已显示全部 ${allDefects.length} 个缺陷类型`);
}

/**
 * 处理查询影响因素的逻辑
 */
const handleQueryFactor = async () => {
  const name = queryForm.factorName.trim();

  // 如果输入框为空，则显示所有影响因素
  if (!name) {
    const allFactors = chartOption.series[0].data.filter(node => node.category === 0);
    if (allFactors.length === 0) {
      ElMessage.info('当前图中没有影响因素节点');
      return;
    }
    myChart.setOption({
      series: [{
        ...chartOption.series[0],
        data: allFactors,
        links: [] // 显示全部同类节点时，不显示关系线以避免混乱
      }]
    }, true);
    ElMessage.success(`已筛选显示全部 ${allFactors.length} 个影响因素`);
    return;
  }

  // 如果输入框有内容，则按名称精确查找
  try {
    const res = await api.findNodeByName(name);
    const nodeData = res.data;

    // 验证返回的节点是否为“影响因素”
    const isFactor = 'leadsToDefect' in nodeData || 'leadsToFactor' in nodeData;
    if (!isFactor) {
      ElMessage.error(`节点 "${name}" 是一个缺陷类型，不是影响因素`);
      return;
    }

    const singleNodeForGraph = { ...nodeData, category: 0, x: myChart.getWidth() / 2, y: myChart.getHeight() / 2, fixed: true, symbolSize: 40 };
    myChart.setOption({
      series: [{ ...chartOption.series[0], data: [singleNodeForGraph], links: [] }]
    }, true);

    selectedNode.value = { ...nodeData, category: 0 };
    drawerVisible.value = true;
    ElMessage.success(`已筛选显示影响因素 "${name}"`);

  } catch (error) {
    if (error.response && error.response.status === 404) {
      ElMessage.error(`未找到名为 "${name}" 的影响因素`);
    } else {
      ElMessage.error('查询失败: ' + (error.response?.data || error.message));
    }
  }
};

/**
 * 处理查询缺陷类型的逻辑
 */
const handleQueryDefect = async () => {
  const name = queryForm.defectTypeName.trim();

  // 如果输入框为空，则显示所有缺陷类型
  if (!name) {
    const allDefects = chartOption.series[0].data.filter(node => node.category === 1);
    if (allDefects.length === 0) {
      ElMessage.info('当前图中没有缺陷类型节点');
      return;
    }
    myChart.setOption({
      series: [{
        ...chartOption.series[0],
        data: allDefects,
        links: []
      }]
    }, true);
    ElMessage.success(`已筛选显示全部 ${allDefects.length} 个缺陷类型`);
    return;
  }

  // 如果输入框有内容，则按名称精确查找
  try {
    const res = await api.findNodeByName(name);
    const nodeData = res.data;

    // 验证返回的节点是否为“缺陷类型”
    const isFactor = 'leadsToDefect' in nodeData || 'leadsToFactor' in nodeData;
    if (isFactor) {
      ElMessage.error(`节点 "${name}" 是一个影响因素，不是缺陷类型`);
      return;
    }

    const singleNodeForGraph = { ...nodeData, category: 1, x: myChart.getWidth() / 2, y: myChart.getHeight() / 2, fixed: true, symbolSize: 40 };
    myChart.setOption({
      series: [{ ...chartOption.series[0], data: [singleNodeForGraph], links: [] }]
    }, true);

    selectedNode.value = { ...nodeData, category: 1 };
    drawerVisible.value = true;
    ElMessage.success(`已筛选显示缺陷类型 "${name}"`);

  } catch (error) {
    if (error.response && error.response.status === 404) {
      ElMessage.error(`未找到名为 "${name}" 的缺陷类型`);
    } else {
      ElMessage.error('查询失败: ' + (error.response?.data || error.message));
    }
  }
};

const handleDeleteNode = async (name) => {
  try {
    await ElMessageBox.confirm(`确定要删除节点 "${name}" 及其所有关联关系吗？`, '警告', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    });
    const res = await api.deleteNodeByName(name);
    ElMessage.success(res.data);
    drawerVisible.value = false;
    fetchAllNodesAndRelationships(); // 刷新
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.response?.data || error.message));
    }
  }
}

/**
 * 处理删除关系的函数
 * @param {object} relationship - 包含 source 和 target 的关系对象
 */
const handleDeleteRelationship = async (relationship) => {
  try {
    await ElMessageBox.confirm(`确定要删除从 "${relationship.source}" 到 "${relationship.target}" 的关系吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 假设后端删除关系的API需要起始节点名和结束节点名
    // 你需要确保在 graphApi.js 中有对应的 deleteRelationship 函数
    await api.deleteRelationship({
      startNodeName: relationship.source,
      endNodeName: relationship.target
    });

    ElMessage.success('关系删除成功！');
    relationshipDrawerVisible.value = false; // 关闭抽屉
    fetchAllNodesAndRelationships(); // 刷新图谱
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.response?.data || error.message));
    }
  }
};

const handleInitDatabase = async () => {
  try {
    await ElMessageBox.confirm('这将清空现有数据并从文件重新导入，确定吗？', '严重警告', {
      confirmButtonText: '确定执行', cancelButtonText: '取消', type: 'warning',
    });
    const res = await api.initializeDatabase();
    ElMessage.success(res.data);
    fetchAllNodesAndRelationships(); // 重新加载
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('初始化失败: ' + (error.response?.data || error.message));
    }
  }
};

// --- 测试函数 ---
// const runArrowTestDemo = async () => {
//   const defectName = "结合力不良"
//
//   if (!defectName) {
//     ElMessage.warning('请输入缺陷名称');
//     myChart.setOption({ series: [chartOption.series[0]] }, true);
//     return;
//   }
//
//   try {
//     await api.findCausalPathsForDefect(defectName);
//     const paths = [
//       [
//         {
//           "id": 124,
//           "name": "整平剂不足",
//           "standard": null,
//           "description": "如JGB",
//           "leadsToFactor": [],
//           "leadsToDefect": []
//         },
//         {
//           "id": 125,
//           "name": "板面不平",
//           "standard": null,
//           "description": "板面微观不平度 (Rz) 超 3µm",
//           "leadsToFactor": [],
//           "leadsToDefect": []
//         }
//       ],
//       [
//         {
//           "id": 127,
//           "name": "油污残留",
//           "standard": null,
//           "description": "如指纹、助焊剂",
//           "leadsToFactor": [],
//           "leadsToDefect": []
//         },
//         {
//           "id": 128,
//           "name": "镀层“孤岛状”沉积",
//           "standard": null,
//           "description": null,
//           "leadsToFactor": [],
//           "leadsToDefect": []
//         }
//       ],
//       [
//         {
//           "id": 129,
//           "name": "微蚀深度过浅",
//           "standard": "微蚀深度需要保持在1.0-1.5µm",
//           "description": null,
//           "leadsToFactor": [],
//           "leadsToDefect": []
//         },
//         {
//           "id": 130,
//           "name": "氧化层未除净",
//           "standard": null,
//           "description": null,
//           "leadsToFactor": [],
//           "leadsToDefect": []
//         }
//       ]
//     ]; // paths 是一个路径数组, e.g., [[nodeA, nodeB], [nodeC]]
//     console.log(JSON.stringify(paths, null, 2))
//
//     if (!paths || paths.length === 0) {
//       ElMessage.info(`未找到关于缺陷 "${defectName}" 的因果路径`);
//       myChart.setOption({ series: [{ ...chartOption.series[0], data: [], links: [] }] }, true);
//       return;
//     }
//
//     const pathNodesMap = new Map(); // 使用 Map 存储节点，避免重复
//     const pathLinks = [];          // 存储路径中的关系
//
//     // 1. 先添加最终的缺陷节点
//     const finalDefectNode = chartOption.series[0].data.find(n => n.name === defectName);
//     if (finalDefectNode) {
//       pathNodesMap.set(finalDefectNode.name, { // id: finalDefectNode.id, // <-- 不添加id
//         name: finalDefectNode.name,
//         category: 1,
//         symbolSize: 25,
//         typicalManifestations: finalDefectNode.typicalManifestations });
//     } else {
//       // 如果在原始数据中找不到，也手动添加一个
//       pathNodesMap.set(defectName, { name: defectName, category: 1, symbolSize: 25 });
//     }
//
//     // 2. 遍历后端返回的所有路径
//     paths.forEach(path => {
//       for (let i = 0; i < path.length; i++) {
//         const currentNode = path[i];
//
//         // 将当前路径节点添加到 Map 中（如果不存在）
//         if (!pathNodesMap.has(currentNode.name)) {
//           pathNodesMap.set(currentNode.name, {
//             name: currentNode.name,
//             category: 0,
//             symbolSize: 15,
//             standard: currentNode.standard,
//             description: currentNode.description
//           });
//         }
//
//         // 创建关系：从当前节点指向路径中的下一个节点
//         if (i < path.length - 1) {
//           pathLinks.push({
//             source: currentNode.name,
//             target: path[i + 1].name
//           });
//         } else {
//           // 如果是路径的最后一个节点，则创建指向最终缺陷节点的关系
//           pathLinks.push({
//             source: currentNode.name,
//             target: defectName
//           });
//         }
//       }
//     });
//     // console.log(pathNodesMap)
//     // console.log(pathLinks)
//
//     const pathNodes = Array.from(pathNodesMap.values());
//     // console.log(pathNodes)
//     // console.log('【最终节点数据】:', JSON.stringify(pathNodes, null, 2));
//     // console.log('【最终关系数据】:', JSON.stringify(pathLinks, null, 2));
//
//     const newOption = {
//       tooltip: chartOption.tooltip, // 复用旧的提示框配置
//       legend: [{ data: ['影响因素', '缺陷类型'] }], // 复用图例
//       series: [{
//         type: 'graph',
//         layout: 'force',
//         roam: true,
//         label: { show: true, position: 'right', formatter: '{b}' },
//         force: { repulsion: 250, edgeLength: 90, layoutAnimation: true },
//
//         // 关键：在这里明确地再次声明箭头样式，确保不会丢失
//         edgeSymbol: ['none', 'arrow'],
//         edgeSymbolSize: 15,
//
//         lineStyle: {
//           color: '#e6a23c',
//           width: 3,
//           opacity: 1
//         },
//
//         data: pathNodes,   // 使用我们新构造的节点数据
//         links: pathLinks,  // 使用我们新构造的关系数据
//         categories: chartOption.series[0].categories // 复用分类样式
//       }]
//     };
//
//     myChart.setOption(newOption, true); // 使用 true 参数确保旧图被完全替换
//
//     ElMessage.success(`已筛选显示 ${paths.length} 条关于 "${defectName}" 的因果路径`);
//
//   } catch (error) {
//     ElMessage.error('查询失败: ' + (error.response?.data || error.message));
//   }
// };

// --- ECharts 初始化和事件绑定 ---
onMounted(() => {
  myChart = echarts.init(graphChart.value);
  myChart.setOption(chartOption);

  myChart.on('click', (params) => {
    if (params.dataType === 'node') {
      selectedNode.value = params.data;
      drawerVisible.value = true;
    } else if (params.dataType === 'edge') {
      // 当点击的是关系边时
      selectedRelationship.value = params.data;
      relationshipDrawerVisible.value = true;
    }
  });

  fetchAllNodesAndRelationships();

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    myChart?.resize();
  });
});

// 将需要被父组件调用的方法和响应式状态暴露出去
defineExpose({
  fetchAllNodesAndRelationships,
  fetchAllFactors,
  fetchAllDefects,
  handleInitDatabase,
  loading // loading 状态也需要暴露，以便父组件中的按钮能显示加载状态
});

</script>

<style>
.el-form-item {
  margin-bottom: 18px;
}
.el-tabs__content {
  overflow: auto;
}
</style>