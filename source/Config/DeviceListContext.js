import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import {ref, onValue, remove} from 'firebase/database';
import {database} from './firebase';
import {getClient} from './mqtt';
import {sendDeviceStatus, sendLog} from './firebaseHelper';
import {useGlobalStateContext} from './GlobalStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DeviceStatusContext = createContext();

export const DeviceStatusProvider = ({children}) => {
  const [DeviceList, setDeviceList] = useState([]);
  const {totalDevice, setTotalDevice} = useGlobalStateContext(); // State untuk menyimpan total perangkat
  const [realtimeMessages, setRealtimeMessages] = useState({});
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState({});
  const mqttClient = useRef(null);
  const {mqttConnected} = useGlobalStateContext();
  const [status, setStatus] = useState('');
  const [alamat, setAlamat] = useState('');

  // Firebase: Fetch device list
  useEffect(() => {
    const deviceRef = ref(database, 'Device');

    const unsubscribe = onValue(deviceRef, snapshot => {
      const data = snapshot.val();
      const devices = data
        ? Object.keys(data).map(key => ({id: key, ...data[key]}))
        : [];
      setDeviceList(devices);
      setTotalDevice(devices.length); // Perbarui total perangkat setiap ada perubahan
    });

    return () => unsubscribe();
  }, []);

  // MQTT: Subscribe and handle messages
  useEffect(() => {
    if (mqttConnected) {
      console.log('mencoba berlangganan setelah terhubung');
      if (!mqttClient.current) {
        mqttClient.current = getClient();
      }

      DeviceList.forEach(device => {
        const {topic} = device;
        if (topic) {
          mqttClient.current.subscribe(`${topic}-status`);
          console.log(`${topic}-status`);
        }
      });

      mqttClient.current.onMessageArrived = message => {
        const {destinationName, payloadString} = message;
        const currentTime = Date.now();

        setRealtimeMessages(prev => ({
          ...prev,
          [destinationName]: payloadString,
        }));

        setLastMessageTimestamps(prev => ({
          ...prev,
          [destinationName]: currentTime,
        }));
      };

      return () => {
        DeviceList.forEach(device => {
          const {topic} = device;
          if (topic) {
            mqttClient.current.unsubscribe(topic);
          }
        });
      };
    } else {
      console.log('gagal berlangganan ');
    }
  }, [DeviceList, mqttConnected]);

  // Check device status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();

      setRealtimeMessages(prevMessages => {
        const updatedMessages = {...prevMessages};

        Object.keys(lastMessageTimestamps).forEach(topic => {
          if (
            lastMessageTimestamps[topic] &&
            currentTime - lastMessageTimestamps[topic] > 3000
          ) {
            updatedMessages[topic] = null;
          }
        });

        return updatedMessages;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [lastMessageTimestamps]);

  // Update device status in Firebase
  useEffect(() => {
    if (DeviceList.length > 0) {
      DeviceList.forEach(device => {
        const {topic} = device;
        const deviceStatus =
          realtimeMessages[topic + '-status'] == null ? 'offline' : 'online';
        setStatus(deviceStatus);
        setAlamat(topic);
        sendDeviceStatus(topic, deviceStatus);
      });
    }
  }, [realtimeMessages, DeviceList]);

  const deleteDevice = async id => {
    try {
      const deviceRef = ref(database, `Device/${id}`); // Referensi ke path perangkat
      await remove(deviceRef); // Hapus data dari Firebase
      console.log(`Device with id ${id} successfully deleted`);
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error; // Lempar error jika terjadi masalah
    }
  };

  useEffect(() => {
    var data = `Perangkat  ${alamat} telah ${status}`;
    sendLog(data);
  }, [status, alamat]);

  return (
    <DeviceStatusContext.Provider
      value={{DeviceList, totalDevice, realtimeMessages, deleteDevice}} // Tambahkan totalDevice ke context
    >
      {children}
    </DeviceStatusContext.Provider>
  );
};

export const useDeviceStatusContext = () => useContext(DeviceStatusContext);
