# SIKESA - Smart IoT Door Lock System (NFC, MQTT & WiFi Direct)

SIKESA (Sistem Keamanan Elektronik Sekolah / Smart Key System) adalah sistem penguncian pintu dan loker pintar berbasis IoT yang mengintegrasikan mikrokontroler **ESP8266**, **Solenoid Door Lock 12V**, **NFC Tag**, **Firebase Realtime Database**, backend microservice **Simple API Image**, dan aplikasi mobile React Native.

Sistem ini dirancang dengan redundansi ganda: komunikasi cloud berbasis **MQTT** sebagai jalur utama dan **SoftAP WiFi Direct HTTP Server** sebagai jalur darurat saat internet terputus, dilengkapi verifikasi visual identitas pengguna via microservice penyimpanan gambar.

🌐 **Live Interactive Sandbox & Simulasi:**  
👉 **[https://sikesa.mydiskom.my.id/](https://sikesa.mydiskom.my.id/)**  
📦 **Repositori Terkait (Media Microservice):**  
👉 **[Cakrava/simple-api-image](https://github.com/Cakrava/simple-api-image)**

---

## 📌 Prinsip & Arsitektur Sistem

Ekosistem SIKESA menghubungkan aplikasi mobile, microservice media, cloud database, broker pesan, dan node IoT fisik dalam satu kesatuan:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               SMARTPHONE (APLIKASI SIKESA)                             │
└───────────────┬───────────────────────────┬───────────────────────────┬────────────────┘
                │                           │                           │
                │ 1. Dynamic Discovery      │ 2. Upload / Fetch Foto    │ 3. Akses Darurat (WiFi Direct)
                │    & Cek Status Online    │    (Token-based Media)    │    HTTP POST /message
                ▼                           ▼                           ▼
  ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
  │         FIREBASE          │ │    SIMPLE API IMAGE       │ │  SoftAP ESP8266 (Lokal)   │
  │     Realtime Database     │ │ (Cakrava/simple-api-image)│ │   http://192.168.4.1:80   │
  │  - validatorHelper/apiUrl │ │ - POST /upload            │ └─────────────┬─────────────┘
  │  - Data Pengguna (Anggota)│ │ - GET /images/:token      │               │
  │  - Audit Riwayat (History)│ │ - Server Health & Ping    │               │
  └─────────────┬─────────────┘ └───────────────────────────┘               │
                │                                                           │
                │ 4. Verifikasi UID & Hak Akses                             │
                ▼                                                           │
  ┌───────────────────────────┐                                             │
  │    MQTT Broker (Cloud)    │                                             │
  │      broker.emqx.io       │                                             │
  │   Topik: Device-19d8G     │                                             │
  └─────────────┬─────────────┘                                             │
                │                                                           │
                │ 5. MQTT Sub: Perintah "buka"                              │ Perintah "buka"
                └───────────────────────────┬───────────────────────────────┘
                                            ▼
                              ┌───────────────────────────┐
                              │       NODE ESP8266        │
                              │    - Buzzer Pin D8        │
                              │    - Relay Pin D3         │
                              └─────────────┬─────────────┘
                                            ▼
                              ┌───────────────────────────┐
                              │   12V SOLENOID DOOR BOLT  │
                              │ (Auto-Relock Delay 5s)    │
                              └───────────────────────────┘
```

---

## 🖼️ Peran Microservice: Simple API Image (`Cakrava/simple-api-image`)

Sistem SIKESA mengintegrasikan backend microservice mandiri [**Cakrava/simple-api-image**](https://github.com/Cakrava/simple-api-image) untuk menangani tugas-tugas kritis yang tidak dibebankan langsung ke Firebase:

### 1. Manajemen Media & Unggah Gambar Profil (`/upload`)
* **Masalah**: Menyimpan data gambar biner atau Base64 berukuran besar di Firebase Realtime Database menyebabkan pembengkakan kuota, latensi tinggi, dan penurunan performa baca/tulis.
* **Solusi**: Foto pengguna yang diunggah saat registrasi pengguna baru (`NewUser.jsx`) atau pembaruan profil (`EditUser.jsx`) dikirim langsung ke server `simple-api-image`:
  * **Metode**: `POST /upload`
  * **Content-Type**: `multipart/form-data`
  * **Payload**:
    * `id`: ID pengguna unik
    * `image_token`: Token acak 15 karakter (contoh: `A8fK9xL2pQ7wMz1`)
    * `image`: File biner gambar JPEG/PNG
* **Serving Gambar Statis**: Server menyajikan gambar melalui endpoint publik bertoken:  
  `GET /images/:image_token`  
  URL ini (`${apiUrl}images/${newToken}`) disimpan ke Firebase pada simpul `Anggota/{id}/imageUrl`.

### 2. Audit Trail Visual pada Riwayat Akses Pintu
* Setiap kali pintu dibuka (baik via NFC tap maupun WiFi direct), fungsi `SaveHistory` mencatat log kejadian ke `History/{loginId}/{timestamp}` dan `AllHistory/{timestamp}`.
* Log akses tidak hanya mencatat nama dan waktu, tetapi juga **URL foto pengguna dari Simple API Image**.
* Dashboard dan menu Arsip Admin menampilkan foto wajah pengguna yang melakukan pembukaan pintu, menghadirkan lapisan verifikasi visual anti-penyalahgunaan kartu.

### 3. Dynamic Service Discovery via Firebase (`validatorHelper/apiUrl`)
* Klien mobile SIKESA tidak melakukan *hardcode* terhadap URL server gambar.
* Melalui hook `useApiUrl()`, aplikasi secara realtime mendengarkan simpul Firebase:  
  `validatorHelper/apiUrl`
* **Keuntungan Arsitektural**: Administrator dapat mengganti alamat IP, port, VPS, domain CDN, atau tunnel pengujian (ngrok) secara instan dari Firebase Console tanpa perlu merilis pembaruan atau mengompilasi ulang aplikasi APK React Native.

### 4. Status Online & Availability Health Check
* Microservice ini bertindak sebagai validator ketersediaan layanan (*service availability*).
* Digunakan untuk memverifikasi apakah jalur internet/server sedang aktif (*online*) atau terputus (*offline*), sehingga aplikasi dapat segera menentukan apakah harus beralih ke mode darurat **WiFi Direct**.

---

## 📌 Alur Komunikasi Redundansi Ganda

### 1. Jalur Utama: Online Cloud via NFC & MQTT
1. **NFC Tap**: Pengguna menempelkan smartphone ke koil NFC pada kusen pintu/loker.
2. **Identifikasi Data**: Tag NFC memuat NDEF topic broker dan UID perangkat fisik (`Device-19d8G`).
3. **Validasi & Publish**: Aplikasi memverifikasi hak akses anggota di Firebase, lalu mem-publish pesan `"buka"` ke topik MQTT `Device-19d8G` pada broker (`broker.emqx.io:1883`).
4. **Respon ESP8266**: Node ESP8266 menerima pesan dari topik subskripsi, menyalakan buzzer pin `D8` 2x (interval 200ms), lalu mengaktifkan relay pin `D3` (LOW).
5. **Auto-Relock 5 Detik**: Lidah solenoid membuka kunci selama 5 detik (`delay(5000)`), lalu relay kembali nonaktif (HIGH) untuk mengunci kusen pintu kembali secara otomatis.

### 2. Jalur Cadangan: Emergency Access via WiFi Direct (SoftAP REST API)
1. **Koneksi Darurat**: Jika jaringan internet atau broker terputus, ESP8266 secara bersamaan memancarkan jaringan hotspot Access Point sendiri:
   * **SSID**: `Device-19d8G`
   * **Password**: `SISTEMKEAMANANSEKOLAHAMAN`
   * **IP Gateway**: `192.168.4.1`
2. **Kirim Perintah HTTP POST**: Smartphone terhubung langsung ke WiFi perangkat dan mengirimkan request JSON ke web server internal port 80:
   * **Endpoint**: `POST http://192.168.4.1/message`
   * **Payload**: `{"message": "buka"}`
3. **Eksekusi Lokal**: ESP8266 mem-parsing body JSON dan langsung memanggil fungsi `open()` secara lokal tanpa ketergantungan pada internet ataupun cloud broker.

---

## 📱 Fitur & Menu Aplikasi

Aplikasi mobile SIKESA menyediakan fitur pengelolaan lengkap:

1. **Dashboard & NFC Scanner**  
   * Menampilkan status sinkronisasi realtime dengan MQTT broker (*Connected* / *Disconnected*).
   * Area pemindaian NFC interaktif dengan indikator visual dan tombol koneksi ulang (*Reconnect*).
   * Menampilkan banner edukasi sistem dan ringkasan riwayat akses terbaru beserta foto pengguna.
2. **Manajemen Pengguna (User)**  
   * Menambah anggota baru dengan generator ID & password otomatis, upload foto profil ke `simple-api-image`, dan simpan data ke Firebase.
   * Hak akses berjenjang antara Administrator dan Pengguna Umum.
3. **Riwayat Akses (History & Archive)**  
   * Mencatat setiap transaksi buka/tutup pintu secara realtime beserta *timestamp*, nama pengguna, foto wajah, dan ID riwayat akses.
   * Menu Arsip khusus admin untuk kebutuhan audit keamanan berkala.
4. **WiFi Direct (Emergency Access & Config)**  
   * Memindai hotspot perangkat terdekat berawalan `Device-*`.
   * Membuka pintu darurat via tombol satu-klik melalui protokol HTTP POST lokal.
   * Menu konfigurasi WiFi untuk mengatur SSID dan password jaringan lokal.
5. **Manajemen Perangkat (Devices)**  
   * Menambah node perangkat baru, memantau kondisi online/offline melalui topik telemetri status (`Device-19d8G-status`), dan kontrol tutup paksa (*force close*).

---

## 🔌 Rangkaian Perangkat Keras (Hardware Pinout)

| Komponen Hardware | Pin ESP8266 | Deskripsi Fungsional |
| :--- | :--- | :--- |
| **Relay Modul 5V (Active LOW)** | `D3` (GPIO0) | Mengontrol sakelar daya 12V DC ke Solenoid Door Lock |
| **Active Buzzer** | `D8` (GPIO15) | Indikator nada suara bip 2x saat akses berhasil |
| **Catu Daya NodeMCU** | `VIN` & `GND` | Sumber tegangan 5V DC (Micro-USB / Regulator) |
| **Solenoid Door Lock 12V** | Output Relay | Terhubung ke adaptor daya eksternal 12V DC 2A |
| **NFC Tag / RFID Coil** | Terpasang di Kusen | Menyimpan NDEF topic & data UID unik pintu |

---

## 💻 Firmware ESP8266 (Arduino C++)

Program berikut ditanamkan pada mikrokontroler ESP8266 (NodeMCU / Wemos D1 Mini). Program ini menjalankan fungsi koneksi WiFi Client, MQTT Client (PubSubClient), SoftAP mandiri, dan Web Server internal port 80 secara simultan.

```cpp
#include <ArduinoJson.h> // Pastikan library ArduinoJson v6 telah diinstal
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ESP8266WebServer.h>

// Informasi WiFi Klien
const char* ssid = "ShopeePay";
const char* password = "satusampaidelapan";

// Informasi SoftAP (Akses Darurat Lokal)
const char* ap_ssid = "Device-19d8G";
const char* ap_password = "SISTEMKEAMANANSEKOLAHAMAN";
const IPAddress ap_ip(192, 168, 4, 1);
const IPAddress ap_gateway(192, 168, 4, 1);
const IPAddress ap_subnet(255, 255, 255, 0);

// Informasi MQTT Broker
const char* mqtt_server = "broker.emqx.io";
const char* mqtt_topic_receive = "Device-19d8G";        // Topik menerima perintah buka
const char* mqtt_topic_status = "Device-19d8G-status";   // Topik telemetri status online

WiFiClient espClient;
PubSubClient client(espClient);
ESP8266WebServer server(80); // Web server port 80 untuk REST API lokal

// Pin I/O Buzzer dan Relay
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
  Serial.print("Alamat IP Klien: ");
  Serial.println(WiFi.localIP());
}

void setupAPAndWebServer() {
  WiFi.softAPConfig(ap_ip, ap_gateway, ap_subnet);
  WiFi.softAP(ap_ssid, ap_password);

  Serial.println("SoftAP mandiri dibuat.");
  Serial.print("SSID: ");
  Serial.println(ap_ssid);
  Serial.print("Password: ");
  Serial.println(ap_password);
  Serial.print("Alamat IP AP: ");
  Serial.println(WiFi.softAPIP());

  // Handle request HTTP POST ke '/message'
  server.on("/message", HTTP_POST, []() {
    String body = server.arg("plain"); // Mendapatkan body JSON dari request
    Serial.println("Pesan HTTP diterima: " + body);

    // Parsing JSON payload
    StaticJsonDocument<200> jsonDoc;
    DeserializationError error = deserializeJson(jsonDoc, body);

    if (error) {
      Serial.println("Gagal parsing JSON: " + String(error.c_str()));
      server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Invalid JSON\"}");
      return;
    }

    // Ekstraksi nilai "message" dari JSON
    const char* message = jsonDoc["message"];

    if (String(message) == "buka") {
      Serial.println("Perintah 'buka' diterima via HTTP, menjalankan open().");
      open(); // Memicu fungsi buka kunci solenoid
    }

    server.send(200, "application/json", "{\"status\":\"success\"}");
  });

  server.begin();
  Serial.println("HTTP Web Server berjalan pada port 80.");
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
    if (message == "Pintu Dibuka oleh pengguna dengan UID valid" || message == "buka") {
      open();
    }
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Menghubungkan ke MQTT Broker...");
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("Berhasil terhubung.");
      client.subscribe(mqtt_topic_receive); // Berlangganan topik kontrol
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(". Mencoba lagi dalam 5 detik...");
      delay(5000);
    }
  }
}

void sendMQTTOnlineMessage() {
  if (client.connected()) {
    client.publish(mqtt_topic_status, "online"); // Mengirim heartbeat status online
  }
}

void open() {
  Serial.println("Fungsi open() dipanggil: Solenoid DIBUKA.");

  // Indikator nada Buzzer 2x bip (200ms on, 200ms off)
  digitalWrite(buzzerPin, HIGH);
  delay(200);
  digitalWrite(buzzerPin, LOW);
  delay(200);
  digitalWrite(buzzerPin, HIGH);
  delay(200);
  digitalWrite(buzzerPin, LOW);

  // Relay Active-LOW: Tarik lidah solenoid membuka kunci
  digitalWrite(relayPin, LOW);
  delay(5000); // Tahan terbuka selama 5 detik
  digitalWrite(relayPin, HIGH); // Kunci kembali secara otomatis

  Serial.println("Solenoid DITUTUP & DIKUNCI KEMBALI.");
}

void setup() {
  Serial.begin(115200);

  pinMode(buzzerPin, OUTPUT);
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH); // Standby dalam kondisi terkunci

  setupWiFi();
  setupAPAndWebServer();
  setupMQTT();
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  server.handleClient(); // Melayani request HTTP masuk (WiFi Direct)

  sendMQTTOnlineMessage();
  delay(2000); // Interval pengiriman status telemetri 2 detik
}
```

---

## 🎮 Fitur Sandbox & Simulasi Daring

Simulasi interaktif lengkap sistem SIKESA dapat diakses langsung melalui browser di:  
🔗 **[https://sikesa.mydiskom.my.id/](https://sikesa.mydiskom.my.id/)**

Fitur-fitur yang tersedia dalam sandbox:
* **Draggable Smartphone Mockup**: Bingkai ponsel dapat digeser bebas mendekat ke unit sensor NFC untuk memicu pembacaan RFID.
* **Draggable & Zoomable Canvas**: Geser (*pan*) canvas latar belakang serta perbesar/perkecil (*zoom in/out*) menggunakan roda mouse atau gestur *pinch* touchpad.
* **Mekanisme Solenoid 3D Dinamis**: Menampilkan lidah solenoid logam (*plunger*) yang secara fisik bergerak mundur (*retract*) saat terbuka dan mengunci kembali setelah 5 detik (`delay(5000)`).
* **Simulasi Nyata WiFi Direct**: Menguji alur kirim `POST /message {"message":"buka"}` ke endpoint `192.168.4.1` dari layar aplikasi.
* **Audio Web Synthesizer**: Menghasilkan suara dentang mekanis solenoid dan *bip 2x* buzzer persis perangkat fisik aslinya.
