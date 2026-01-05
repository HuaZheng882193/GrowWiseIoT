
import React, { useState, useEffect, useCallback } from 'react';
import { ModuleType, SensorData, SystemStatus, LogEntry, MqttMessage } from './types';
import ModuleNode from './components/ModuleNode';
import SimulationPanel from './components/SimulationPanel';
import MqttBroker from './components/MqttBroker';

const App: React.FC = () => {
  const [sensors, setSensors] = useState<SensorData>({
    temperature: 25,
    humidity: 45,
    light: 500
  });

  const [status, setStatus] = useState<SystemStatus>({
    isPumpOn: false,
    isLightOn: false,
    isFanOn: false,
    lastUpdate: new Date().toLocaleTimeString()
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mqttMessages, setMqttMessages] = useState<MqttMessage[]>([]);

  const addLog = useCallback((module: ModuleType | 'MQTT Broker', message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      module,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 15));
  }, []);

  const sendMqttMessage = useCallback((topic: string, payload: any, from: string, type: 'pub' | 'sub' = 'pub') => {
    const msg: MqttMessage = {
      id: Math.random().toString(36).substr(2, 9),
      topic,
      payload: typeof payload === 'object' ? JSON.stringify(payload) : String(payload),
      from,
      type
    };
    setMqttMessages(prev => [msg, ...prev].slice(0, 20));
    
    if (type === 'pub') {
      addLog('MQTT Broker', `收到来自 [${from}] 的消息，主题: ${topic}`);
    } else {
      addLog('MQTT Broker', `向订阅者转发消息，主题: ${topic}`);
    }
  }, [addLog]);

  useEffect(() => {
    const timer = setTimeout(() => {
      sendMqttMessage('iot/flowerpot/sensors', sensors, '感知模块', 'pub');
      
      setTimeout(() => {
        sendMqttMessage('iot/flowerpot/sensors', sensors, '云平台', 'sub');
        
        let commandTopic = 'iot/flowerpot/commands';
        let commands: any = {};
        
        if (sensors.humidity < 30) commands.pump = 'ON';
        else if (sensors.humidity >= 50) commands.pump = 'OFF';
        
        if (sensors.light < 200) commands.light = 'ON';
        else if (sensors.light > 600) commands.light = 'OFF';
        
        if (sensors.temperature > 30) commands.fan = 'ON';
        else if (sensors.temperature <= 27) commands.fan = 'OFF';

        if (Object.keys(commands).length > 0) {
          sendMqttMessage(commandTopic, commands, '云平台', 'pub');
          
          setTimeout(() => {
            sendMqttMessage(commandTopic, commands, '执行模块', 'sub');
            
            setStatus(prev => {
              const next = { ...prev };
              let changed = false;
              if (commands.pump === 'ON' && !prev.isPumpOn) { next.isPumpOn = true; changed = true; }
              if (commands.pump === 'OFF' && prev.isPumpOn) { next.isPumpOn = false; changed = true; }
              if (commands.light === 'ON' && !prev.isLightOn) { next.isLightOn = true; changed = true; }
              if (commands.light === 'OFF' && prev.isLightOn) { next.isLightOn = false; changed = true; }
              if (commands.fan === 'ON' && !prev.isFanOn) { next.isFanOn = true; changed = true; }
              if (commands.fan === 'OFF' && prev.isFanOn) { next.isFanOn = false; changed = true; }
              return changed ? { ...next, lastUpdate: new Date().toLocaleTimeString() } : prev;
            });
          }, 400);
        }
      }, 400);
    }, 500);

    return () => clearTimeout(timer);
  }, [sensors, sendMqttMessage]);

  const clearAllLogs = () => {
    setLogs([]);
    setMqttMessages([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-4 md:p-6 lg:p-8 font-sans">
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            物联花盆 <span className="text-blue-600">教学模拟平台</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">8年级信息技术课程 · 物联网系统架构实操</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-slate-600 font-mono">BROKER: 127.0.0.1</span>
          </div>
          <button 
            onClick={clearAllLogs}
            className="px-4 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl shadow-sm border border-slate-200 transition-all text-xs font-bold"
          >
            重置实验数据
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow max-w-screen-2xl mx-auto w-full">
        
        {/* Row 1: The Interaction & Feedback Layer (Hero Section) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <span className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200">🎮</span>
              <h2 className="text-xl font-bold text-slate-800">环境模拟控制</h2>
            </div>
            
            <div className="space-y-10 flex-grow">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> 土壤湿度
                  </span>
                  <span className="text-2xl font-black text-blue-600 font-mono">{sensors.humidity}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={sensors.humidity}
                  onChange={(e) => setSensors({...sensors, humidity: parseInt(e.target.value)})}
                  className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> 光照强度
                  </span>
                  <span className="text-2xl font-black text-yellow-600 font-mono">{sensors.light}</span>
                </div>
                <input 
                  type="range" min="0" max="1000" value={sensors.light}
                  onChange={(e) => setSensors({...sensors, light: parseInt(e.target.value)})}
                  className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> 环境温度
                  </span>
                  <span className="text-2xl font-black text-red-600 font-mono">{sensors.temperature}°C</span>
                </div>
                <input 
                  type="range" min="0" max="50" value={sensors.temperature}
                  onChange={(e) => setSensors({...sensors, temperature: parseInt(e.target.value)})}
                  className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] text-slate-400 leading-relaxed">
              提示：调节滑块模拟自然环境变化，观察右侧执行器如何通过 MQTT 协议自动响应。
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
            {/* Simulation Panel occupies 2 columns */}
            <div className="md:col-span-2 h-[450px]">
              <SimulationPanel sensors={sensors} status={status} />
            </div>
            
            {/* Status Panel occupies 1 column */}
            <div className="flex flex-col gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-lg border border-white flex-grow">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">实时运行状态</h3>
                <div className="flex flex-col gap-3">
                  <div className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${status.isPumpOn ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase opacity-60">水泵</span>
                      <span className="text-sm font-black">{status.isPumpOn ? '正在工作' : '待机'}</span>
                    </div>
                    <span className="text-2xl">🚿</span>
                  </div>
                  <div className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${status.isLightOn ? 'bg-yellow-50 border-yellow-100 text-yellow-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase opacity-60">补光灯</span>
                      <span className="text-sm font-black">{status.isLightOn ? '开启' : '关闭'}</span>
                    </div>
                    <span className="text-2xl">💡</span>
                  </div>
                  <div className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${status.isFanOn ? 'bg-cyan-50 border-cyan-100 text-cyan-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase opacity-60">散热风扇</span>
                      <span className="text-sm font-black">{status.isFanOn ? '运行' : '停止'}</span>
                    </div>
                    <span className="text-2xl">🌀</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800 p-5 rounded-3xl shadow-lg border border-slate-700 text-white">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">最近更新时间</h3>
                <p className="text-lg font-mono font-bold text-blue-400">{status.lastUpdate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: The Logic & Data Layer (Architecture) */}
        <div className="lg:col-span-3">
          <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white h-full">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-200">🧩</span>
              <h2 className="text-lg font-bold text-slate-800">物联网四要素</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <ModuleNode type={ModuleType.SENSING} icon="📡" description="获取环境数据" onClick={() => {}} />
              <ModuleNode type={ModuleType.COMMUNICATION} icon="📶" description="MQTT 消息传递" onClick={() => {}} />
              <ModuleNode type={ModuleType.PLATFORM} icon="☁️" description="逻辑决策与下发" onClick={() => {}} />
              <ModuleNode type={ModuleType.EXECUTION} icon="🦾" description="物理动作响应" onClick={() => {}} />
            </div>
          </section>
        </div>

        <div className="lg:col-span-5">
          <MqttBroker messages={mqttMessages} />
        </div>

        <div className="lg:col-span-4">
          <section className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="bg-slate-800 text-white p-2 rounded-xl shadow-lg shadow-slate-200">📜</span>
                <h2 className="text-lg font-bold text-slate-800">系统运行日志</h2>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-green-700 font-black">监控中</span>
              </div>
            </div>
            
            <div className="bg-slate-900 text-green-400 p-5 rounded-3xl font-mono text-[10px] overflow-y-auto flex-grow shadow-inner border border-slate-800 scrollbar-hide">
              {logs.map(log => (
                <div key={log.id} className="mb-3 border-l-2 border-green-900 pl-3 animate-fadeIn last:border-green-500">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-slate-500 opacity-70">[{log.timestamp.split(' ')[0]}]</span> 
                    <span className={`${log.module === 'MQTT Broker' ? 'text-yellow-400' : 'text-blue-400'} font-bold`}>
                      {log.module}
                    </span>
                  </div>
                  <div className="text-slate-100 leading-snug">{log.message}</div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                  <div className="text-4xl">📡</div>
                  <div className="text-center italic">等待系统初始化数据...</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
        Designed for 8th Grade Information Technology · Education Simulation 1.0
      </footer>
    </div>
  );
};

export default App;
