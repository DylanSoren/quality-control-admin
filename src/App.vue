<template>
  <MainView />
</template>

<script setup>
// 确保路径正确，如果 MainView.vue 在同级，路径就是 './MainView.vue'
import MainView from './views/MainView.vue';
</script>

<style>
/* 推荐在这里添加全局样式重置 */
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>