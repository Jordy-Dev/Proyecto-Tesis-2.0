export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SensorData {
  id: string;
  sensorType: 'vibration' | 'air_quality';
  value: number;
  unit: string;
  timestamp: Date;
  status: 'normal' | 'warning' | 'critical';
}

export interface VibrationData extends SensorData {
  sensorType: 'vibration';
  unit: 'binary';
  isDetected: boolean; // true = vibración detectada (LOW), false = no detectada (HIGH)
  alarmActive: boolean; // estado del buzzer
}

export interface AirQualityData extends SensorData {
  sensorType: 'air_quality';
  unit: 'ppm';
  // Gases detectados por MQ-135
  nh3: number;        // Amoníaco
  c6h6: number;       // Benceno
  alcohol: number;    // Alcohol (% vol)
  co: number;         // Monóxido de carbono
  so2: number;        // Dióxido de azufre
  humo: number;       // Humo
  // Datos del sensor
  voltage: number;    // Voltaje ADC
  rs: number;         // Resistencia del sensor
  ratio: number;      // Ratio Rs/Ro
  // Estado de actuadores
  fanActive: boolean; // estado del ventilador
}

export type AllSensorData = VibrationData | AirQualityData;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}



