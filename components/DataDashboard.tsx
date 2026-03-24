import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { SensorData, LogEntry, MqttMessage } from '../types';

interface DataDashboardProps {
  currentSensors: SensorData;
  mqttMessages: MqttMessage[];
  logs: LogEntry[];
}

export default function DataDashboard({ currentSensors, mqttMessages, logs }: DataDashboardProps) {
  const [history, setHistory] = useState<(SensorData & { time: string })[]>([]);

  useEffect(() => {
    setHistory(prev => {
      const newEntry = {
        ...currentSensors,
        time: new Date().toLocaleTimeString().split(' ')[0]
      };
      return [...prev, newEntry].slice(-20); // Keep last 20 ticks
    });
  }, [currentSensors]);

  // Pie chart data: Count equipment commands
  const pieData = useMemo(() => {
    let pumpCount = 0;
    let lightCount = 0;
    let fanCount = 0;

    mqttMessages.forEach(msg => {
      if (msg.topic.includes('commands') && msg.type === 'pub') {
        try {
          const payload = JSON.parse(msg.payload);
          if (payload.pump) pumpCount++;
          if (payload.light) lightCount++;
          if (payload.fan) fanCount++;
        } catch (e) {}
      }
    });

    return [
      { name: '水泵指令', value: pumpCount },
      { name: '补光灯指令', value: lightCount },
      { name: '风扇指令', value: fanCount }
    ].filter(d => d.value > 0);
  }, [mqttMessages]);

  const COLORS = ['#3b82f6', '#eab308', '#06b6d4'];

  // Word Cloud Data
  const wordCloudWords = useMemo(() => {
    const text = logs.map(l => l.message).join(' ');
    const keywords = ['温度', '湿度', '光照', '水泵', '风扇', '补光灯', '主题', '收到', '转发', '云平台', '感知模块', '执行模块', '开启', '关闭'];
    const counts: Record<string, number> = {};
    keywords.forEach(kw => {
      const matches = text.match(new RegExp(kw, 'g'));
      if (matches) {
        counts[kw] = matches.length;
      }
    });
    return Object.entries(counts).map(([text, value]) => ({ text, value }));
  }, [logs]);

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white h-full flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="bg-purple-600 text-white p-2 rounded-xl shadow-lg shadow-purple-200">📊</span>
        <h2 className="text-xl font-bold text-slate-800">数据可视化结构图</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
        {/* Line Chart */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-slate-500 text-center">环境数据折线图</h3>
          <div className="h-48 border border-slate-100 rounded-2xl p-2 bg-slate-50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis dataKey="time" hide />
                <YAxis width={30} tick={{ fontSize: 10 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} name="温度(℃)" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} name="湿度(%)" />
                <Line type="monotone" dataKey="light" stroke="#eab308" strokeWidth={2} dot={false} name="光照" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-slate-500 text-center">控制指令分布饼图</h3>
          <div className="h-48 border border-slate-100 rounded-2xl p-2 bg-slate-50 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">暂无控制指令数据</span>
            )}
          </div>
        </div>

        {/* Word Cloud */}
        <div className="flex flex-col gap-2 lg:col-span-1 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-500 text-center">日志热点词云图</h3>
          <div className="h-48 border border-slate-100 rounded-2xl p-4 bg-slate-50 flex flex-wrap items-center justify-center gap-3 overflow-hidden">
            {wordCloudWords.length > 0 ? wordCloudWords.map((w, i) => {
              const size = Math.min(Math.max(w.value * 3 + 10, 12), 32);
              const opacity = Math.min(Math.max(w.value * 0.1 + 0.4, 0.4), 1);
              return (
                <span 
                  key={i} 
                  style={{ fontSize: `${size}px`, opacity }} 
                  className="font-black text-rose-500 transition-all hover:scale-110 cursor-default"
                >
                  {w.text}
                </span>
              );
            }) : (
              <span className="text-xs text-slate-400 italic">暂无日志关键词</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
