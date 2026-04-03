#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <math.h>

// ============ CONFIGURATION ============
// WiFi – Wokwi provides virtual WiFi automatically
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Your Neuro-Aid backend URL
// Using Cloudflare tunnel to expose local backend to Wokwi
// Run: npx -y untun tunnel http://localhost:10001
const char* BACKEND_URL = "https://survivor-tin-mentor-rick.trycloudflare.com/api/device/location";

// Device ID – generated from ESP32 chip ID (unique per device)
String DEVICE_ID = "";

// ============ GPS SIMULATION ============
// Home/Safe zone center — MUST MATCH the geofence set in patient app
// Change these to your geofence center coordinates
double homeLat = 28.6509;
double homeLng = 77.0252;

// Simulation variables
double currentLat;
double currentLng;
float walkAngle = 0;
float walkRadius = 0.0001; // Start inside safe zone
bool walkingAway = true;   // Direction of walk
int updateCount = 0;

// LED Pin for status indication
const int LED_PIN = 2;       // Built-in LED
const int BUZZER_PIN = 4;    // Buzzer for alert
const int BUTTON_PIN = 15;   // Button to toggle walk direction

// Timing
unsigned long lastSendTime = 0;
const int SEND_INTERVAL = 5000; // Send every 5 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("\n========================================");
  Serial.println("  🛰️  Neuro-Aid GPS Wearable Tracker");
  Serial.println("  Patient Safety Monitoring Device");
  Serial.println("========================================\n");

  // Setup pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Generate unique Device ID from ESP32 chip
  uint64_t chipId = ESP.getEfuseMac();
  DEVICE_ID = "GPS-HW-" + String((uint32_t)(chipId >> 16), HEX);
  DEVICE_ID.toUpperCase();
  
  Serial.print("📟 Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.println("⚡ This ID is unique to this ESP32 chip\n");

  // Initialize position at home
  currentLat = homeLat;
  currentLng = homeLng;

  // Connect to WiFi
  connectWiFi();
  
  // Startup blink
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }

  Serial.println("\n🟢 GPS Tracker READY — Sending location every 5 seconds");
  Serial.println("📍 Press BUTTON to toggle walk direction (toward/away from home)\n");
}

void loop() {
  // Check button press to toggle walk direction
  if (digitalRead(BUTTON_PIN) == LOW) {
    walkingAway = !walkingAway;
    Serial.print("🔄 Walk direction: ");
    Serial.println(walkingAway ? "WALKING AWAY from safe zone ➡️" : "WALKING BACK to safe zone ⬅️");
    
    // Beep
    tone(BUZZER_PIN, 1000, 200);
    delay(300);
  }

  // Send location at interval
  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    
    // Simulate GPS movement
    simulateMovement();
    
    // Send to backend
    sendLocationToBackend();
    
    updateCount++;
  }

  // LED heartbeat (blink while tracking)
  digitalWrite(LED_PIN, (millis() / 500) % 2);
}

void connectWiFi() {
  Serial.print("📶 Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" ✅ Connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(" ❌ Failed! Will retry...");
  }
}

void simulateMovement() {
  // Simulate patient walking in a pattern
  walkAngle += 0.3;
  
  if (walkingAway) {
    // Gradually increase radius (patient walking away from home)
    walkRadius += 0.00008; // ~8-9 meters per step
  } else {
    // Gradually decrease radius (patient walking back)
    walkRadius -= 0.00008;
    if (walkRadius < 0.0001) walkRadius = 0.0001;
  }
  
  // Calculate new position (circular walk pattern)
  currentLat = homeLat + sin(walkAngle) * walkRadius;
  currentLng = homeLng + cos(walkAngle) * walkRadius;

  // Calculate distance from home
  double distance = haversineDistance(currentLat, currentLng, homeLat, homeLng);
  
  Serial.println("─────────────────────────────────────");
  Serial.print("📍 Position: ");
  Serial.print(currentLat, 6);
  Serial.print(", ");
  Serial.println(currentLng, 6);
  Serial.print("📏 Distance from safe zone: ");
  Serial.print(distance, 1);
  Serial.println("m");
  
  if (distance > 200) {
    Serial.println("🚨 WARNING: OUTSIDE SAFE ZONE!");
    // Triple beep for alert
    for (int i = 0; i < 3; i++) {
      tone(BUZZER_PIN, 2000, 150);
      delay(200);
    }
  } else {
    Serial.println("✅ Status: Inside safe zone");
  }
}

void sendLocationToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected! Reconnecting...");
    connectWiFi();
    return;
  }

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Bypass-Tunnel-Reminder", "true"); // Bypass localtunnel challenge page

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["lat"] = currentLat;
  doc["lng"] = currentLng;
  doc["timestamp"] = millis(); // In real hardware: GPS timestamp
  
  String payload;
  serializeJson(doc, payload);

  Serial.print("📡 Sending to backend... ");
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    String response = http.getString();
    
    // Parse response
    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);
    
    const char* status = resDoc["status"];
    bool withinGeofence = resDoc["withinGeofence"];
    int distance = resDoc["distance"];
    
    if (String(status) == "ok") {
      Serial.print("✅ Response: ");
      if (withinGeofence) {
        Serial.print("SAFE (");
      } else {
        Serial.print("🚨 OUTSIDE ZONE (");
      }
      Serial.print(distance);
      Serial.println("m from center)");
    } else {
      Serial.print("⚠ Server: ");
      Serial.println(response);
    }
  } else {
    Serial.print("❌ HTTP Error: ");
    Serial.println(httpCode);
  }

  http.end();
}

// Haversine formula for distance in meters
double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
  double R = 6371000.0; // Earth's radius in meters
  double dLat = radians(lat2 - lat1);
  double dLon = radians(lon2 - lon1);
  double a = sin(dLat / 2) * sin(dLat / 2) +
             cos(radians(lat1)) * cos(radians(lat2)) *
             sin(dLon / 2) * sin(dLon / 2);
  double c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return R * c;
}
