
import { GoogleGenAI, Type } from "@google/genai";
import { SensorData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartAnalysis = async (data: SensorData) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `作为一名初中信息技术老师，请分析以下物联花盆的传感器数据：
      温度: ${data.temperature}°C, 土壤湿度: ${data.humidity}%, 光照强度: ${data.light}Lux。
      请简洁地说明当前植物的状态，以及物联网系统应该如何自动处理（比如是否需要浇水、开灯等）。
      字数控制在150字以内，语言要通俗易懂。`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "暂时无法获取AI分析，请检查网络连接。";
  }
};
