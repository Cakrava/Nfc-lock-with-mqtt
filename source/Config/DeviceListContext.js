import React, {createContext, useContext, useEffect, useState} from 'react';
import {ref, onValue, remove, set} from 'firebase/database';
import {database} from './firebase'; // Pastikan path ini benar
import {useGlobalStateContext} from './GlobalStateContext'; // Pastikan path ini benar
import {sendLog} from './firebaseHelper'; // Pastikan path ini benar
import {publishMessage} from './mqtt'; // BARU: Impor fungsi publishMessage dari file mqtt Anda

// 1. Buat Context
const DeviceStatusContext = createContext();

// 2. Buat Provider
export const DeviceStatusProvider = ({children}) => {
  const [deviceList, setDeviceList] = useState([]);
  const [memberList, setMemberList] = useState([]); // State untuk menyimpan daftar anggota
  const {setTotalDevice, loginName} = useGlobalStateContext(); // Ambil loginName untuk log

  // Efek #1: Mengambil dan mendengarkan data Anggota.
  useEffect(() => {
    const memberRef = ref(database, 'Anggota');
    const unsubscribe = onValue(memberRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        // Ubah objek anggota menjadi array agar lebih mudah digunakan
        const members = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setMemberList(members);
      } else {
        setMemberList([]);
      }
    });

    // Cleanup listener saat komponen unmount
    return () => unsubscribe();
  }, []); // Dependensi kosong, hanya berjalan sekali.

  // Efek #2: Mengambil data Perangkat dan menggabungkannya dengan data Anggota.
  useEffect(() => {
    const deviceRef = ref(database, 'Device');

    const unsubscribe = onValue(deviceRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const allItems = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));

        const validDevices = allItems
          .filter(device => device.topic && device.name) // Ambil hanya perangkat yang valid
          .map(device => {
            const statusObject = allItems.find(
              item => item.id === device.topic,
            );

            const lockState =
              statusObject?.kondisi?.status ?? 'tidak diketahui';

            const userId = statusObject?.kondisi?.oleh;

            const actingUser = userId
              ? memberList.find(member => member.id === userId)
              : null;

            // Kembalikan objek perangkat yang sudah diperkaya dengan semua data
            return {
              ...device,
              topic: device.topic, // Pastikan topic ada di sini
              status: statusObject ? statusObject.status : 'tidak diketahui',
              lockState: lockState,
              actedBy: actingUser ? actingUser.name : null,
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
  }, [memberList]); // Efek ini bergantung pada `memberList`

  // Fungsi untuk menghapus perangkat
  const deleteDevice = async id => {
    try {
      const deviceRef = ref(database, `Device/${id}`);
      await remove(deviceRef);
      console.log(`Device dengan id ${id} berhasil dihapus`);
    } catch (error) {
      console.error('Error menghapus perangkat:', error);
      throw error;
    }
  };

  // Fungsi baru untuk menutup pintu secara paksa
  const forceCloseDoor = async (topic, deviceName) => {
    const kondisiRef = ref(database, `Device/${topic}/kondisi`);
    try {
      // BARU: Kirim perintah 'tutup' ke topik MQTT perangkat
      publishMessage('tutup', topic);

      // Setelah itu, perbarui status di Firebase
      await set(kondisiRef, {
        status: 'tertutup',
        oleh: '',
      });

      // Kirim log bahwa pintu ditutup paksa
      sendLog(
        `${loginName} menutup paksa pintu "${deviceName}" dari daftar perangkat.`,
      );
      console.log(`Pintu dengan topic ${topic} berhasil ditutup paksa.`);
    } catch (error) {
      console.error('Gagal menutup pintu paksa:', error);
      // Kirim log jika gagal
      sendLog(
        `Gagal menutup paksa pintu "${deviceName}". Error: ${error.message}`,
      );
      throw error; // Lempar error agar bisa ditangkap di UI
    }
  };

  // Nilai yang akan diberikan ke komponen anak-anaknya
  const value = {
    deviceList,
    deleteDevice,
    forceCloseDoor,
  };

  return (
    <DeviceStatusContext.Provider value={value}>
      {children}
    </DeviceStatusContext.Provider>
  );
};

// 3. Buat Custom Hook
export const useDeviceStatusContext = () => useContext(DeviceStatusContext);
