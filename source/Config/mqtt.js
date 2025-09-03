import Paho from 'paho-mqtt';

// --- Bagian yang Diperbarui ---

// Variabel state modul
let client = null;
let isConnecting = false;
let reconnectionTimeout = null; // Menyimpan ID timeout untuk manajemen

// Alamat broker
const host = 'ws://broker.emqx.io:8083/mqtt';

/**
 * Fungsi untuk menghasilkan Client ID yang unik setiap kali aplikasi dijalankan.
 * Ini adalah perbaikan paling KRUSIAL untuk mencegah konflik koneksi antar perangkat.
 * @returns {string} Client ID yang unik, contoh: 'app-client-1678886400000-a1b2'
 */
const generateUniqueId = () => {
  return (
    'app-client-' + Date.now() + '-' + Math.random().toString(16).substr(2, 4)
  );
};

// --- Logika Inti yang Direvisi ---

/**
 * Fungsi utama untuk menghubungkan client ke broker MQTT.
 * Fungsi ini sekarang bertanggung jawab untuk membuat instance client jika belum ada.
 * @param {Function} setMqttConnect - Callback untuk memperbarui state koneksi di UI React.
 */
export function connectMQTT(setMqttConnect) {
  // Mencegah beberapa upaya koneksi atau reconnect berjalan bersamaan
  if (isConnecting || (client && client.isConnected())) {
    console.log('MQTT: Sudah terhubung atau sedang dalam proses koneksi.');
    return;
  }

  isConnecting = true;

  // Jika client belum pernah dibuat, buat instance baru dengan ID unik.
  if (!client) {
    const uniqueClientId = generateUniqueId();
    console.log(`MQTT: Membuat client baru dengan ID: ${uniqueClientId}`);
    client = new Paho.Client(host, uniqueClientId);

    // Tetapkan handler HANYA SEKALI saat client dibuat.
    client.onConnectionLost = responseObject => {
      // Hanya jalankan jika koneksi benar-benar terputus karena error.
      if (responseObject.errorCode !== 0) {
        console.warn('MQTT: Koneksi terputus.', responseObject.errorMessage);
        if (reconnectionTimeout) {
          clearTimeout(reconnectionTimeout);
        } // Hapus timeout lama jika ada

        setMqttConnect?.(false); // Update UI bahwa koneksi terputus

        console.log('MQTT: Mencoba menyambung kembali dalam 5 detik...');
        reconnectionTimeout = setTimeout(() => {
          connectMQTT(setMqttConnect); // Coba sambungkan lagi dengan callback yang sama
        }, 5000); // Beri jeda lebih lama agar tidak membebani server/jaringan
      }
    };

    client.onMessageArrived = message => {
      // Ini adalah handler global, bisa di-override oleh subscribeTopic jika perlu,
      // atau bisa digunakan untuk memproses semua pesan yang masuk.
      console.log(
        `MQTT: Pesan diterima di topik '${message.destinationName}': ${message.payloadString}`,
      );
      // Jika Anda memiliki satu fungsi global untuk menangani semua pesan, panggil di sini.
    };
  }

  console.log('MQTT: Menghubungkan ke broker...');
  client.connect({
    onSuccess: () => {
      console.log('MQTT: Berhasil terhubung!');
      isConnecting = false;
      setMqttConnect?.(true); // Update UI
    },
    onFailure: err => {
      console.error('MQTT: Gagal terhubung.', err.errorMessage);
      isConnecting = false;
      setMqttConnect?.(false); // Update UI
    },
    useSSL: false,
    timeout: 5,
    reconnect: false, // Kita menangani reconnect secara manual agar lebih terkontrol
  });
}

/**
 * Fungsi untuk memutuskan koneksi MQTT secara bersih.
 */
export function disconnectMQTT() {
  if (client && client.isConnected()) {
    console.log('MQTT: Memutuskan koneksi...');
    client.disconnect();
  }
  if (reconnectionTimeout) {
    clearTimeout(reconnectionTimeout);
  } // Batalkan semua jadwal reconnect
  client = null; // Hapus instance client agar bisa dibuat baru lagi nanti
  isConnecting = false;
}

// --- Fungsi Publikasi dan Langganan (Tidak banyak berubah) ---

/**
 * Fungsi untuk mempublikasikan pesan ke sebuah topik.
 * @param {string} messageContent - Isi pesan yang akan dikirim.
 * @param {string} messageTopic - Topik tujuan.
 */
export function publishMessage(messageContent, messageTopic) {
  if (client && client.isConnected()) {
    const message = new Paho.Message(messageContent);
    message.destinationName = messageTopic;
    client.send(message);
    console.log(
      `MQTT: Pesan '${messageContent}' dikirim ke topik '${messageTopic}'`,
    );
  } else {
    console.warn('MQTT: Tidak dapat mengirim pesan, client tidak terhubung.');
  }
}

/**
 * Fungsi untuk berlangganan (subscribe) ke sebuah topik.
 * @param {string} topic - Topik yang akan di-subscribe.
 * @param {Function} onMessageCallback - Fungsi yang akan dipanggil saat pesan diterima di topik ini.
 */
export function subscribeTopic(topic, onMessageCallback) {
  if (client && client.isConnected()) {
    console.log(`MQTT: Berlangganan ke topik '${topic}'`);
    client.subscribe(topic);

    // Ini akan menimpa onMessageArrived global. Jika Anda perlu menangani
    // banyak subscription dengan callback berbeda, arsitekturnya perlu diubah
    // (misalnya menyimpan callback dalam sebuah map berdasarkan topik).
    // Untuk kasus sederhana, ini sudah cukup.
    client.onMessageArrived = message => {
      if (message.destinationName === topic) {
        onMessageCallback(message);
      }
    };
  } else {
    console.warn('MQTT: Tidak dapat berlangganan, client tidak terhubung.');
  }
}
