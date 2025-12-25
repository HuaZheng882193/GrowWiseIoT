
import React from 'react';
import { SensorData, SystemStatus } from '../types';

interface SimulationPanelProps {
  sensors: SensorData;
  status: SystemStatus;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ sensors, status }) => {
  // Calculate a background color based on light intensity
  const lightOverlayOpacity = Math.min(status.isLightOn ? 0.3 : 0, 0.5);
  
  return (
    <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 h-full flex flex-col items-center justify-between border-4 border-slate-800 relative overflow-hidden transition-colors duration-500">
      
      {/* Grow Light System (Top) */}
      <div className="w-full flex justify-center pt-2 z-20">
        <div className={`relative transition-all duration-500 ${status.isLightOn ? 'opacity-100' : 'opacity-20'}`}>
          <div className="w-48 h-4 bg-slate-700 rounded-full border border-slate-600 flex justify-around items-center px-4">
             {[...Array(6)].map((_, i) => (
               <div key={i} className={`w-2 h-2 rounded-full ${status.isLightOn ? 'bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,1)]' : 'bg-slate-500'}`}></div>
             ))}
          </div>
          {status.isLightOn && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-300/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Main Stage */}
      <div className="relative flex-grow flex items-center justify-center w-full">
        
        {/* Cooling Fan (Side) */}
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${status.isFanOn ? 'opacity-100 scale-110' : 'opacity-30'}`}>
          <div className={`text-5xl ${status.isFanOn ? 'animate-[spin_0.5s_linear_infinite]' : ''}`}>
            🌀
          </div>
          <div className="text-[10px] text-blue-300 font-bold text-center mt-1">风扇{status.isFanOn ? '运行中' : '停止'}</div>
        </div>

        {/* Watering Pipe (Side) */}
        <div className={`absolute left-4 top-1/3 transition-all duration-300 ${status.isPumpOn ? 'opacity-100' : 'opacity-0'}`}>
           <div className="flex flex-col items-center">
              <div className="w-2 h-12 bg-blue-500/50 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col items-center animate-[slideDown_1s_linear_infinite]">
                   <div className="w-1 h-2 bg-blue-300 rounded-full mb-2"></div>
                   <div className="w-1 h-2 bg-blue-300 rounded-full mb-2"></div>
                   <div className="w-1 h-2 bg-blue-300 rounded-full mb-2"></div>
                </div>
              </div>
              <div className="text-3xl mt-2">🚿</div>
           </div>
        </div>

        {/* Plant and Pot */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Plant Icon */}
          <div className={`text-9xl transition-all duration-1000 transform drop-shadow-2xl ${sensors.humidity < 30 ? 'saturate-50 brightness-75 -rotate-6' : 'saturate-100'}`}>
            {sensors.humidity < 20 ? '🥀' : sensors.humidity < 40 ? '🌿' : '🪴'}
          </div>
          
          {/* Soil/Pot */}
          <div className="w-32 h-12 bg-amber-900 rounded-b-xl border-t-4 border-amber-800 shadow-xl relative mt-[-10px]">
            {/* Water ripples in pot */}
            {status.isPumpOn && (
              <div className="absolute inset-0 overflow-hidden rounded-b-xl">
                 <div className="absolute inset-0 bg-blue-400/20 animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Status Indicators */}
      <div className="w-full grid grid-cols-3 gap-2 mt-4 z-20">
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center">
          <div className="text-[10px] text-blue-400 uppercase">湿度</div>
          <div className="text-lg font-bold text-white">{sensors.humidity}%</div>
        </div>
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center">
          <div className="text-[10px] text-orange-400 uppercase">温度</div>
          <div className="text-lg font-bold text-white">{sensors.temperature}°C</div>
        </div>
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-center">
          <div className="text-[10px] text-yellow-400 uppercase">光照</div>
          <div className="text-lg font-bold text-white">{sensors.light}</div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
      `}} />
    </div>
  );
};

export default SimulationPanel;
