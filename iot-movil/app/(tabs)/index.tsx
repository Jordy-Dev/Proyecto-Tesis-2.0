import { useAuth } from '@/contexts/AuthContext';
import { useSensor } from '@/contexts/SensorContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { 
    getLatestVibrationData, 
    getLatestAirQualityData, 
    refreshData, 
    isLoading 
  } = useSensor();
  const [refreshing, setRefreshing] = useState(false);

  const latestVibration = getLatestVibrationData();
  const latestAirQuality = getLatestAirQualityData();

  const onRefresh = async () => {
    setRefreshing(true);
    refreshData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: () => {
          logout();
          router.replace('/login');
        }}
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return 'Normal';
      case 'warning': return 'Advertencia';
      case 'critical': return 'Crítico';
      default: return 'Desconocido';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Sección de Sensores */}
      <View style={styles.sensorsSection}>
        <Text style={styles.sectionTitle}>Estado de Sensores</Text>
        
        {/* Sensor de Vibración SW-18010 */}
        <View style={styles.sensorContainer}>
          <View style={styles.sensorHeader}>
            <Ionicons name="pulse" size={24} color="#FF6B6B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.sensorTitle}>Vibración</Text>
              <Text style={styles.sensorSubtitle}>(Sensor SW-18010)</Text>
            </View>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: latestVibration ? getStatusColor(latestVibration.status) : '#9E9E9E' }
            ]}>
              <Text style={styles.statusText}>
                {latestVibration ? getStatusText(latestVibration.status) : 'Sin datos'}
              </Text>
            </View>
          </View>
          
          {latestVibration && (
            <View style={styles.dataGrid}>
              {/* Estado de Vibración */}
              <View style={[styles.dataCard, { backgroundColor: '#FFF5F5' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="warning" size={20} color="#FF6B6B" />
                  <Text style={styles.dataCardTitle}>Estado</Text>
                </View>
                <Text style={styles.dataCardValue}>
                  {latestVibration.isDetected ? '⚠️ Vibración detectada' : '✅ Normal'}
                </Text>
              </View>

              {/* Estado del Buzzer */}
              <View style={[styles.dataCard, { backgroundColor: '#F0F9FF' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="volume-high" size={20} color="#3B82F6" />
                  <Text style={styles.dataCardTitle}>Buzzer</Text>
                </View>
                <Text style={styles.dataCardValue}>
                  {latestVibration.alarmActive ? '🔊 Activo' : '🔇 Inactivo'}
                </Text>
              </View>

              {/* Fecha de Lectura */}
              <View style={[styles.dataCard, { backgroundColor: '#F0FDF4' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="time" size={20} color="#10B981" />
                  <Text style={styles.dataCardTitle}>Última Lectura</Text>
                </View>
                <Text style={styles.dataCardValue}>
                  {latestVibration.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Sensor MQ-135 - Calidad de Aire */}
        <View style={styles.sensorContainer}>
          <View style={styles.sensorHeader}>
            <Ionicons name="leaf" size={24} color="#4ECDC4" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.sensorTitle}>Calidad de Aire</Text>
              <Text style={styles.sensorSubtitle}>(Sensor MQ-135)</Text>
            </View>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: latestAirQuality ? getStatusColor(latestAirQuality.status) : '#9E9E9E' }
            ]}>
              <Text style={styles.statusText}>
                {latestAirQuality ? getStatusText(latestAirQuality.status) : 'Sin datos'}
              </Text>
            </View>
          </View>
          
          {latestAirQuality && (
            <View style={styles.dataGrid}>
              {/* NH3 - Amoníaco */}
              <View style={[styles.dataCard, { backgroundColor: '#FEF3C7' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="flask" size={20} color="#F59E0B" />
                  <Text style={styles.dataCardTitle}>
                    NH₃<Text style={styles.dataCardSubtitle}> (Amoníaco)</Text>
                  </Text>
                </View>
                <Text style={styles.dataCardValue}>{latestAirQuality.nh3} ppm</Text>
              </View>

              {/* C6H6 - Benceno */}
              <View style={[styles.dataCard, { backgroundColor: '#E0E7FF' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="flask" size={20} color="#6366F1" />
                  <Text style={styles.dataCardTitle}>
                    C₆H₆<Text style={styles.dataCardSubtitle}> (Benceno)</Text>
                  </Text>
                </View>
                <Text style={styles.dataCardValue}>{latestAirQuality.c6h6} ppm</Text>
              </View>

              {/* Alcohol */}
              <View style={[styles.dataCard, { backgroundColor: '#FDF2F8' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="wine" size={20} color="#EC4899" />
                  <Text style={styles.dataCardTitle}>Alcohol</Text>
                </View>
                <Text style={styles.dataCardValue}>{latestAirQuality.alcohol} % vol</Text>
              </View>

              {/* CO - Monóxido */}
              <View style={[styles.dataCard, { backgroundColor: '#FEE2E2' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="warning" size={20} color="#EF4444" />
                  <Text style={styles.dataCardTitle}>
                    CO<Text style={styles.dataCardSubtitle}> (Monóxido)</Text>
                  </Text>
                </View>
                <Text style={styles.dataCardValue}>{latestAirQuality.co} ppm</Text>
              </View>

              {/* SO2 - Dióxido de Azufre */}
              <View style={[styles.dataCard, { backgroundColor: '#F3E8FF' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="cloud" size={20} color="#8B5CF6" />
                  <Text style={styles.dataCardTitle}>
                    SO₂<Text style={styles.dataCardSubtitle}> (Dióxido de azufre)</Text>
                  </Text>
                </View>
                <Text style={styles.dataCardValue}>{latestAirQuality.so2} ppm</Text>
              </View>

              {/* Humo */}
              <View style={[styles.dataCard, { backgroundColor: '#F3F4F6' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="cloudy" size={20} color="#6B7280" />
                  <Text style={styles.dataCardTitle}>Humo</Text>
                </View>
                <Text style={styles.dataCardValue}>{latestAirQuality.humo} ppm</Text>
              </View>

              {/* Ventilador */}
              <View style={[styles.dataCard, { backgroundColor: '#ECFDF5' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="refresh" size={20} color="#10B981" />
                  <Text style={styles.dataCardTitle}>Ventilador</Text>
                </View>
                <Text style={styles.dataCardValue}>
                  {latestAirQuality.fanActive ? '🌀 Activo' : '⏹️ Inactivo'}
                </Text>
              </View>

              {/* Fecha de Lectura */}
              <View style={[styles.dataCard, { backgroundColor: '#F0FDF4' }]}>
                <View style={styles.dataCardHeader}>
                  <Ionicons name="time" size={20} color="#10B981" />
                  <Text style={styles.dataCardTitle}>Última Lectura</Text>
                </View>
                <Text style={styles.dataCardValue}>
                  {latestAirQuality.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    padding: 10,
  },
  sensorsSection: {
    padding: 20,
  },
  sensorContainer: {
    marginBottom: 30,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sensorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sensorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  dataCardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  dataCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
});