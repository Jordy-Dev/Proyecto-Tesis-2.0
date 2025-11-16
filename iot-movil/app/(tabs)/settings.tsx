import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

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

  const handleExportData = () => {
    Alert.alert(
      'Exportar Datos',
      'Esta funcionalidad exportará todos los datos de sensores en formato CSV.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Exportar', onPress: () => {
          Alert.alert('Éxito', 'Los datos se han exportado correctamente.');
        }}
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contactar Soporte',
      '¿Cómo te gustaría contactar al soporte técnico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Email', onPress: () => {
          Linking.openURL('mailto:support@iot-monitor.com');
        }},
        { text: 'Teléfono', onPress: () => {
          Linking.openURL('tel:+1234567890');
        }}
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Acerca de IoT Monitor',
      'Versión 1.0.0\n\nSistema de monitoreo inteligente para sensores IoT.\n\nDesarrollado con React Native y Expo.',
      [{ text: 'Cerrar', style: 'default' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={24} color="#667eea" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="white" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.settingsContainer}>
        {/* Configuración de la aplicación */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Configuración de la Aplicación</Text>
          
          <SettingItem
            icon="notifications"
            title="Notificaciones"
            subtitle="Recibir alertas de sensores"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#e0e0e0', true: '#667eea' }}
                thumbColor={notificationsEnabled ? 'white' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />

          <SettingItem
            icon="refresh"
            title="Actualización Automática"
            subtitle="Actualizar datos cada 30 segundos"
            rightComponent={
              <Switch
                value={autoRefreshEnabled}
                onValueChange={setAutoRefreshEnabled}
                trackColor={{ false: '#e0e0e0', true: '#667eea' }}
                thumbColor={autoRefreshEnabled ? 'white' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />

        </View>

        {/* Datos y exportación */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Datos</Text>
          
          <SettingItem
            icon="download"
            title="Exportar Datos"
            subtitle="Descargar datos de sensores en CSV"
            onPress={handleExportData}
          />

          <SettingItem
            icon="trash"
            title="Limpiar Cache"
            subtitle="Eliminar datos temporales"
            onPress={() => {
              Alert.alert(
                'Limpiar Cache',
                '¿Estás seguro de que quieres limpiar el cache?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Limpiar', style: 'destructive', onPress: () => {
                    Alert.alert('Éxito', 'El cache se ha limpiado correctamente.');
                  }}
                ]
              );
            }}
          />
        </View>

        {/* Información de sensores */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Información de Sensores</Text>
          
          <SettingItem
            icon="hardware-chip"
            title="Sensor de Vibración SW-18010"
            subtitle="Rango: 45-70 Hz | Precisión: ±2%"
            onPress={() => {
              Alert.alert(
                'Sensor SW-18210',
                'Sensor de vibración piezoeléctrico\n\n• Rango de frecuencia: 45-70 Hz\n• Precisión: ±2%\n• Temperatura de operación: -20°C a +60°C\n• Alimentación: 3.3V - 5V DC\n\nEstado: Conectado y funcionando correctamente',
                [{ text: 'Cerrar', style: 'default' }]
              );
            }}
          />

          <SettingItem
            icon="leaf"
            title="Sensor de Calidad de Aire MQ-135"
            subtitle="CO₂, TVOC, Temperatura, Humedad"
            onPress={() => {
              Alert.alert(
                'Sensor MQ-135',
                'Sensor de calidad de aire multifuncional\n\n• CO₂: 400-1000 ppm\n• TVOC: 0-1000 ppb\n• Temperatura: -40°C a +125°C\n• Humedad: 0-100% RH\n• Precisión: ±3%\n\nEstado: Conectado y funcionando correctamente',
                [{ text: 'Cerrar', style: 'default' }]
              );
            }}
          />
        </View>

        {/* Soporte y ayuda */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Soporte y Ayuda</Text>
          
          <SettingItem
            icon="help-circle"
            title="Centro de Ayuda"
            subtitle="Preguntas frecuentes y guías"
            onPress={() => {
              Alert.alert(
                'Centro de Ayuda',
                'Aquí encontrarás:\n\n• Guía de uso de la aplicación\n• Interpretación de datos de sensores\n• Solución de problemas comunes\n• Mejores prácticas de monitoreo',
                [{ text: 'Cerrar', style: 'default' }]
              );
            }}
          />

          <SettingItem
            icon="call"
            title="Contactar Soporte"
            subtitle="Obtener ayuda técnica"
            onPress={handleContactSupport}
          />

          <SettingItem
            icon="information-circle"
            title="Acerca de"
            subtitle="Información de la aplicación"
            onPress={handleAbout}
          />
        </View>

        {/* Cuenta */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          <SettingItem
            icon="log-out"
            title="Cerrar Sesión"
            subtitle="Salir de la aplicación"
            onPress={handleLogout}
            showArrow={false}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>IoT Monitor v1.0.0</Text>
        <Text style={styles.footerSubtext}>Sistema de Monitoreo Inteligente</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  settingsContainer: {
    padding: 20,
  },
  settingsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

