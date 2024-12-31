// config.js
import Paho from 'paho-mqtt';

let client = null;

// Fungsi untuk menginisialisasi client jika belum terhubung

export function getClient() {
  if (!client) {
    // const host = 'ws://test.mosquitto.org:8080/mqtt';
    // const host = 'ws://mqtt.eclipseprojects.io:80/mqtt';
    // const host = 'ws://broker.hivemq.com:8000/mqtt';

    const host = 'ws://broker.emqx.io:8083/mqtt';
    client = new Paho.Client(host, 'mqtt-async-test-client');
  }
  return client;
}
// mqtt.eclipseprojects.io:80

export function connectMQTT(setMqttConnect) {
  const mqttClient = getClient();

  // Cek apakah sudah terhubung
  if (mqttClient.isConnected()) {
    console.log('Already connected!');
    setMqttConnect(true);
    return;
  }

  // Koneksi MQTT jika belum terhubung
  mqttClient.connect({
    onSuccess: () => {
      console.log('Connected!');
      setMqttConnect(true);
    },
    onFailure: () => {
      console.log('Failed to connect!');
      setMqttConnect(false); // Tetap set false tanpa error
    },
  });
}

// Fungsi untuk mengirim pesan melalui MQTT
export function publishMessage(messageContent, messageTopic) {
  const mqttClient = getClient();
  if (mqttClient.isConnected()) {
    const message = new Paho.Message(messageContent);
    message.destinationName = messageTopic; // Topik tujuan
    mqttClient.send(message);
    console.log(`Message '${messageContent}' sent to '${messageTopic}'`);
  } else {
    console.log('Client is not connected!');
  }
}
