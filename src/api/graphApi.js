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
 * 根据名称模糊搜索节点
 * @param {string} name - 搜索关键词
 */
export const findNodesByNameFuzzy = (name) => apiClient.get('/graph/nodes/search', { params: { name } });


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

/**
 * 调用 AI 智能体分析缺陷
 * @param {string} defectType - 缺陷类型的名称
 * @param {function} onMessage - 收到一个数据块时的回调函数
 * @param {function} onComplete - 收到 "END" 信号时的回调函数
 * @param {function} onError - 发生错误或收到 "ERROR" 信号时的回调函数
 * @returns {EventSource} - 返回 EventSource 实例，以便调用方可以关闭它
 */
export const narrateDefectStream = (defectType, onMessage, onComplete, onError) => {
    const url = `/api/graph/narrate/stream?defectType=${encodeURIComponent(defectType)}`;

    const eventSource = new EventSource(url);

    // 1. 关键修复：添加一个状态标志
    let isStreamFinished = false;

    // 2. 监听 "message" 事件 (数据)
    eventSource.addEventListener("message", (event) => {
        if (isStreamFinished) return; // 结束后不再处理任何消息
        onMessage(event.data);
    });

    // 3. 监听 "END" 事件 (成功结束)
    eventSource.addEventListener("END", (event) => {
        isStreamFinished = true; // 标记为成功结束
        onComplete(event.data);
        eventSource.close();
    });

    // 4. 监听 "ERROR" 事件 (服务器推送的错误)
    eventSource.addEventListener("ERROR", (event) => {
        isStreamFinished = true; // 标记为已结束（无论成败）
        onError(new Error(event.data || 'AI 分析时发生内部错误'));
        eventSource.close();
    });

    // 5. 监听 "error" 事件 (底层网络错误)
    eventSource.onerror = (error) => {
        if (!isStreamFinished) {
            isStreamFinished = true; // 标记为已结束
            onError(new Error('无法连接到 AI 智能体，网络或服务异常。'));
        }
        eventSource.close();
    };

    return eventSource;
};