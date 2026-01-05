
import React from 'react';
import { MqttMessage } from '../types';

interface MqttBrokerProps {
  messages: MqttMessage[];
}

const MqttBroker: React.FC<MqttBrokerProps> = ({ messages }) => {
  return (
    <div className="bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          MQTT 消息代理服务器 (Broker)
        </h3>
        <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-mono">
          1883/TCP
        </span>
      </div>

      <div className="flex-grow overflow-hidden relative">
        <div className="absolute inset-0 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col p-3 overflow-y-auto font-mono text-[10px]">
          {messages.length === 0 ? (
            <div className="text-slate-600 italic text-center mt-10">等待主题发布...</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-2 pb-2 border-b border-slate-800 animate-fadeIn">
                <div className="flex justify-between items-start mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${msg.type === 'pub' ? 'bg-blue-900 text-blue-300' : 'bg-purple-900 text-purple-300'}`}>
                    {msg.type === 'pub' ? 'PUBLISH' : 'DELIVER'}
                  </span>
                  <span className="text-slate-500">From: {msg.from}</span>
                </div>
                <div className="text-blue-400">Topic: <span className="text-slate-300">{msg.topic}</span></div>
                <div className="text-green-400 truncate">Payload: <span className="text-slate-100">{msg.payload}</span></div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          发布者 (Publisher)
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
          订阅者 (Subscriber)
        </div>
      </div>
    </div>
  );
};

export default MqttBroker;
