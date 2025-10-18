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

      <div v-if="viewMode !== 'query'" class="drawer-footer">
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

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  relationship: {
    type: Object,
    default: () => null,
  },
  // 【新增】接收 viewMode 属性
  viewMode: {
    type: String,
    default: 'admin', // 默认为 admin 模式
  },
});

const emit = defineEmits(['update:modelValue', 'delete-relationship']);

const handleDelete = () => {
  if (props.relationship) {
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