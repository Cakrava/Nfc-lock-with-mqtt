import React, {createContext, useContext, useEffect, useState} from 'react';

import {connectMQTT} from './mqtt'; // Sesuaikan dengan path yang benar
import {simpanPhoneDataId} from './firebaseHelper';
const GlobalStateContext = createContext();

export const useGlobalStateContext = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({children}) => {
  const [nfcProcessing, setNfcProcessing] = useState(false);
  const [loginId, setLoginId] = useState(null);
  const [loginName, setLoginName] = useState('');
  const [loginImageToken, setLoginImageToken] = useState('');
  const [loginNumber, setLoginNumber] = useState('');
  const [LoginUsername, setLoginUsername] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [loginImage, setLoginImage] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [mqttConnected, setMqttConnect] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [myHistory, setMyhistory] = useState([]);
  const [myHistoryEmpty, setMyHistoryEmpty] = useState(true);
  const [allHistory, setAllHistory] = useState([]);
  const [allHistoryEmpty, setAllHistoryEmpty] = useState(true);
  const [checkStatus, setStatusLogin] = useState(null);
  const [tempId, setTempId] = useState('');
  const [statusLogin, setLogin] = useState(null);
  const [refrashMyData, setRefreshMyData] = useState(true);
  const [totalDevice, setTotalDevice] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(true);
  const [chekingInternet, setChekingInternet] = useState(true);
  const [restartNFC, setRestartNFC] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [apiUrl, setApiUrl] = useState('');

  const checkInternetConnection = async () => {
    try {
      console.log(
        'Melakukan cek koneksi, percobaan ke-',
        attempt + 1,
        'dan isOnline',
        isOnline,
      );
      const response = await fetch('https://8.8.8.8', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        setIsOnline(true);
        connectMQTT(setMqttConnect);
        setAttempt(0); // reset percobaan jika sukses
      } else {
        throw new Error('Response tidak OK');
      }
    } catch (error) {
      if (attempt < 1) {
        // coba ulang 1 kali lagi
        setAttempt(prev => prev + 1);
        setTimeout(checkInternetConnection, 1000); // coba ulang setelah 1 detik
      } else {
        // setelah 2 kali gagal baru set false
        setIsOnline(false);
        setAttempt(0); // reset percobaan
        console.log('Tidak ada koneksi internet setelah 2 kali percobaan.');
      }
    }
  };
  useEffect(() => {
    simpanPhoneDataId();
  }, []);

  useEffect(() => {
    if (chekingInternet) {
      setIsOnline(true); // sementara anggap online dulu pas mulai cek

      setAttempt(0);
      setTimeout(checkInternetConnection, 3000);
    } else {
      setIsOnline(true);
      setAttempt(0);
      console.log('Mode cek internet dimatikan, status tetap online.');
    }
  }, [chekingInternet]);

  return (
    <GlobalStateContext.Provider
      value={{
        isOnline,
        loginId,
        setLoginId,
        loginName,
        setLoginName,
        loginNumber,
        LoginUsername,
        setLoginUsername,
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
        paymentStatus,
        setPaymentStatus,
        chekingInternet,
        setChekingInternet,
        nfcProcessing,
        setNfcProcessing,
        checkInternetConnection,
        loginImageToken,
        setLoginImageToken,
        apiUrl,
        setRestartNFC,
        restartNFC,
        setApiUrl,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};
