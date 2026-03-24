import React, { useState } from 'react';
import { SensorData, SystemStatus } from '../types';

interface AIAssistantProps {
  sensors: SensorData;
  status: SystemStatus;
}

export default function AIAssistant({ sensors, status }: AIAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string>('');

  const requestAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysis('');

    const apiKey = import.meta.env.VITE_SILICONFLOW_API_KEY;
    const apiUrl = "https://api.siliconflow.cn/v1/chat/completions";

    const prompt = `你是一个专业的物联网农业与植物养护智能助手。
当前传感器数据：温度 ${sensors.temperature}℃，湿度 ${sensors.humidity}%，光照强度 ${sensors.light}。
当前设备运行状态：水泵 ${status.isPumpOn ? '开启' : '关闭'}，补光灯 ${status.isLightOn ? '开启' : '关闭'}，风扇 ${status.isFanOn ? '开启' : '关闭'}。

请基于以上数据进行分析：
1. 当前环境是否异常？
2. 给出科学的管理和养护建议。
请保持回答简明扼要，控制在150字以内，使用友好的语气。`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-7B-Instruct',
          messages: [
            { role: 'system', content: '你是一个物联网专家分析系统。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setAnalysis(data.choices[0].message.content);
      } else {
        throw new Error('未返回有效结果');
      }
    } catch (err: any) {
      setError(err.message || '网络请求错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-700 h-full flex flex-col gap-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-xl shadow-lg">🧠</span>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            AI 辅助分析与智能决策
          </h2>
        </div>
        <button 
          onClick={requestAnalysis} 
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
        >
          {loading ? '分析中...' : '开始智能诊断'}
        </button>
      </div>

      <div className="flex-grow bg-slate-800 rounded-2xl p-4 border border-slate-700 min-h-[120px] overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50 gap-3">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">大模型正在思考洞察数据...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded-lg">{error}</div>
        ) : analysis ? (
          <div className="text-sm leading-relaxed text-indigo-100 whitespace-pre-wrap">
            {analysis}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-30 gap-2">
            <span className="text-3xl">🤖</span>
            <span className="text-sm">点击上方按钮，基于当前传感器数据生成科学养护建议。</span>
          </div>
        )}
      </div>
    </div>
  );
}
