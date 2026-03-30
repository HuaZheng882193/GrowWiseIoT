
import React, { useState, useEffect, useCallback } from 'react';
import { ModuleType, SensorData, SystemStatus, LogEntry, MqttMessage } from './types';
import ModuleNode from './components/ModuleNode';
import SimulationPanel from './components/SimulationPanel';
import MqttBroker from './components/MqttBroker';
import DataDashboard from './components/DataDashboard';
import AIAssistant from './components/AIAssistant';

const App: React.FC = () => {
  const [sensors, setSensors] = useState<SensorData>({
    temperature: 25,
    humidity: 900,
    light: 1000,
    forecastRain: false
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
    setMqttMessages(prev => [msg, ...prev].slice(0, 100));
    
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
        
        // --- 智能灌溉算法：逻辑与决策 ---
        if (sensors.humidity < 1000) {
          commands.pump = 'ON'; // 场景一：极度干燥 -> 水泵打开
        } else {
          if (sensors.forecastRain) {
            commands.pump = 'OFF'; // 场景三：天气预报接雨 -> 水泵关闭, 防止积水
          } else {
            if (sensors.light > 1200) {
              // 场景二：光照强烈 -> 湿度下限提升至 1500，提前触发灌溉
              if (sensors.humidity < 1500) {
                commands.pump = 'ON';
              } else {
                commands.pump = 'OFF';
              }
            } else {
              commands.pump = 'OFF'; // 默认关闭水泵
            }
          }
        }
        
        if (sensors.light < 500) commands.light = 'ON';
        else if (sensors.light > 1500) commands.light = 'OFF';
        
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

  const openApiJsonInNewTab = () => {
    const apiResponse = {
      status: "success",
      timestamp: new Date().toISOString(),
      device_id: "flowerpot_001",
      data_count: mqttMessages.length,
      messages: mqttMessages.map(msg => ({
        id: msg.id,
        direction: msg.type === 'pub' ? 'inbound' : 'outbound',
        source: msg.from,
        topic: msg.topic,
        payload: msg.payload
      }))
    };
    
    const jsonString = JSON.stringify(apiResponse, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const exportMqttToExcel = () => {
    if (mqttMessages.length === 0) return alert("暂无数据可供导出");

    const headers = ["时间", "交互动作", "来源/去向模块", "业务主题(含义)", "消息详细内容"];
    const sensorStats = { temp: [] as number[], humi: [] as number[], light: [] as number[] };

    const csvContent = mqttMessages.map(msg => {
      const time = new Date().toLocaleTimeString();
      const typeStr = msg.type === 'pub' ? "【发布】上报数据" : "【投递】转发指令";
      let chineseTopic = msg.topic;
      if (msg.topic.includes('sensors')) chineseTopic = "环境数据上报 (Sensors)";
      if (msg.topic.includes('commands')) chineseTopic = "系统控制指令 (Commands)";

      let readablePayload = msg.payload;
      try {
        const data = JSON.parse(msg.payload);
        if (msg.topic.includes('sensors')) {
          readablePayload = `温度:${data.temperature}℃ | 湿度:${data.humidity} | 光照:${data.light}`;
          if (msg.type === 'pub') {
            sensorStats.temp.push(data.temperature);
            sensorStats.humi.push(data.humidity);
            sensorStats.light.push(data.light);
          }
        } else if (msg.topic.includes('commands')) {
          const cmds = [];
          if (data.pump) cmds.push(`水泵:${data.pump === 'ON' ? '开启' : '关闭'}`);
          if (data.light) cmds.push(`补光灯:${data.light === 'ON' ? '开启' : '关闭'}`);
          if (data.fan) cmds.push(`风扇:${data.fan === 'ON' ? '开启' : '关闭'}`);
          readablePayload = cmds.join("；");
        }
      } catch (e) {}

      return [time, typeStr, msg.from, chineseTopic, `"${readablePayload}"`].join(",");
    });

    const statsSummary = [];
    if (sensorStats.temp.length > 0) {
      statsSummary.push("\n--- 实验数据统计汇总 ---");
      statsSummary.push(`统计项目,最大值,最小值,单位`);
      statsSummary.push(`环境温度,${Math.max(...sensorStats.temp)},${Math.min(...sensorStats.temp)},℃`);
      statsSummary.push(`土壤湿度,${Math.max(...sensorStats.humi)},${Math.min(...sensorStats.humi)},模拟量`);
      statsSummary.push(`光照强度,${Math.max(...sensorStats.light)},${Math.min(...sensorStats.light)},模拟量`);
      statsSummary.push(`样本数量,${sensorStats.temp.length},,,次`);
    }

    const finalCsv = "\uFEFF" + [headers.join(","), ...csvContent, ...statsSummary].join("\n");
    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `物联花盆_实验报表(含统计)_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow max-w-screen-2xl mx-auto w-full">
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
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> 土壤湿度 (模拟量)
                  </span>
                  <span className="text-2xl font-black text-blue-600 font-mono">{sensors.humidity}</span>
                </div>
                <input 
                  type="range" min="0" max="4000" value={sensors.humidity}
                  onChange={(e) => setSensors({...sensors, humidity: parseInt(e.target.value)})}
                  className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> 光照强度 (模拟量)
                  </span>
                  <span className="text-2xl font-black text-yellow-600 font-mono">{sensors.light}</span>
                </div>
                <input 
                  type="range" min="0" max="4000" value={sensors.light}
                  onChange={(e) => setSensors({...sensors, light: parseInt(e.target.value)})}
                  className="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-yellow-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> 天气预报 (API)
                  </span>
                  <span className={`text-xl font-black font-mono ${sensors.forecastRain ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {sensors.forecastRain ? '🌧️ 预报有雨' : '☀️ 晴朗'}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <button 
                    onClick={() => setSensors({...sensors, forecastRain: false})}
                    className={`flex-1 py-1.5 rounded-xl text-sm font-bold transition-all ${!sensors.forecastRain ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    无雨
                  </button>
                  <button 
                    onClick={() => setSensors({...sensors, forecastRain: true})}
                    className={`flex-1 py-1.5 rounded-xl text-sm font-bold transition-all ${sensors.forecastRain ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    有雨
                  </button>
                </div>
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
            <div className="md:col-span-2 h-[450px]">
              <SimulationPanel sensors={sensors} status={status} />
            </div>
            
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

        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* API Server Module */}
          <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">🔗</div>
              <div>
                <h3 className="text-sm font-black text-slate-800">模拟 API 服务接口</h3>
                <code className="text-[10px] text-slate-400">GET /api/v1/mqtt/logs</code>
              </div>
            </div>
            <button 
              onClick={openApiJsonInNewTab}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all flex items-center gap-2"
            >
              🚀 调用 API (JSON)
            </button>
          </div>

          <div className="relative group flex-grow min-h-[400px]">
            <MqttBroker messages={mqttMessages} />
            <button 
              onClick={exportMqttToExcel}
              className="absolute top-14 right-10 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg transition-all active:scale-95"
              title="将通信报文导出为包含统计信息的报表"
            >
              📥 导出分析报表
            </button>
          </div>
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

        {/* Data Visualization & Intelligent Decision Row */}
        <div className="lg:col-span-8">
          <DataDashboard currentSensors={sensors} mqttMessages={mqttMessages} logs={logs} />
        </div>
        <div className="lg:col-span-4">
          <AIAssistant sensors={sensors} status={status} />
        </div>
      </div>

      <footer className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
        Designed for 8th Grade Information Technology · Education Simulation 1.0
      </footer>
    </div>
  );
};

export default App;
