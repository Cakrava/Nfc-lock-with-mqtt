import React, {createContext, useContext, useEffect, useState} from 'react';
import {ref, onValue, remove} from 'firebase/database';
import {database} from './firebase';
import {useGlobalStateContext} from './GlobalStateContext';

// 1. Buat Context
const DeviceStatusContext = createContext();

// 2. Buat Provider
export const DeviceStatusProvider = ({children}) => {
  // State yang kita butuhkan HANYA DeviceList
  const [deviceList, setDeviceList] = useState([]);
  const {setTotalDevice} = useGlobalStateContext();

  // Efek ini HANYA untuk mengambil dan mendengarkan daftar perangkat dari Firebase
  useEffect(() => {
    const deviceRef = ref(database, 'Device');

    const unsubscribe = onValue(deviceRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        // Logika filter yang sama dengan server untuk mendapatkan data yang bersih dan relevan
        const allItems = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));

        // Gabungkan data status ke dalam data pengaturan
        const validDevices = allItems
          .filter(device => device.topic && device.name) // Ambil hanya entitas pengaturan
          .map(device => {
            const statusObject = allItems.find(
              item => item.id === device.topic,
            );
            return {
              ...device,
              status: statusObject ? statusObject.status : 'tidak diketahui', // Gabungkan statusnya
            };
          });

        setDeviceList(validDevices);
        setTotalDevice(validDevices.length);
      } else {
        setDeviceList([]);
        setTotalDevice(0);
      }
    });

    // Cleanup listener saat komponen unmount
    return () => unsubscribe();
  }, []); // Hanya berjalan sekali saat komponen dimuat

  // Fungsi hapus perangkat (tidak perlu diubah)
  const deleteDevice = async id => {
    // Note: Server akan otomatis mendeteksi penghapusan ini dan berhenti memantaunya.
    try {
      const deviceRef = ref(database, `Device/${id}`);
      await remove(deviceRef);
      console.log(`Device dengan id ${id} berhasil dihapus`);
    } catch (error) {
      console.error('Error menghapus perangkat:', error);
      throw error; // Lempar error agar bisa ditangkap di UI
    }
  };

  // Nilai yang disediakan ke komponen anak
  // Perhatikan, tidak ada lagi realtimeMessages atau logika MQTT
  const value = {
    deviceList,
    totalDevice: deviceList.length, // Lebih akurat dihitung langsung dari state
    deleteDevice,
  };

  return (
    <DeviceStatusContext.Provider value={value}>
      {children}
    </DeviceStatusContext.Provider>
  );
};

// 3. Buat Custom Hook
export const useDeviceStatusContext = () => useContext(DeviceStatusContext);
