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

const DeviceStatusContext = createContext();

export const DeviceStatusProvider = ({children}) => {
  const [DeviceList, setDeviceList] = useState([]);
  const {totalDevice, setTotalDevice, mqttConnected} = useGlobalStateContext();
  const [realtimeMessages, setRealtimeMessages] = useState({});
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState({});
  const [lastDeviceStatuses, setLastDeviceStatuses] = useState({});
  const mqttClient = useRef(null);

  // Firebase: Fetch device list
  useEffect(() => {
    const deviceRef = ref(database, 'Device');

    const unsubscribe = onValue(deviceRef, snapshot => {
      const data = snapshot.val();
      const devices = data
        ? Object.keys(data).map(key => ({id: key, ...data[key]}))
        : [];
      setDeviceList(devices);
      setTotalDevice(devices.length);
    });

    return () => unsubscribe();
  }, []);

  // MQTT: Subscribe and handle messages
  useEffect(() => {
    if (mqttConnected) {
      if (!mqttClient.current) {
        mqttClient.current = getClient();
      }

      DeviceList.forEach(device => {
        const {topic} = device;
        if (topic) {
          mqttClient.current.subscribe(`${topic}-status`);
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
            mqttClient.current.unsubscribe(`${topic}-status`);
          }
        });
      };
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
            currentTime - lastMessageTimestamps[topic] > 7000
          ) {
            updatedMessages[topic] = null;
          }
        });

        return updatedMessages;
      });
    }, 2000); // Cek setiap 2 detik

    return () => clearInterval(interval);
  }, [lastMessageTimestamps]);

  // Update device status in Firebase
  useEffect(() => {
    if (DeviceList.length > 0) {
      const updatedStatuses = {...lastDeviceStatuses};

      DeviceList.forEach(device => {
        const {topic} = device;
        const key = `${topic}-status`;
        const currentStatus =
          realtimeMessages[key] == null ? 'offline' : 'online';
        const previousStatus = lastDeviceStatuses[topic];

        sendDeviceStatus(topic, currentStatus);

        if (previousStatus !== currentStatus) {
          const logData = `Perangkat ${topic} telah ${currentStatus}`;
          sendLog(logData);
          updatedStatuses[topic] = currentStatus;
        }
      });

      setLastDeviceStatuses(updatedStatuses);
    }
  }, [realtimeMessages, DeviceList]);

  // Fungsi hapus perangkat
  const deleteDevice = async id => {
    try {
      const deviceRef = ref(database, `Device/${id}`);
      await remove(deviceRef);
      console.log(`Device with id ${id} successfully deleted`);
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  };

  return (
    <DeviceStatusContext.Provider
      value={{
        DeviceList,
        totalDevice,
        realtimeMessages,
        deleteDevice,
      }}
    >
      {children}
    </DeviceStatusContext.Provider>
  );
};

export const useDeviceStatusContext = () => useContext(DeviceStatusContext);
