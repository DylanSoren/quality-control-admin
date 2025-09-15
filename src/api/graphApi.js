// src/api/graphApi.js

import axios from 'axios';

// 配置 Axios 实例，统一设置基础路径和超时
const apiClient = axios.create({
    baseURL: '/api', // 对应后端 @RequestMapping("/api")，vite 会代理这个路径
    timeout: 10000, // 增加超时时间
});

// --- 节点管理 ---

/**
 * 根据名称查找节点
 * @param {string} name 节点名称
 */
export const findNodeByName = (name) => apiClient.get(`/graph/node`, { params: { name } });

/**
 * 获取所有节点
 * @param {string} [label] 可选标签: "影响因素" 或 "缺陷类型"
 */
export const getAllNodes = (label) => apiClient.get('/graph/nodes', { params: { label } });

/**
 * 创建或更新影响因素
 * @param {object} factorDto { name, standard, description }
 */
export const createOrUpdateFactor = (factorDto) => apiClient.post('/graph/factor', factorDto);

/**
 * 创建或更新缺陷类型
 * @param {object} defectDto { name, typicalManifestations }
 */
export const createOrUpdateDefect = (defectDto) => apiClient.post('/graph/defect', defectDto);

/**
 * 根据名称删除节点
 * @param {string} name 节点名称
 */
export const deleteNodeByName = (name) => apiClient.delete('/graph/node', { params: { name } });

// --- 关系管理 ---

/**
 * 创建关系
 * @param {object} relationshipDto { startNodeName, endNodeName }
 */
export const createRelationship = (relationshipDto) => apiClient.post('/graph/relationship', relationshipDto);

/**
 * 删除关系
 * @param {object} relationshipDto { startNodeName, endNodeName }
 */
export const deleteRelationship = (relationshipDto) => apiClient.delete('/graph/relationship', { data: relationshipDto });

// --- 查询分析 ---

/**
 * 查找指定缺陷的所有直接原因
 * @param {string} defectName 缺陷名称
 */
export const findCausesForDefect = (defectName) => apiClient.get('/graph/causes', { params: { defectName } });

/**
 * 查找导致指定缺陷的所有因果路径
 * @param {string} defectName 缺陷名称
 */
export const findCausalPathsForDefect = (defectName) => apiClient.get('/graph/causal-paths', { params: { defectName } });

/**
 * 查找由某个因素直接导致的所有缺陷
 * @param {string} factorName 因素名称
 */
export const findDefectsCausedBy = (factorName) => apiClient.get('/graph/defects', { params: { factorName } });

// --- 系统管理 ---

/**
 * 初始化数据库
 */
export const initializeDatabase = () => apiClient.post('/admin/init-database');