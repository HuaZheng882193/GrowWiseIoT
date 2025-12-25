
import React, { useState, useEffect } from 'react';
import { ModuleType, SensorData, SystemStatus, LogEntry } from './types';
import ModuleNode from './components/ModuleNode';
import SimulationPanel from './components/SimulationPanel';

const App: React.FC = () => {
  // State for sensors
  const [sensors, setSensors] = useState<SensorData>({
    temperature: 25,
    humidity: 45,
    light: 500
  });

  // State for system status
  const [status, setStatus] = useState<SystemStatus>({
    isPumpOn: false,
    isLightOn: false,
    isFanOn: false,
    lastUpdate: new Date().toLocaleTimeString()
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  // System logic: Automating reactions based on sensor data
  useEffect(() => {
    let changed = false;
    const nextStatus = { ...status };

    // 1. Pump logic: water if dry
    if (sensors.humidity < 30 && !status.isPumpOn) {
      nextStatus.isPumpOn = true;
      addLog(ModuleType.EXECUTION, "检测到低湿度！执行命令：启动水泵浇水");
      changed = true;
    } else if (sensors.humidity >= 50 && status.isPumpOn) {
      nextStatus.isPumpOn = false;
      addLog(ModuleType.EXECUTION, "湿度已恢复，执行命令：停止水泵");
      changed = true;
    }

    // 2. Light logic: supplemental light if dark
    if (sensors.light < 200 && !status.isLightOn) {
      nextStatus.isLightOn = true;
      addLog(ModuleType.EXECUTION, "检测到光照不足！执行命令：开启补光灯");
      changed = true;
    } else if (sensors.light > 600 && status.isLightOn) {
      nextStatus.isLightOn = false;
      addLog(ModuleType.EXECUTION, "光照已充足，执行命令：关闭补光灯");
      changed = true;
    }

    // 3. Fan logic: cooling if hot
    if (sensors.temperature > 30 && !status.isFanOn) {
      nextStatus.isFanOn = true;
      addLog(ModuleType.EXECUTION, "检测到高温环境！执行命令：开启散热风扇");
      changed = true;
    } else if (sensors.temperature <= 27 && status.isFanOn) {
      nextStatus.isFanOn = false;
      addLog(ModuleType.EXECUTION, "温度已下降，执行命令：关闭散热风扇");
      changed = true;
    }

    if (changed) {
      setStatus({ ...nextStatus, lastUpdate: new Date().toLocaleTimeString() });
    }
  }, [sensors, status]);

  const addLog = (module: ModuleType, message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      module,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 15));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
          物联花盆系统 <span className="text-blue-600">模拟程序</span>
        </h1>
        <div className="mt-2 inline-flex items-center gap-2 px-4 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-widest font-mono">System Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow max-w-7xl mx-auto w-full">
        
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* IoT Elements Module (Top) */}
          <section className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-700">
              <span className="bg-green-100 p-2 rounded-xl text-lg">🧩</span> 
              <span>物联网系统四要素</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ModuleNode 
                type={ModuleType.SENSING}
                icon="📡"
                description="数据采集"
                onClick={() => {}}
              />
              <ModuleNode 
                type={ModuleType.COMMUNICATION}
                icon="📶"
                description="数据传输"
                onClick={() => {}}
              />
              <ModuleNode 
                type={ModuleType.PLATFORM}
                icon="☁️"
                description="决策中心"
                onClick={() => {}}
              />
              <ModuleNode 
                type={ModuleType.EXECUTION}
                icon="🦾"
                description="执行动作"
                onClick={() => {}}
              />
            </div>
            <div className="mt-4 flex justify-between items-center px-2">
               <div className="h-px bg-slate-100 flex-grow mx-2"></div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">物理层 ↔ 网络层 ↔ 应用层</span>
               <div className="h-px bg-slate-100 flex-grow mx-2"></div>
            </div>
          </section>

          {/* Manual Control Module (Bottom) */}
          <section className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-700">
              <span className="bg-blue-100 p-2 rounded-xl text-lg">🎮</span> 
              <span>手动模拟环境变化</span>
            </h2>
            <div className="space-y-8">
              {/* Humidity Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-50 rounded-lg">💧</span>
                    <span className="font-semibold text-slate-600">土壤湿度</span>
                  </div>
                  <span className="text-xl font-black text-blue-600 font-mono">{sensors.humidity}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={sensors.humidity}
                  onChange={(e) => setSensors({...sensors, humidity: parseInt(e.target.value)})}
                  className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Light Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-yellow-50 rounded-lg">☀️</span>
                    <span className="font-semibold text-slate-600">光照强度</span>
                  </div>
                  <span className="text-xl font-black text-yellow-600 font-mono">{sensors.light} Lux</span>
                </div>
                <input 
                  type="range" min="0" max="1000" value={sensors.light}
                  onChange={(e) => setSensors({...sensors, light: parseInt(e.target.value)})}
                  className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
              </div>

              {/* Temperature Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-red-50 rounded-lg">🌡️</span>
                    <span className="font-semibold text-slate-600">环境温度</span>
                  </div>
                  <span className="text-xl font-black text-red-600 font-mono">{sensors.temperature}°C</span>
                </div>
                <input 
                  type="range" min="0" max="50" value={sensors.temperature}
                  onChange={(e) => setSensors({...sensors, temperature: parseInt(e.target.value)})}
                  className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 space-y-6 flex flex-col">
          
          {/* Simulation Visualization */}
          <div className="h-[420px] flex-shrink-0">
            <SimulationPanel sensors={sensors} status={status} />
          </div>

          {/* System Status and Logs */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col flex-grow">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700">
              <span className="bg-slate-100 p-2 rounded-xl text-lg">📊</span> 
              <span>执行器状态与日志</span>
            </h2>
            
            {/* Status Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center ${status.isPumpOn ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-2xl mb-1">🚿</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">水泵</span>
                <span className={`text-sm font-black ${status.isPumpOn ? 'text-blue-600' : 'text-slate-400'}`}>{status.isPumpOn ? '正在浇水' : '已停止'}</span>
              </div>
              <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center ${status.isLightOn ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-2xl mb-1">💡</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">补光</span>
                <span className={`text-sm font-black ${status.isLightOn ? 'text-yellow-600' : 'text-slate-400'}`}>{status.isLightOn ? '运行中' : '已关闭'}</span>
              </div>
              <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center ${status.isFanOn ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-2xl mb-1">🌀</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">风扇</span>
                <span className={`text-sm font-black ${status.isFanOn ? 'text-cyan-600' : 'text-slate-400'}`}>{status.isFanOn ? '运行中' : '已停止'}</span>
              </div>
            </div>

            {/* Log Terminal */}
            <div className="flex-grow flex flex-col">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">系统实时日志 (Real-time Logs)</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-green-600 font-bold">已连接</span>
                </div>
              </div>
              <div className="bg-slate-900 text-green-400 p-5 rounded-2xl font-mono text-xs overflow-y-auto h-[160px] shadow-inner border border-slate-800">
                {logs.map(log => (
                  <div key={log.id} className="mb-2 border-l border-green-900 pl-3">
                    <span className="text-slate-500 opacity-70">[{log.timestamp.split(' ')[0]}]</span> 
                    <span className="text-blue-400 font-bold ml-2">[{log.module}]</span> 
                    <span className="ml-2 text-slate-100">{log.message}</span>
                  </div>
                ))}
                {logs.length === 0 && <div className="text-slate-600 italic">等待传感器反馈数据...</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-slate-400 text-xs font-medium">
        8年级信息技术课程演示专用 · 物联网系统功能模块实拟程序
      </footer>
    </div>
  );
};

export default App;
