<template>
  <el-drawer
      :model-value="modelValue"
      title="节点详情"
      direction="rtl"
      @close="$emit('update:modelValue', false)"
  >
    <div v-if="node" class="node-detail-content">
<!--      <p><strong>ID:</strong> {{ node.id }}</p>-->
      <p><strong>名称:</strong> {{ node.name }}</p>
      <p><strong>类型:</strong>
        <el-tag :type="node.category === 0 ? '' : 'danger'">
          {{ node.category === 0 ? '影响因素' : '缺陷类型' }}
        </el-tag>
      </p>
      <el-divider />

      <div v-if="node.category === 0">
        <h4>属性</h4>
        <p><strong>执行标准:</strong> {{ node.standard || '未设置' }}</p>
        <p><strong>描述:</strong> {{ node.description || '未设置' }}</p>
      </div>
      <div v-if="node.category === 1">
        <h4>属性</h4>
        <p><strong>典型表现:</strong> {{ node.typicalManifestations || '未设置' }}</p>
      </div>

      <div class="drawer-footer">
        <el-button type="danger" @click="handleDelete" :disabled="!node.name">删除此节点</el-button>
      </div>
    </div>
    <div v-else>
      <p>没有选中的节点</p>
    </div>
  </el-drawer>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

// 定义 props，接收 v-model 的值和节点数据
const props = defineProps({
  modelValue: { // v-model
    type: Boolean,
    required: true,
  },
  node: { // 选中的节点对象
    type: Object,
    default: null,
  },
});

// 定义 emits，用于更新 v-model 和触发删除事件
const emit = defineEmits(['update:modelValue', 'delete-node']);

// 触发删除事件，将节点名称传递给父组件
const handleDelete = () => {
  if (props.node && props.node.name) {
    emit('delete-node', props.node.name);
  }
};
</script>

<style scoped>
.node-detail-content {
  padding: 0 20px;
}
.drawer-footer {
  margin-top: 40px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}
p {
  line-height: 1.8;
}
</style>