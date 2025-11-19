import { AirQualityData, VibrationData } from '@/types';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface SensorContextType {
  vibrationData: VibrationData[];
  airQualityData: AirQualityData[];
  isLoading: boolean;
  refreshData: () => void;
  getLatestVibrationData: () => VibrationData | null;
  getLatestAirQualityData: () => AirQualityData | null;
  getVibrationDataByDateRange: (startDate: Date, endDate: Date) => VibrationData[];
  getAirQualityDataByDateRange: (startDate: Date, endDate: Date) => AirQualityData[];
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

interface SensorProviderProps {
  children: ReactNode;
}

// Datos de ejemplo para el sensor de vibración SW-18010
const generateVibrationData = (): VibrationData[] => {
  const data: VibrationData[] = [];
  const now = new Date();
  
  for (let i = 0; i < 10; i++) {
    const timestamp = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)); // Cada 2 horas
    
    // Simular detección de vibración (LOW = detectada, HIGH = no detectada)
    const isDetected = Math.random() < 0.3; // 30% probabilidad de detección
    const alarmActive = isDetected; // El buzzer se activa cuando hay vibración
    
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (isDetected) {
      status = 'critical'; // Vibración detectada es crítica
    }
    
    data.push({
      id: `vib_${i}`,
      sensorType: 'vibration',
      value: isDetected ? 1 : 0, // 1 = detectada, 0 = no detectada
      unit: 'binary',
      isDetected,
      alarmActive,
      timestamp,
      status
    });
  }
  
  return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Datos de ejemplo para el sensor de calidad de aire MQ-135
const generateAirQualityData = (): AirQualityData[] => {
  const data: AirQualityData[] = [];
  const now = new Date();
  
  for (let i = 0; i < 10; i++) {
    const timestamp = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)); // Cada 2 horas
    
    // Simular lectura ADC (0-4095 para ESP32 de 12 bits)
    const valorADC = Math.random() * 4095;
    const voltage = (valorADC / 4095.0) * 3.3; // Convertir a voltaje
    
    // Simular cálculo de Rs (resistencia del sensor)
    const RL = 10.0; // kΩ
    const Rs = ((3.3 * RL) / voltage) - RL;
    const Ro = 3.6; // Calibrado en aire limpio
    const ratio = Rs / Ro;
    
    // Función para calcular PPM basada en las curvas de sensibilidad del MQ-135
    const calcularPPM = (ratio: number, a: number, b: number) => {
      return Math.pow(10, (a * Math.log10(ratio) + b));
    };
    
    // Calcular concentraciones de gases usando las curvas del código Arduino
    const nh3 = calcularPPM(ratio, -0.42, 1.6);        // Amoníaco
    const c6h6 = calcularPPM(ratio, -0.34, 1.7);       // Benceno
    const alcohol = calcularPPM(ratio, -0.45, 1.5);    // Alcohol
    const co = calcularPPM(ratio, -0.38, 1.6);         // Monóxido de carbono
    const so2 = calcularPPM(ratio, -0.48, 1.7);        // Dióxido de azufre
    const humo = calcularPPM(ratio, -0.35, 1.8);       // Humo
    
    // Activar ventilador si hay humo o CO por encima de umbral (como en el código Arduino)
    const fanActive = humo > 100 || co > 50;
    
    // Determinar estado basado en los gases más peligrosos
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (humo > 50 || co > 30 || nh3 > 25) status = 'warning';
    if (humo > 100 || co > 50 || nh3 > 50) status = 'critical';
    
    data.push({
      id: `air_${i}`,
      sensorType: 'air_quality',
      value: Math.round(humo), // Usar humo como valor principal
      unit: 'ppm',
      nh3: Math.round(nh3 * 10) / 10,
      c6h6: Math.round(c6h6 * 10) / 10,
      alcohol: Math.round(alcohol * 10) / 10,
      co: Math.round(co * 10) / 10,
      so2: Math.round(so2 * 10) / 10,
      humo: Math.round(humo * 10) / 10,
      voltage: Math.round(voltage * 1000) / 1000,
      rs: Math.round(Rs * 100) / 100,
      ratio: Math.round(ratio * 1000) / 1000,
      fanActive,
      timestamp,
      status
    });
  }
  
  return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const SensorProvider: React.FC<SensorProviderProps> = ({ children }) => {
  const [vibrationData, setVibrationData] = useState<VibrationData[]>([]);
  const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    setIsLoading(true);
    // Simular carga de datos
    setTimeout(() => {
      setVibrationData(generateVibrationData());
      setAirQualityData(generateAirQualityData());
      setIsLoading(false);
    }, 1000);
  };

  const refreshData = () => {
    setIsLoading(true);
    // Simular actualización de datos
    setTimeout(() => {
      setVibrationData(generateVibrationData());
      setAirQualityData(generateAirQualityData());
      setIsLoading(false);
    }, 500);
  };

  const getLatestVibrationData = (): VibrationData | null => {
    return vibrationData.length > 0 ? vibrationData[0] : null;
  };

  const getLatestAirQualityData = (): AirQualityData | null => {
    return airQualityData.length > 0 ? airQualityData[0] : null;
  };

  const getVibrationDataByDateRange = (startDate: Date, endDate: Date): VibrationData[] => {
    return vibrationData.filter(data => 
      data.timestamp >= startDate && data.timestamp <= endDate
    );
  };

  const getAirQualityDataByDateRange = (startDate: Date, endDate: Date): AirQualityData[] => {
    return airQualityData.filter(data => 
      data.timestamp >= startDate && data.timestamp <= endDate
    );
  };

  const value: SensorContextType = {
    vibrationData,
    airQualityData,
    isLoading,
    refreshData,
    getLatestVibrationData,
    getLatestAirQualityData,
    getVibrationDataByDateRange,
    getAirQualityDataByDateRange,
  };

  return (
    <SensorContext.Provider value={value}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = (): SensorContextType => {
  const context = useContext(SensorContext);
  if (context === undefined) {
    throw new Error('useSensor must be used within a SensorProvider');
  }
  return context;
};



