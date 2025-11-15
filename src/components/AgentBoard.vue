<template>
  <div class="agent-board-container">
    <el-row justify="center">
      <el-col :span="20" :lg="16">
        <h1 class="agent-title">品控 AI 智能体</h1>
        <p class="agent-description">
          输入您关心的“缺陷类型”，AI 智能体将为您生成通俗易懂的成因分析和排查建议。
        </p>

        <div class="input-section">
          <el-input
              v-model="defectName"
              placeholder="例如：镀层针孔 或 孔铜厚度不均"
              size="large"
              clearable
              @keyup.enter="handleAnalyze"
          >
            <template #prepend>
              <span class="prepend-label">缺陷类型</span>
            </template>
          </el-input>

          <el-button
              type="primary"
              size="large"
              @click="handleAnalyze"
              :loading="isLoading"
              :disabled="!defectName"
              class="analyze-button"
          >
            {{ isLoading ? '分析中...' : '开始智能分析' }}
          </el-button>
        </div>

        <el-card class="result-card" v-if="analysisResult || isLoading">
          <template #header>
            <div class="card-header">
              <span>分析报告 ({{ currentDefectName }})</span>
              <el-button v-if="isLoading" type="danger" link @click="stopAnalysis">
                停止生成
              </el-button>
            </div>
          </template>

          <div class="result-content" v-html="formattedResult"></div>

          <el-empty v-if="isLoading && !analysisResult" description="正在连接 AI 智能体..."></el-empty>
        </el-card>

      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'; // 重新引入 computed
import { ElMessage } from 'element-plus';
import * as api from '../api/graphApi';

// 响应式状态
const defectName = ref('');
const currentDefectName = ref('');
const analysisResult = ref('');
const isLoading = ref(false);
const currentEventSource = ref(null);


const formattedResult = computed(() => {
  let html = analysisResult.value || '';

  // 1. (已移除) 不再需要将 \n 替换为 <br>，CSS 会处理
  html = html.replace(/(\\n|\n)/g, '<br>');

  // 2. 修复加粗：
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 3. 修复标题 (现在匹配 \n 或 \\n 或行尾)：
  html = html.replace(/### (.*?)(?:\\n|\n|$)/g, '<h3>$1</h3>');

  return html;
});

// --- (handleAnalyze, stopAnalysis, onUnmounted 方法保持不变) ---
const handleAnalyze = () => {
  if (!defectName.value || isLoading.value) {
    return;
  }
  isLoading.value = true;
  analysisResult.value = '';
  currentDefectName.value = defectName.value;

  try {
    currentEventSource.value = api.narrateDefectStream(
        defectName.value,
        (data) => {
          analysisResult.value += data;
        },
        (data) => {
          isLoading.value = false;
          currentEventSource.value = null;
        },
        (error) => {
          if (isLoading.value) {
            ElMessage.error(error.message || '分析过程中发生错误。');
          }
          isLoading.value = false;
          currentEventSource.value = null;
        }
    );
  } catch (e) {
    ElMessage.error('分析请求失败。');
    isLoading.value = false;
  }
};

const stopAnalysis = () => {
  if (currentEventSource.value) {
    currentEventSource.value.close();
    currentEventSource.value = null;
    isLoading.value = false;
    ElMessage.warning('分析已手动停止。');
  }
};

onUnmounted(() => {
  stopAnalysis();
});
</script>

<style scoped>
.agent-board-container {
  padding: 24px;
  height: 100%;
  color: var(--el-text-color-primary);
}
.agent-title {
  text-align: center;
  font-size: 2.2rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.agent-description {
  text-align: center;
  font-size: 1.1rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 32px;
}
.input-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
.prepend-label {
  padding: 0 10px;
}
.analyze-button {
  min-width: 120px;
}
.result-card {
  margin-top: 24px;
  border: 1px solid var(--el-border-color);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.result-content {
  min-height: 150px;
  font-size: 1rem;
  line-height: 1.7;
  padding: 10px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  white-space: pre-wrap;
}

.result-content :deep(h3) {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 10px 0 5px 0;
  color: var(--el-text-color-primary);
}
.result-content :deep(strong) {
  color: var(--el-text-color-primary);
  font-weight: 600;
}
</style>