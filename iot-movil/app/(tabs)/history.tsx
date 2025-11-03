import { useSensor } from '@/contexts/SensorContext';
import { AirQualityData, VibrationData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function HistoryScreen() {
  const { vibrationData, airQualityData } = useSensor();
  const [selectedSensor, setSelectedSensor] = useState<'vibration' | 'air_quality'>('vibration');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar datos según los filtros seleccionados
  const filteredData = useMemo(() => {
    let data = selectedSensor === 'vibration' ? vibrationData : airQualityData;
    
    // Filtrar por fecha
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        data = data.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        data = data.filter(item => new Date(item.timestamp) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        data = data.filter(item => new Date(item.timestamp) >= monthAgo);
        break;
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      data = data.filter(item => item.status === statusFilter);
    }

    // Filtrar por búsqueda (buscar en valores)
    if (searchQuery) {
      data = data.filter(item => {
        if (selectedSensor === 'vibration') {
          const vibItem = item as VibrationData;
          return vibItem.isDetected.toString().includes(searchQuery) ||
                 vibItem.alarmActive.toString().includes(searchQuery);
        } else {
          const airItem = item as AirQualityData;
          return airItem.nh3.toString().includes(searchQuery) ||
                 airItem.c6h6.toString().includes(searchQuery) ||
                 airItem.alcohol.toString().includes(searchQuery) ||
                 airItem.co.toString().includes(searchQuery) ||
                 airItem.so2.toString().includes(searchQuery) ||
                 airItem.humo.toString().includes(searchQuery);
        }
      });
    }

    return data;
  }, [selectedSensor, vibrationData, airQualityData, dateFilter, statusFilter, searchQuery]);

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

  const renderVibrationItem = ({ item }: { item: VibrationData }) => (
    <View style={styles.dataItem}>
      <View style={styles.dataItemHeader}>
        <View style={styles.dataItemTitle}>
          <Ionicons name="pulse" size={20} color="#FF6B6B" />
          <Text style={styles.dataItemTitleText}>Sensor SW-18010</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.dataItemContent}>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Estado:</Text>
          <Text style={styles.dataValue}>
            {item.isDetected ? '⚠️ Vibración detectada' : '✅ Normal'}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Buzzer:</Text>
          <Text style={styles.dataValue}>
            {item.alarmActive ? '🔊 Activo' : '🔇 Inactivo'}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Fecha:</Text>
          <Text style={styles.dataValue}>
            {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAirQualityItem = ({ item }: { item: AirQualityData }) => (
    <View style={styles.dataItem}>
      <View style={styles.dataItemHeader}>
        <View style={styles.dataItemTitle}>
          <Ionicons name="leaf" size={20} color="#4ECDC4" />
          <Text style={styles.dataItemTitleText}>Sensor MQ-135</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.dataItemContent}>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>NH₃ (Amoníaco):</Text>
          <Text style={styles.dataValue}>{item.nh3} ppm</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>C₆H₆ (Benceno):</Text>
          <Text style={styles.dataValue}>{item.c6h6} ppm</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Alcohol:</Text>
          <Text style={styles.dataValue}>{item.alcohol} % vol</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>CO (Monóxido):</Text>
          <Text style={styles.dataValue}>{item.co} ppm</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>SO₂ (Dióxido azufre):</Text>
          <Text style={styles.dataValue}>{item.so2} ppm</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Humo:</Text>
          <Text style={styles.dataValue}>{item.humo} ppm</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Ventilador:</Text>
          <Text style={styles.dataValue}>
            {item.fanActive ? '🌀 Activo' : '⏹️ Inactivo'}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Voltaje ADC:</Text>
          <Text style={styles.dataValue}>{item.voltage} V</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Fecha:</Text>
          <Text style={styles.dataValue}>
            {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Período de Tiempo</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'Todos' },
                { key: 'today', label: 'Hoy' },
                { key: 'week', label: 'Última semana' },
                { key: 'month', label: 'Último mes' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    dateFilter === option.key && styles.activeFilterOption
                  ]}
                  onPress={() => setDateFilter(option.key as any)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    dateFilter === option.key && styles.activeFilterOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Estado</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'all', label: 'Todos' },
                { key: 'normal', label: 'Normal' },
                { key: 'warning', label: 'Advertencia' },
                { key: 'critical', label: 'Crítico' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    statusFilter === option.key && styles.activeFilterOption
                  ]}
                  onPress={() => setStatusFilter(option.key as any)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === option.key && styles.activeFilterOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setFilterModalVisible(false)}
          >
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Historial de Datos</Text>
        <Text style={styles.headerSubtitle}>Registros históricos de sensores</Text>
      </LinearGradient>

      <View style={styles.controlsContainer}>
        {/* Selector de sensor */}
        <View style={styles.sensorSelector}>
          <TouchableOpacity
            style={[
              styles.sensorButton,
              selectedSensor === 'vibration' && styles.activeSensorButton
            ]}
            onPress={() => setSelectedSensor('vibration')}
          >
            <Ionicons 
              name="pulse" 
              size={20} 
              color={selectedSensor === 'vibration' ? 'white' : '#FF6B6B'} 
            />
            <Text style={[
              styles.sensorButtonText,
              selectedSensor === 'vibration' && styles.activeSensorButtonText
            ]}>
              Vibración
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sensorButton,
              selectedSensor === 'air_quality' && styles.activeSensorButton
            ]}
            onPress={() => setSelectedSensor('air_quality')}
          >
            <Ionicons 
              name="leaf" 
              size={20} 
              color={selectedSensor === 'air_quality' ? 'white' : '#4ECDC4'} 
            />
            <Text style={[
              styles.sensorButtonText,
              selectedSensor === 'air_quality' && styles.activeSensorButtonText
            ]}>
              Calidad de Aire
            </Text>
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda y filtros */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar en valores..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>

        {/* Información de resultados */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredData.length} registros encontrados
          </Text>
          {(dateFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <TouchableOpacity
              onPress={() => {
                setDateFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
            >
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredData}
        renderItem={selectedSensor === 'vibration' ? renderVibrationItem : renderAirQualityItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No se encontraron registros</Text>
            <Text style={styles.emptySubtext}>
              Ajusta los filtros o selecciona otro sensor
            </Text>
          </View>
        }
      />

      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  controlsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sensorSelector: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  sensorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  activeSensorButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  sensorButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeSensorButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#f0f2ff',
    padding: 12,
    borderRadius: 10,
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  dataItem: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dataItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dataItemTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataItemTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
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
  dataItemContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
    marginBottom: 10,
  },
  activeFilterOption: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});



