#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración API
const char* serverUrl = "http://10.158.146.213:3005/api/sensors"; // IP de tu PC donde corre el backend

// Configuración ubicación del sensor
const char* sensorGrado = "1er Grado";
const char* sensorSeccion = "A";

// Pines
const int pinVibracion = 15;     // SW-18010
const int pinMQ135 = 34;         // MQ-135 (ADC)

// Variables
int estadoVibracion = 0;
float voltajeMQ135 = 0;
float Rs = 0;
float Ro = 3.6; // Calibrado en aire limpio (ajustable)
float ratio = 0;

// Curvas de sensibilidad (a, b) para cada gas
float calcularPPM(float ratio, float a, float b) {
  return pow(10, (a * log10(ratio) + b));
}

// Función para conectar WiFi
void conectarWiFi() {
  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi conectado");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Error al conectar WiFi");
  }
}

// Función para enviar datos de vibración
void enviarDatosVibracion(int isDetected) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi no conectado - no se envían datos de vibración");
    return;
  }
  
  HTTPClient http;
  String url = String(serverUrl) + "/vibration";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Crear JSON
  StaticJsonDocument<300> doc;
  doc["grado"] = sensorGrado;
  doc["seccion"] = sensorSeccion;
  doc["isDetected"] = isDetected;
  doc["alarmActive"] = isDetected; // Activar alarma si hay vibración
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Enviando datos de vibración: ");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.print("Respuesta API vibración: ");
    Serial.println(httpResponseCode);
    String payload = http.getString();
    Serial.println(payload);
  } else {
    Serial.print("Error en API vibración: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

// Función para enviar datos de calidad de aire
void enviarDatosCalidadAire(float nh3, float c6h6, float alcohol, float co, float so2, float humo, float voltage, float rs, float ratio) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi no conectado - no se envían datos de calidad de aire");
    return;
  }
  
  HTTPClient http;
  String url = String(serverUrl) + "/air-quality";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Crear JSON
  StaticJsonDocument<600> doc;
  doc["grado"] = sensorGrado;
  doc["seccion"] = sensorSeccion;
  doc["nh3"] = nh3;
  doc["c6h6"] = c6h6;
  doc["alcohol"] = alcohol;
  doc["co"] = co;
  doc["so2"] = so2;
  doc["humo"] = humo;
  doc["voltage"] = voltage;
  doc["rs"] = rs;
  doc["ratio"] = ratio;
  doc["fanActive"] = (co > 30 || humo > 70); // Activar ventilador si hay niveles peligrosos
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Enviando datos de calidad de aire: ");
  Serial.println(jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.print("Respuesta API calidad de aire: ");
    Serial.println(httpResponseCode);
    String payload = http.getString();
    Serial.println(payload);
  } else {
    Serial.print("Error en API calidad de aire: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(pinVibracion, INPUT);
  conectarWiFi();
}

void loop() {
  // Lectura de vibración
  estadoVibracion = digitalRead(pinVibracion);
  if (estadoVibracion == LOW) {
    Serial.println("⚠️ Vibración detectada");
  } else {
    Serial.println("✅ Vibración no detectada");
  }

  Serial.print("Nivel de vibración: ");
  Serial.println(estadoVibracion == LOW ? 1 : 0);

  // Lectura MQ-135
  int valorADC = analogRead(pinMQ135);
  voltajeMQ135 = (valorADC / 4095.0) * 3.3; // ESP32 ADC de 12 bits

  // Cálculo de Rs
  float RL = 10.0; // kΩ
  Rs = ((3.3 * RL) / voltajeMQ135) - RL;
  ratio = Rs / Ro;

  // Estimaciones de gases
  float ppmNH3     = calcularPPM(ratio, -0.42, 1.6);
  float ppmC6H6    = calcularPPM(ratio, -0.34, 1.7);
  float ppmAlcohol = calcularPPM(ratio, -0.45, 1.5);
  float ppmCO      = calcularPPM(ratio, -0.38, 1.6);
  float ppmSO2     = calcularPPM(ratio, -0.48, 1.7);
  float ppmHumo    = calcularPPM(ratio, -0.35, 1.8);

  // Mostrar resultados
  Serial.println("MQ-135 Lecturas:");
  Serial.print("NH3 (Amoníaco): "); Serial.print(ppmNH3); Serial.println(" ppm");
  Serial.print("C6H6 (Benceno): "); Serial.print(ppmC6H6); Serial.println(" ppm");
  Serial.print("Alcohol: "); Serial.print(ppmAlcohol); Serial.println(" % vol");
  Serial.print("CO (Monóxido): "); Serial.print(ppmCO); Serial.println(" ppm");
  Serial.print("SO2 (Dióxido de azufre): "); Serial.print(ppmSO2); Serial.println(" ppm");
  Serial.print("Humo: "); Serial.print(ppmHumo); Serial.println(" ppm");

  // Enviar datos a la API
  Serial.println("\n Enviando datos a la API...");
  
  // Enviar datos de vibración
  enviarDatosVibracion(estadoVibracion == LOW ? 1 : 0);
  
  // Pequeña pausa entre envíos
  delay(1000);
  
  // Enviar datos de calidad de aire
  enviarDatosCalidadAire(ppmNH3, ppmC6H6, ppmAlcohol, ppmCO, ppmSO2, ppmHumo, voltajeMQ135, Rs, ratio);

  Serial.println("✅ Datos enviados correctamente");
  Serial.println("-----------------------------");
  delay(3000);
}