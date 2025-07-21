import Paho from 'paho-mqtt';

let client = null;
let isConnecting = false;
let isConnected = false;

// Konfigurasi broker dan client ID
const host = 'ws://broker.emqx.io:8083/mqtt';
const clientId = 'mqtt-async-test-client';

// Inisialisasi client jika belum ada
export function getClient() {
  if (!client) {
    client = new Paho.Client(host, clientId);
    client.onConnectionLost = onConnectionLost;
  }
  return client;
}

// Fungsi menangani koneksi yang terputus
function onConnectionLost(responseObject) {
  console.log('Connection lost:', responseObject.errorMessage);
  isConnected = false;
  // Coba reconnect setelah 3 detik
  setTimeout(() => {
    console.log('Reconnecting...');
    connectMQTT(() => {}); // callback dummy, bisa diatur ulang di luar
  }, 3000);
}

// Fungsi untuk menghubungkan MQTT
export function connectMQTT(setMqttConnect) {
  try {
    const mqttClient = getClient();

    if (mqttClient.isConnected() || isConnecting) {
      console.log('Already connected or connecting...');
      setMqttConnect?.(true);
      return;
    }

    isConnecting = true;

    mqttClient.connect({
      onSuccess: () => {
        console.log('Connected!');
        isConnected = true;
        isConnecting = false;
        setMqttConnect?.(true);
      },
      onFailure: err => {
        console.warn('Failed to connect:', err.errorMessage);
        isConnected = false;
        isConnecting = false;
        setMqttConnect?.(false);
      },
      useSSL: false,
      timeout: 5,
      reconnect: false,
    });

    // Pasang handler error tambahan biar gak crash
    mqttClient.onConnectionLost = responseObject => {
      if (responseObject.errorCode !== 0) {
        console.warn('Connection lost:', responseObject.errorMessage);
        isConnected = false;
        isConnecting = false;
        setMqttConnect?.(false);
      }
    };
  } catch (error) {
    console.error('connectMQTT error caught:', error);
    isConnected = false;
    isConnecting = false;
    setMqttConnect?.(false);
    // jangan lempar error lagi supaya gak crash
  }
}

// Fungsi publish pesan
export function publishMessage(messageContent, messageTopic) {
  const mqttClient = getClient();

  if (mqttClient.isConnected()) {
    const message = new Paho.Message(messageContent);
    message.destinationName = messageTopic;
    mqttClient.send(message);
    console.log(`Message '${messageContent}' sent to '${messageTopic}'`);
  } else {
    console.warn('Cannot publish: MQTT client is not connected.');
  }
}

// Fungsi subscribe topik
export function subscribeTopic(topic, callback) {
  const mqttClient = getClient();

  if (mqttClient.isConnected()) {
    mqttClient.subscribe(topic);
    mqttClient.onMessageArrived = message => {
      console.log(
        `Message received on '${message.destinationName}': ${message.payloadString}`,
      );
      callback(message);
    };
  } else {
    console.warn('Cannot subscribe: MQTT client is not connected.');
  }
}
