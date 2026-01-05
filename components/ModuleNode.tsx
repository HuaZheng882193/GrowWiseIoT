
import React from 'react';
import { ModuleType } from '../types';

interface ModuleNodeProps {
  type: ModuleType;
  icon: React.ReactNode;
  active?: boolean;
  description: string;
  onClick: () => void;
}

const ModuleNode: React.FC<ModuleNodeProps> = ({ type, icon, active, description, onClick }) => {
  const getThemeColor = () => {
    switch (type) {
      case ModuleType.SENSING: return 'border-blue-200 bg-blue-50 text-blue-600';
      case ModuleType.COMMUNICATION: return 'border-emerald-200 bg-emerald-50 text-emerald-600';
      case ModuleType.PLATFORM: return 'border-purple-200 bg-purple-50 text-purple-600';
      case ModuleType.EXECUTION: return 'border-orange-200 bg-orange-50 text-orange-600';
      default: return 'border-slate-200 bg-slate-50';
    }
  };

  return (
    <div 
      className={`p-3 border-2 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center transition-all ${getThemeColor()}`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <h3 className="font-bold text-[10px] uppercase tracking-tighter">{type}</h3>
      <p className="text-[9px] opacity-70 mt-1 font-medium">{description}</p>
    </div>
  );
};

export default ModuleNode;
