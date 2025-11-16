// Pines
const int pinVibracion = 15;     // SW-18010
const int pinMQ135 = 34;         // MQ-135 (ADC)
const int releVibracion = 2;     // Relé para buzzer
const int releMQ135 = 4;         // Relé para ventilador

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

void setup() {
  Serial.begin(115200);
  pinMode(pinVibracion, INPUT);
  pinMode(releVibracion, OUTPUT);
  pinMode(releMQ135, OUTPUT);
  digitalWrite(releVibracion, LOW);
  digitalWrite(releMQ135, LOW);
}

void loop() {
  // Lectura de vibración
  estadoVibracion = digitalRead(pinVibracion);

  if (estadoVibracion == LOW) {
    Serial.println("⚠️ Vibración detectada");
    digitalWrite(releVibracion, HIGH); // Activar buzzer
    Serial.println("Alarma activada");
  } else {
    Serial.println("✅ Vibración no detectada");
    digitalWrite(releVibracion, LOW); // Desactivar buzzer
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
  float ppmNH3    = calcularPPM(ratio, -0.42, 1.6);
  float ppmC6H6   = calcularPPM(ratio, -0.34, 1.7);
  float ppmAlcohol= calcularPPM(ratio, -0.45, 1.5);
  float ppmCO     = calcularPPM(ratio, -0.38, 1.6);
  float ppmSO2    = calcularPPM(ratio, -0.48, 1.7);
  float ppmHumo   = calcularPPM(ratio, -0.35, 1.8);

  // Mostrar resultados
  Serial.println("MQ-135 Lecturas:");
  Serial.print("NH3 (Amoníaco): "); Serial.print(ppmNH3); Serial.println(" ppm");
  Serial.print("C6H6 (Benceno): "); Serial.print(ppmC6H6); Serial.println(" ppm");
  Serial.print("Alcohol: "); Serial.print(ppmAlcohol); Serial.println(" % vol");
  Serial.print("CO (Monóxido): "); Serial.print(ppmCO); Serial.println(" ppm");
  Serial.print("SO2 (Dióxido de azufre): "); Serial.print(ppmSO2); Serial.println(" ppm");
  Serial.print("Humo: "); Serial.print(ppmHumo); Serial.println(" ppm");

  // Activar ventilador si hay humo o CO por encima de umbral
  if (ppmHumo > 100 || ppmCO > 50) {
    digitalWrite(releMQ135, HIGH); // Activar ventilador
    Serial.println("Ventilador activado");
  } else {
    digitalWrite(releMQ135, LOW); // Desactivar ventilador
  }

  Serial.println("-----------------------------");
  delay(3000);
}