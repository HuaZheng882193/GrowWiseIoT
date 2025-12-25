
export enum ModuleType {
  SENSING = '环境感知模块',
  COMMUNICATION = '网络通信模块',
  PLATFORM = '服务平台模块',
  EXECUTION = '执行模块'
}

export interface SensorData {
  temperature: number;
  humidity: number;
  light: number;
}

export interface SystemStatus {
  isPumpOn: boolean;
  isLightOn: boolean;
  isFanOn: boolean;
  lastUpdate: string;
}

export interface LogEntry {
  id: string;
  module: ModuleType;
  message: string;
  timestamp: string;
}
