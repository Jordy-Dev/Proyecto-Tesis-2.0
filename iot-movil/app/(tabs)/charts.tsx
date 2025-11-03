import { useSensor } from '@/contexts/SensorContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');
const chartWidth = width - 40;
const chartHeight = Math.min(200, height * 0.25); // Máximo 200px o 25% de la altura de pantalla

export default function ChartsScreen() {
  const { vibrationData, airQualityData } = useSensor();
  const [selectedChart, setSelectedChart] = useState<'vibration' | 'air_quality'>('vibration');

  // Preparar datos para gráficos de vibración
  const vibrationChartData = useMemo(() => {
    const labels = vibrationData.slice(0, 8).map((_, index) => `${index * 2}h`);
    const detectionValues = vibrationData.slice(0, 8).map(data => data.isDetected ? 1 : 0);
    const alarmValues = vibrationData.slice(0, 8).map(data => data.alarmActive ? 1 : 0);

    return {
      detection: {
        labels,
        datasets: [
          {
            data: detectionValues,
            color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
      alarm: {
        labels,
        datasets: [
          {
            data: alarmValues,
            color: (opacity = 1) => `rgba(255, 142, 142, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
    };
  }, [vibrationData]);

  // Preparar datos para gráficos de calidad de aire MQ-135
  const airQualityChartData = useMemo(() => {
    const labels = airQualityData.slice(0, 8).map((_, index) => `${index * 2}h`);
    const nh3Data = airQualityData.slice(0, 8).map(data => data.nh3);
    const c6h6Data = airQualityData.slice(0, 8).map(data => data.c6h6);
    const alcoholData = airQualityData.slice(0, 8).map(data => data.alcohol);
    const coData = airQualityData.slice(0, 8).map(data => data.co);
    const so2Data = airQualityData.slice(0, 8).map(data => data.so2);
    const humoData = airQualityData.slice(0, 8).map(data => data.humo);
    const voltageData = airQualityData.slice(0, 8).map(data => data.voltage);
    const fanData = airQualityData.slice(0, 8).map(data => data.fanActive ? 1 : 0);

    return {
      nh3: {
        labels,
        datasets: [
          {
            data: nh3Data,
            color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
      c6h6: {
        labels,
        datasets: [
          {
            data: c6h6Data,
            color: (opacity = 1) => `rgba(68, 160, 141, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
      alcohol: {
        labels,
        datasets: [
          {
            data: alcoholData,
            color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
      co: {
        labels,
        datasets: [
          {
            data: coData,
            color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
      so2: {
        labels,
        datasets: [
          {
            data: so2Data,
            color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
      humo: {
        labels,
        datasets: [
          {
            data: humoData,
            color: (opacity = 1) => `rgba(96, 125, 139, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
      voltage: {
        labels,
        datasets: [
          {
            data: voltageData,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
      fan: {
        labels,
        datasets: [
          {
            data: fanData,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      },
    };
  }, [airQualityData]);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#667eea',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e0e0e0',
      strokeWidth: 1,
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
      }
      return num.toFixed(1);
    },
  };

  const renderVibrationCharts = () => (
    <View style={styles.chartsContainer}>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Detección de Vibración</Text>
        <Text style={styles.chartSubtitle}>Sensor SW-18010 - Últimas 16 horas</Text>
        <LineChart
          data={vibrationChartData.detection}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>Unidad: Binaria (0=Normal, 1=Detectada)</Text>
          <Text style={styles.chartInfoText}>Pin 15: LOW=Detectada, HIGH=Normal</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Estado del Buzzer</Text>
        <Text style={styles.chartSubtitle}>Relé Pin 2 - Últimas 16 horas</Text>
        <LineChart
          data={vibrationChartData.alarm}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>Unidad: Binaria (0=Inactivo, 1=Activo)</Text>
          <Text style={styles.chartInfoText}>Se activa cuando hay vibración detectada</Text>
        </View>
      </View>
    </View>
  );

  const renderAirQualityCharts = () => (
    <View style={styles.chartsContainer}>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>NH₃ - Amoníaco</Text>
        <Text style={styles.chartSubtitle}>Sensor MQ-135 - Últimas 16 horas</Text>
        <LineChart
          data={airQualityChartData.nh3}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>Unidad: ppm (partes por millón)</Text>
          <Text style={styles.chartInfoText}>Umbral crítico: >50 ppm</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>C₆H₆ - Benceno</Text>
        <Text style={styles.chartSubtitle}>Sensor MQ-135 - Últimas 16 horas</Text>
        <LineChart
          data={airQualityChartData.c6h6}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>Unidad: ppm (partes por millón)</Text>
          <Text style={styles.chartInfoText}>Umbral crítico: >25 ppm</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Alcohol</Text>
        <Text style={styles.chartSubtitle}>Sensor MQ-135 - Últimas 16 horas</Text>
        <LineChart
          data={airQualityChartData.alcohol}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>Unidad: % vol (porcentaje en volumen)</Text>
          <Text style={styles.chartInfoText}>Umbral crítico: >10% vol</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>CO - Monóxido de Carbono</Text>
        <Text style={styles.chartSubtitle}>Sensor MQ-135 - Últimas 16 horas</Text>
        <LineChart
          data={airQualityChartData.co}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>Unidad: ppm (partes por millón)</Text>
          <Text style={styles.chartInfoText}>Umbral crítico: >50 ppm</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>SO₂ - Dióxido de Azufre</Text>
        <Text style={styles.chartSubtitle}>Sensor MQ-135 - Últimas 16 horas</Text>
        <LineChart
          data={airQualityChartData.so2}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>Unidad: ppm (partes por millón)</Text>
          <Text style={styles.chartInfoText}>Umbral crítico: >20 ppm</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Humo</Text>
        <Text style={styles.chartSubtitle}>Sensor MQ-135 - Últimas 16 horas</Text>
        <LineChart
          data={airQualityChartData.humo}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>Unidad: ppm (partes por millón)</Text>
          <Text style={styles.chartInfoText}>Umbral crítico: >100 ppm</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Voltaje ADC y Estado del Ventilador</Text>
        <Text style={styles.chartSubtitle}>Sensor MQ-135 - Últimas 16 horas</Text>
        <View style={styles.dualChartContainer}>
          <View style={styles.halfChart}>
            <Text style={styles.halfChartTitle}>Voltaje ADC (V)</Text>
            <LineChart
              data={airQualityChartData.voltage}
              width={chartWidth / 2 - 10}
              height={Math.min(150, chartHeight)}
              chartConfig={chartConfig}
              bezier
              style={styles.halfChartStyle}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
          <View style={styles.halfChart}>
            <Text style={styles.halfChartTitle}>Ventilador</Text>
            <LineChart
              data={airQualityChartData.fan}
              width={chartWidth / 2 - 10}
              height={Math.min(150, chartHeight)}
              chartConfig={chartConfig}
              bezier
              style={styles.halfChartStyle}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        </View>
        <View style={styles.chartInfo}>
          <Text style={styles.chartInfoText}>Voltaje ADC: 0-3.3V (12 bits)</Text>
          <Text style={styles.chartInfoText}>Ventilador: Se activa con humo>100ppm o CO>50ppm</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Gráficos de Sensores</Text>
        <Text style={styles.headerSubtitle}>Visualización de datos en tiempo real</Text>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedChart === 'vibration' && styles.activeTab
          ]}
          onPress={() => setSelectedChart('vibration')}
        >
          <Ionicons 
            name="pulse" 
            size={20} 
            color={selectedChart === 'vibration' ? '#667eea' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            selectedChart === 'vibration' && styles.activeTabText
          ]}>
            Vibración
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedChart === 'air_quality' && styles.activeTab
          ]}
          onPress={() => setSelectedChart('air_quality')}
        >
          <Ionicons 
            name="leaf" 
            size={20} 
            color={selectedChart === 'air_quality' ? '#667eea' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            selectedChart === 'air_quality' && styles.activeTabText
          ]}>
            Calidad de Aire
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {selectedChart === 'vibration' ? renderVibrationCharts() : renderAirQualityCharts()}
      </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 15,
    padding: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#f0f2ff',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  chartsContainer: {
    paddingBottom: 20,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 16,
    marginLeft: -15,
    marginRight: -15,
  },
  chartInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  chartInfoText: {
    fontSize: 12,
    color: '#666',
  },
  dualChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfChart: {
    flex: 1,
    alignItems: 'center',
  },
  halfChartTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  halfChartStyle: {
    borderRadius: 16,
    marginLeft: -5,
    marginRight: -5,
  },
});

