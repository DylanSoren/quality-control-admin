<template>
  <el-drawer
      :model-value="modelValue"
      title="关系详情"
      direction="rtl"
      size="600px"
      @update:model-value="$emit('update:modelValue', $event)"
      :with-header="true"
  >
    <div v-if="relationship" class="drawer-content">
      <el-descriptions :column="1" border>
        <el-descriptions-item label-class-name="my-label" label="起始节点">
          <el-tag type="primary">{{ relationship.source }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label-class-name="my-label" label="结束节点">
          <el-tag type="success">{{ relationship.target }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="drawer-footer">
        <el-button type="danger" @click="handleDelete" plain>
          删除此关系
        </el-button>
      </div>
    </div>
    <div v-else class="drawer-content">
      <p>没有选中任何关系。</p>
    </div>
  </el-drawer>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { ElButton, ElDrawer, ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus';

// --- Props & Emits ---
const props = defineProps({
  // 用于 v-model 绑定抽屉的显示状态
  modelValue: {
    type: Boolean,
    required: true,
  },
  // 选中的关系对象，ECharts 点击后会传入 { source, target }
  relationship: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits(['update:modelValue', 'delete-relationship']);

// --- Methods ---
const handleDelete = () => {
  if (props.relationship) {
    // 触发父组件中监听的 delete-relationship 事件，并把关系对象传回去
    emit('delete-relationship', props.relationship);
  }
};
</script>

<style scoped>
.drawer-content {
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.drawer-footer {
  margin-top: 30px;
  text-align: center;
}
.my-label {
  width: 90px;
}
</style>