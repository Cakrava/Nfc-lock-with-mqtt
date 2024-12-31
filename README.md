# NFC Lock with MQTT
This application is designed by integrating a custom device from the ESP8266 system, which controls the Solenoid Door for locking the door. The application uses a simple principle for communication with the device, where the smartphone is brought close to the system to trigger the NFC coil. The data inside the NFC chip contains system information like the MQTT topic, which is used as the address path to the Broker from the smartphone.

# Dashboard
   The Dashboard view displays several features, such as the application status with the MQTT broker, user management, history, Wi-Fi direct, and devices, with details as follows:
   1. **User**  
        The user menu is used to add users to use this application.
   2. **History**  
        This menu allows you to view the history of user access to the system.
   3. **Wi-Fi Direct**  
        This feature allows direct communication between the smartphone and the system as an emergency path if the system is not connected to the internet.
   4. **Devices**  
        The device menu is used to add new devices.

   And several other views like the summary of the history.

![Gambar WhatsApp 2025-01-01 pukul 00 35 10_f8dc7303](https://github.com/user-attachments/assets/5fd702fd-839f-4195-a7cc-5798b302a1de)
![Gambar WhatsApp 2025-01-01 pukul 00 35 09_498b0b8c](https://github.com/user-attachments/assets/5f1b96fc-f5c2-40ba-874c-f70f7257bc68)



# Archive
   This view is specifically used by the admin to monitor the application and system, where they can see the history of user access and the system logs.
   ![Gambar WhatsApp 2025-01-01 pukul 00 35 10_6f47fb60](https://github.com/user-attachments/assets/e758311b-6268-492a-af82-7e400f225a2d)

   

# Code ESP8266 for the system
This code is the program code from the esp8266 which works according to its function, namely sending online status to devicename-status and also receiving a message response from the topic devicename which will be received from the smartphone device.

```cpp
#include <ArduinoJson.h> // Pastikan library ini telah diinstal
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ESP8266WebServer.h>

// Informasi WiFi
const char* ssid = "ShopeePay";
const char* password = "satusampaidelapan";
const char* ap_ssid = "Device-19d8G";
const char* ap_password = "SISTEMKEAMANANSEKOLAHAMAN";
const IPAddress ap_ip(192, 168, 4, 1);
const IPAddress ap_gateway(192, 168, 4, 1);
const IPAddress ap_subnet(255, 255, 255, 0);

// Informasi MQTT
const char* mqtt_server = "broker.emqx.io";
const char* mqtt_topic_receive = "Device-19d8G"; // Topik untuk menerima pesan
const char* mqtt_topic_status = "Device-19d8G-status"; // Topik untuk mengirim status

WiFiClient espClient;
PubSubClient client(espClient);
ESP8266WebServer server(80); // Web server on port 80

// Pin untuk buzzer dan relay
const int buzzerPin = D8;
const int relayPin = D3;

void setupWiFi() {
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi terhubung.");
  Serial.print("Alamat IP: ");
  Serial.println(WiFi.localIP());
}
void setupAPAndWebServer() {
  WiFi.softAPConfig(ap_ip, ap_gateway, ap_subnet);
  WiFi.softAP(ap_ssid, ap_password);

  Serial.println("AP statis dibuat.");
  Serial.print("SSID: ");
  Serial.println(ap_ssid);
  Serial.print("Password: ");
  Serial.println(ap_password);
  Serial.print("Alamat IP: ");
  Serial.println(WiFi.softAPIP());

  // Handle POST request to '/message'
  server.on("/message", HTTP_POST, []() {
    String body = server.arg("plain"); // Mendapatkan data body dari request
    Serial.println("Pesan diterima: " + body);

    // Parsing JSON
    StaticJsonDocument<200> jsonDoc; // Buffer untuk parsing JSON
    DeserializationError error = deserializeJson(jsonDoc, body);

    if (error) {
      Serial.println("Gagal parsing JSON: " + String(error.c_str()));
      server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Invalid JSON\"}");
      return;
    }

    // Mendapatkan nilai "message" dari JSON
    const char* message = jsonDoc["message"];

    if (String(message) == "buka") {
      Serial.println("Perintah 'buka' diterima, menjalankan open().");
      open(); // Jalankan fungsi open() jika message adalah "buka"
    }

    server.send(200, "application/json", "{\"status\":\"success\"}");
  });

  server.begin();
}

void setupMQTT() {
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Pesan diterima di topik [");
  Serial.print(topic);
  Serial.print("]: ");

  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  if (String(topic) == mqtt_topic_receive) {
    if (message == "Pintu Dibuka oleh pengguna dengan UID valid") {
      open();
    }
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Menghubungkan ke MQTT...");
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("Berhasil terhubung.");
      client.subscribe(mqtt_topic_receive); // Berlangganan ke topik Device-19d8G
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(". Coba lagi dalam 5 detik.");
      delay(5000);
    }
  }
}

void sendMQTTOnlineMessage() {
  if (client.connected()) {
    client.publish(mqtt_topic_status, "online"); // Mengirim status "online"
  }
}

void open() {
  Serial.println("Fungsi open() dipanggil.");

  digitalWrite(buzzerPin, HIGH);
  delay(200);
  digitalWrite(buzzerPin, LOW);
  delay(200);
  digitalWrite(buzzerPin, HIGH);
  delay(200);
  digitalWrite(buzzerPin, LOW);

  digitalWrite(relayPin, LOW);
  delay(5000);
  digitalWrite(relayPin, HIGH);
}

void setup() {
  Serial.begin(115200);

  pinMode(buzzerPin, OUTPUT);
  pinMode(relayPin, OUTPUT);
 digitalWrite(relayPin, HIGH);
  setupWiFi();
  setupAPAndWebServer();
  setupMQTT();
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  server.handleClient(); // Handle incoming HTTP requests

  sendMQTTOnlineMessage();
  delay(2000); // Kirim pesan "online" setiap 2 detik
}

