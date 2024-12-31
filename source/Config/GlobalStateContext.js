import React, {createContext, useContext, useEffect, useState} from 'react';

import {connectMQTT} from './mqtt'; // Sesuaikan dengan path yang benar
const GlobalStateContext = createContext();

export const useGlobalStateContext = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({children}) => {
  const [loginId, setLoginId] = useState(null);
  const [loginName, setLoginName] = useState('');
  const [loginNumber, setLoginNumber] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [loginImage, setLoginImage] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [mqttConnected, setMqttConnect] = useState(false);
  const [isOnline, setIsOnline] = useState(null);
  const [myHistory, setMyhistory] = useState([]);
  const [myHistoryEmpty, setMyHistoryEmpty] = useState(true);
  const [allHistory, setAllHistory] = useState([]);
  const [allHistoryEmpty, setAllHistoryEmpty] = useState(true);
  const [checkStatus, setStatusLogin] = useState(null);
  const [tempId, setTempId] = useState('');
  const [statusLogin, setLogin] = useState(null);
  const [refrashMyData, setRefreshMyData] = useState(null);
  const [totalDevice, setTotalDevice] = useState(null);

  const checkInternetConnection = async () => {
    try {
      const response = await fetch('https://8.8.8.8', {
        method: 'HEAD', // Request tipe HEAD untuk cek cepat
        cache: 'no-cache',
      });

      if (response.ok) {
        setIsOnline(true); // Koneksi berhasil
        console.log('Koneksi Google berhasil');
        connectMQTT(setMqttConnect); // Rekoneksi MQTT hanya jika ping sukses
      } else {
        setIsOnline(false); // Koneksi gagal
        console.log('Koneksi tidak berhasil (respons tidak OK).');
      }
    } catch (error) {
      setIsOnline(false); // Tangkap error jika tidak ada koneksi
      console.log('Tidak ada koneksi internet.');
    }
  };

  useEffect(() => {
    // Interval untuk cek koneksi setiap 3 detik
    const interval = setInterval(() => {
      checkInternetConnection(); // Panggil fungsi cek koneksi
    }, 3000); // Interval 3 detik

    return () => clearInterval(interval); // Hentikan interval saat komponen dilepas
  }, []);

  return (
    <GlobalStateContext.Provider
      value={{
        isOnline,
        loginId,
        setLoginId,
        loginName,
        setLoginName,
        loginNumber,
        setLoginNumber,
        loginRole,
        setLoginRole,
        loginImage,
        setLoginImage,
        loginPassword,
        setLoginPassword,
        isOnline,
        mqttConnected,
        myHistory,
        setMyhistory,
        myHistoryEmpty,
        setMyHistoryEmpty,
        allHistory,
        setAllHistory,
        allHistoryEmpty,
        setAllHistoryEmpty,
        checkStatus,
        setStatusLogin,
        tempId,
        setTempId,
        statusLogin,
        setLogin,
        refrashMyData,
        setRefreshMyData,
        totalDevice,
        setTotalDevice,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};
