import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { SensorData, LogEntry, MqttMessage } from '../types';

interface DataDashboardProps {
  currentSensors: SensorData;
  mqttMessages: MqttMessage[];
  logs: LogEntry[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100 min-w-[120px]">
        <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-medium text-slate-600">{entry.name}</span>
              </div>
              <span className="text-xs font-bold text-slate-900">{entry.value}{entry.unit}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DataDashboard({ currentSensors, mqttMessages, logs }: DataDashboardProps) {
  const [history, setHistory] = useState<(SensorData & { time: string })[]>([]);

  useEffect(() => {
    setHistory(prev => {
      const newEntry = {
        ...currentSensors,
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      return [...prev, newEntry].slice(-20);
    });
  }, [currentSensors]);

  const pieData = useMemo(() => {
    let pumpCount = 0;
    let lightCount = 0;
    let fanCount = 0;

    mqttMessages.forEach(msg => {
      if (msg.topic.includes('commands') && msg.type === 'pub') {
        try {
          const payload = JSON.parse(msg.payload);
          if (payload.pump !== undefined) pumpCount++;
          if (payload.light !== undefined) lightCount++;
          if (payload.fan !== undefined) fanCount++;
        } catch (e) {}
      }
    });

    return [
      { name: '水泵', value: pumpCount, color: '#3b82f6' },
      { name: '补光灯', value: lightCount, color: '#eab308' },
      { name: '风扇', value: fanCount, color: '#06b6d4' }
    ].filter(d => d.value > 0);
  }, [mqttMessages]);

  // Precise Device-Action Pair Word Cloud Data
  const wordCloudWords = useMemo(() => {
    const counts: Record<string, { value: number; category: string }> = {};
    
    mqttMessages.forEach(msg => {
      if (msg.topic.includes('commands')) {
        try {
          const payload = JSON.parse(msg.payload);
          // Count specific device-action pairs
          if (payload.pump === 'ON') {
            counts['水泵开启'] = { value: (counts['水泵开启']?.value || 0) + 1, category: 'pump' };
          } else if (payload.pump === 'OFF') {
            counts['水泵关闭'] = { value: (counts['水泵关闭']?.value || 0) + 1, category: 'pump' };
          }
          
          if (payload.fan === 'ON') {
            counts['风扇运行'] = { value: (counts['风扇运行']?.value || 0) + 1, category: 'fan' };
          } else if (payload.fan === 'OFF') {
            counts['风扇停止'] = { value: (counts['风扇停止']?.value || 0) + 1, category: 'fan' };
          }
          
          if (payload.light === 'ON') {
            counts['补光开启'] = { value: (counts['补光开启']?.value || 0) + 1, category: 'light' };
          } else if (payload.light === 'OFF') {
            counts['补光关闭'] = { value: (counts['补光关闭']?.value || 0) + 1, category: 'light' };
          }
        } catch (e) {}
      }
    });

    return Object.entries(counts).map(([text, data]) => ({
      text,
      value: data.value,
      category: data.category
    })).sort((a, b) => b.value - a.value);
  }, [mqttMessages]);

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white h-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">数据可视化大屏</h2>
            <p className="text-xs font-medium text-slate-400">实时监控物联网系统运行状态</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        {/* Line Chart Section */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span>
              实时环境数据趋势
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-[10px] font-bold text-slate-500">温度</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-bold text-slate-500">湿度</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[10px] font-bold text-slate-500">光照</span>
              </div>
            </div>
          </div>
          
          <div className="flex-grow min-h-[280px] border border-slate-100 rounded-[2rem] p-6 bg-slate-50/50 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/5 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-rose-500/10 transition-colors duration-700"></div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }} name="温度" unit="℃" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} name="湿度" unit="" />
                <Line type="monotone" dataKey="light" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }} name="光照" unit="" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 italic px-2">提示：展示最近20组采样数据，帮助分析设备动作带来的环境变化。</p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Pie Chart Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
              设备指令分类
            </h3>
            <div className="h-56 border border-slate-100 rounded-[2rem] p-4 bg-slate-50/50 flex flex-col items-center justify-center">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={8} dataKey="value" animationDuration={1000}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                        <span className="text-[10px] font-bold text-slate-600">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <span className="text-2xl">📡</span>
                  <span className="text-[10px] font-bold text-slate-400">等待指令</span>
                </div>
              )}
            </div>
          </div>

          {/* Device Action Word Cloud */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 text-blue-800">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
              设备动作热词统计
              <span className="ml-auto text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">动作追踪</span>
            </h3>
            <div className="h-64 border border-blue-100 rounded-[2.5rem] p-6 bg-gradient-to-br from-blue-50/30 to-white flex flex-wrap items-center justify-center gap-3 overflow-hidden content-center relative group shadow-inner">
              <div className="absolute inset-0 bg-grid-blue-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.4))] -z-10"></div>
              {wordCloudWords.length > 0 ? wordCloudWords.map((w, i) => {
                const categoryStyles: Record<string, string> = {
                  pump: 'bg-blue-500 text-white border-blue-400 shadow-blue-100',
                  fan: 'bg-cyan-500 text-white border-cyan-400 shadow-cyan-100',
                  light: 'bg-amber-500 text-white border-amber-400 shadow-amber-100'
                };
                
                return (
                  <div 
                    key={i}
                    className={`
                      relative px-4 py-2 rounded-2xl border font-black transition-all hover:scale-110 cursor-default shadow-sm 
                      flex items-center gap-2 animate-slow-float
                      ${categoryStyles[w.category] || 'bg-slate-50 text-slate-500'}
                    `}
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    <span className="text-[13px]">{w.text}</span>
                    <span className="text-[9px] bg-white text-slate-800 px-1.5 py-0.5 rounded-full shadow-sm font-black min-w-[1.25rem] text-center">
                      {w.value}
                    </span>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center gap-3 opacity-30 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest font-mono">No Actions Detected</span>
                </div>
              )}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes slow-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
              .animate-slow-float {
                animation: slow-float 4s ease-in-out infinite;
              }
              .bg-grid-blue-100 {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(59 130 246 / 0.1)'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
              }
            `}} />
          </div>
        </div>
      </div>
    </div>
  );
}
