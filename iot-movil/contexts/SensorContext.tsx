import { AirQualityData, VibrationData } from '@/types';
import { sensorService } from '@/services/sensorService';
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

export const SensorProvider: React.FC<SensorProviderProps> = ({ children }) => {
  const [vibrationData, setVibrationData] = useState<VibrationData[]>([]);
  const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [vibration, airQuality] = await Promise.all([
        sensorService.getVibrationData(),
        sensorService.getAirQualityData()
      ]);
      
      setVibrationData(vibration);
      setAirQualityData(airQuality);
    } catch (error) {
      console.error('Error loading initial sensor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [vibration, airQuality] = await Promise.all([
        sensorService.getVibrationData(),
        sensorService.getAirQualityData()
      ]);
      
      setVibrationData(vibration);
      setAirQualityData(airQuality);
    } catch (error) {
      console.error('Error refreshing sensor data:', error);
    } finally {
      setIsLoading(false);
    }
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



