<template>
  <el-drawer
      :model-value="modelValue"
      title="节点详情"
      direction="rtl"
      @close="$emit('update:modelValue', false)"
  >
    <div v-if="node" class="node-detail-content">
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

      <div v-if="viewMode !== 'query'" class="drawer-footer">
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

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  node: {
    type: Object,
    default: null,
  },
  // 【新增】接收 viewMode 属性
  viewMode: {
    type: String,
    default: 'admin', // 默认为 admin 模式
  },
});

const emit = defineEmits(['update:modelValue', 'delete-node']);

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