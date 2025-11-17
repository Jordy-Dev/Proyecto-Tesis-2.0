import { SENSORS_API_BASE_URL } from '@/config/api';
import { AirQualityData, VibrationData } from '@/types';

class SensorService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getVibrationData(): Promise<VibrationData[]> {
    try {
      const response = await this.fetchWithTimeout(`${SENSORS_API_BASE_URL}/sensors/vibration`);
      
      // Transformar datos de la API al formato de la app
      return response.data.map((item: any) => ({
        id: item._id || item.id,
        sensorType: 'vibration' as const,
        value: item.value,
        unit: 'binary' as const,
        isDetected: item.isDetected,
        alarmActive: item.alarmActive,
        timestamp: new Date(item.timestamp),
        status: item.status,
      }));
    } catch (error) {
      console.error('Error fetching vibration data:', error);
      return [];
    }
  }

  async getAirQualityData(): Promise<AirQualityData[]> {
    try {
      const response = await this.fetchWithTimeout(`${SENSORS_API_BASE_URL}/sensors/air-quality`);
      
      // Transformar datos de la API al formato de la app
      return response.data.map((item: any) => ({
        id: item._id || item.id,
        sensorType: 'air_quality' as const,
        value: item.humo || 0, // Usar humo como valor principal
        unit: 'ppm' as const,
        nh3: item.nh3 || 0,
        c6h6: item.c6h6 || 0,
        alcohol: item.alcohol || 0,
        co: item.co || 0,
        so2: item.so2 || 0,
        humo: item.humo || 0,
        voltage: item.voltage || 0,
        rs: item.rs || 0,
        ratio: item.ratio || 0,
        fanActive: item.fanActive || false,
        timestamp: new Date(item.timestamp),
        status: item.status,
      }));
    } catch (error) {
      console.error('Error fetching air quality data:', error);
      return [];
    }
  }

  async getVibrationDataByDateRange(startDate: Date, endDate: Date): Promise<VibrationData[]> {
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const response = await this.fetchWithTimeout(
        `${SENSORS_API_BASE_URL}/sensors/vibration?startDate=${start}&endDate=${end}`
      );
      
      return response.data.map((item: any) => ({
        id: item._id || item.id,
        sensorType: 'vibration' as const,
        value: item.value,
        unit: 'binary' as const,
        isDetected: item.isDetected,
        alarmActive: item.alarmActive,
        timestamp: new Date(item.timestamp),
        status: item.status,
      }));
    } catch (error) {
      console.error('Error fetching vibration data by date range:', error);
      return [];
    }
  }

  async getAirQualityDataByDateRange(startDate: Date, endDate: Date): Promise<AirQualityData[]> {
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      const response = await this.fetchWithTimeout(
        `${SENSORS_API_BASE_URL}/sensors/air-quality?startDate=${start}&endDate=${end}`
      );
      
      return response.data.map((item: any) => ({
        id: item._id || item.id,
        sensorType: 'air_quality' as const,
        value: item.humo || 0,
        unit: 'ppm' as const,
        nh3: item.nh3 || 0,
        c6h6: item.c6h6 || 0,
        alcohol: item.alcohol || 0,
        co: item.co || 0,
        so2: item.so2 || 0,
        humo: item.humo || 0,
        voltage: item.voltage || 0,
        rs: item.rs || 0,
        ratio: item.ratio || 0,
        fanActive: item.fanActive || false,
        timestamp: new Date(item.timestamp),
        status: item.status,
      }));
    } catch (error) {
      console.error('Error fetching air quality data by date range:', error);
      return [];
    }
  }
}

export const sensorService = new SensorService();
