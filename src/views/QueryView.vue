<template>
  <el-container style="height: 100vh; display: flex; flex-direction: column;">
    <el-header style="border-bottom: 1px solid #eee; padding: 0; display: flex; align-items: center;">
      <el-menu
          :default-active="activeView"
          mode="horizontal"
          @select="handleMenuSelect"
          :ellipsis="false"
          style="flex-grow: 1; border-bottom: none;"
      >
        <el-menu-item index="graph">
          <el-icon><Share /></el-icon>
          知识图谱查询
        </el-menu-item>
        <el-menu-item index="agent">
          <el-icon><Cpu /></el-icon>
          Agent智能品控
        </el-menu-item>
      </el-menu>

      <div class="header-actions" style="padding-right: 20px;">
        <template v-if="activeView === 'graph'">
          <el-button
              type="success"
              @click="callGraphMethod('fetchAllNodesAndRelationships')"
              :loading="isGraphLoading"
          >
            加载/刷新全图
          </el-button>
          <el-button
              color="#626aef"
              type="success"
              @click="callGraphMethod('fetchAllFactors')"
              :loading="isGraphLoading"
          >
            加载全部影响因素
          </el-button>
          <el-button
              color="#626aef"
              type="success"
              @click="callGraphMethod('fetchAllDefects')"
              :loading="isGraphLoading"
          >
            加载全部缺陷类型
          </el-button>
        </template>
      </div>

    </el-header>

    <el-main style="padding: 0; flex: 1; overflow: auto;">
      <div v-show="activeView === 'graph'" style="height: 100%;">
        <GraphManagement view-mode="query" ref="graphManagementRef" />
      </div>
      <div v-if="activeView === 'agent'">
        <AgentBoard />
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
// 【修改】引入 computed
import { ref, computed } from 'vue';
import { Share, Cpu } from '@element-plus/icons-vue';
import GraphManagement from './GraphManagement.vue';
import AgentBoard from '../components/AgentBoard.vue';

const activeView = ref('graph');

// 【新增】从 AdminView.vue 复制过来的逻辑，用于与子组件通信
const graphManagementRef = ref(null);

const isGraphLoading = computed(() => {
  // 安全地访问子组件的 loading 状态
  return graphManagementRef.value?.loading ?? false;
});

const handleMenuSelect = (index) => {
  activeView.value = index;
};

const callGraphMethod = (methodName) => {
  // 确保子组件实例存在且方法也存在
  if (graphManagementRef.value && typeof graphManagementRef.value[methodName] === 'function') {
    graphManagementRef.value[methodName]();
  } else {
    console.error(`方法 ${methodName} 在 GraphManagement 组件上不存在或未暴露`);
  }
};
</script>

<style scoped>
.el-header {
  white-space: nowrap;
}
.el-menu--horizontal {
  border-bottom: none;
}
.el-main {
  height: calc(100vh - 60px);
}
</style>