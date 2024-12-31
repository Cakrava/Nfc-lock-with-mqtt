import React, {createContext, useContext, useState, useEffect} from 'react';
import {connectMQTT, publishMessage} from './mqtt'; // Sesuaikan dengan path yang benar
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import {database} from './firebase'; // Sesuaikan dengan path yang benar
import {ref, get} from 'firebase/database';
import {useGlobalStateContext} from './GlobalStateContext';
import {
  getAllHistory,
  getMyData,
  getMyHistory,
  SaveHistory,
  sendLog,
} from './firebaseHelper';
const NfcContext = createContext();

export const useNfcContext = () => {
  return useContext(NfcContext);
};

export const NfcProvider = ({children}) => {
  const [pesan, setPesan] = useState('Mempersiapkan..');
  const [aktif, setAktif] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDetect, setIsDetect] = useState(false);
  const [nfcProcessing, setNfcProcessing] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [getTopic, setGetTopic] = useState('');
  const [getId, setGetId] = useState(true);
  const [messageDetect, setMessageDetect] = useState('');
  const [idUser, setIdUser] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [image, setImage] = useState('');
  const {
    loginName,
    loginId,
    mqttConnected,
    myHistory,
    loginImage,
  } = useGlobalStateContext();
  getMyData();
  getMyHistory();
  getAllHistory();

  useEffect(() => {
    setIdUser(loginId);
    setLoginUser(loginName);
    setImage(loginImage);
    if (mqttConnected) {
      if (idUser && loginName) {
        startNfcSession();
      } else {
        setPesan(`${loginId} ${loginName}`);
      }
    }
  }, [idUser, loginId, mqttConnected]);

  useEffect(() => {}, [loginName, loginId]);

  const startNfcSession = async () => {
    if (nfcProcessing) return; // Cek apakah NFC sedang diproses

    setNfcProcessing(true); // Tandai bahwa NFC sedang diproses
    console.log('Memulai sesi NFC buka pintu');
    try {
      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        setPesan('NFC tidak didukung di perangkat ini');
        setAktif(false);
        setNfcProcessing(false);
        return;
      }

      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        setPesan('Nyalakan NFC');
        setAktif(false);
        setNfcProcessing(false);
        return;
      }

      await NfcManager.start(); // Mulai NFC Manager
      setAktif(true);
      startScan();
    } catch (error) {
      console.error('Error starting NFC session:', error);
      setPesan('Gagal memulai sesi NFC');
      setNfcProcessing(false);
    }
  };

  const startScan = async () => {
    setIsSuccess(false);
    setIsInvalid(false);
    setPesan('Dekatkan ke perangkat');
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag(); // Baca tag

      if (tag) {
        const uid = tag.id;
        console.log(`UID Terdeteksi: ${uid}`);
        const deviceRef = ref(database, `Device/${uid}`);
        const messageValue = ref(database, `validatorHelper/sendMessaage`);
        const checkStatus = ref(database, `validatorHelper/deviceStatus/`);
        const snapshot = await get(deviceRef);
        const snapData = await get(messageValue);
        const messageData = snapData.val().dataSendMessage;
        setGetId(uid);
        setIsDetect(true);
        const ndefRecords = tag.ndefMessage;
        if (ndefRecords && ndefRecords.length > 0) {
          const textRecord = ndefRecords.find(
            record =>
              record.tnf === 1 &&
              record.type &&
              String.fromCharCode(...record.type) === 'T',
          );

          if (textRecord) {
            const payload = textRecord.payload;
            const plainText = String.fromCharCode(...payload).substring(3);
            setGetTopic(plainText);
            setMessageDetect(`Berhasil mendapatkan data!`);
            var data = 'Perangkat dengan ID: ' + uid + ' telah terdeteksi!';
            sendLog(data);
          } else {
            setMessageDetect('Record text/plain tidak ditemukan');
            var data = 'Deteksi' + uid + ' tanpa record text/plain!';
            sendLog(data);
          }
        } else {
          setMessageDetect('NdefMessage kosong atau tidak ditemukan');
        }

        if (snapshot.exists()) {
          const deviceName = snapshot.val().name;
          const topic = snapshot.val().topic;
          const checkStatus = ref(
            database,
            `validatorHelper/deviceStatus/${topic}`,
          );
          const snapData = await get(checkStatus);
          const dataStatus = snapData.val().deviceStatus;

          console.log(`UID Valid: ${uid}, Topic: ${topic}`);
          if (messageData == 'true') {
            if (dataStatus == 'online') {
              setIsInvalid(false);
              setIsSuccess(true);
              setPesan(`Membuka pintu ${deviceName}`);
              publishMessage(
                'Pintu Dibuka oleh pengguna dengan UID valid',
                topic,
              );
              SaveHistory(idUser, loginUser, deviceName, uid, image);
              var data = 'Pintu dibuka oleh pengguna dengan UID valid';
              sendLog(data);
              console.log(`terdeteksi ${idUser} dengan nama ${loginUser}`);
            } else {
              setPesan(`Perangkat ${deviceName} offline!`);
              setIsInvalid(true);
              setIsSuccess(false);
              var data =
                'Percobaan akses perangkat dengan ID: ' +
                uid +
                ' gagal karena perangkat offline!';
              sendLog(data);
            }
          }
        } else {
          setPesan('Perangkat tidak dikenali!');
          console.log(`UID Tidak Valid: ${uid}`);
          var data =
            loginUser + ' Mendeteksi ' + uid + ' yang tidak dikenali! ';
          sendLog(data);
          setIsInvalid(true);
          setIsSuccess(false);
        }

        // Batalkan sesi teknologi sebelum scan ulang
        await NfcManager.cancelTechnologyRequest();
        setTimeout(() => startScan(), 5000); // Scan ulang setelah 2 detik
      } else {
        setPesan('Tidak ada tag yang terdeteksi. Tempelkan ulang.');
      }
    } catch (error) {
      setPesan('Terjadi kesalan NFC...');
      console.error('Error during NFC scanning:', error.message);

      setTimeout(() => startScan(), 5000); // Scan ulang setelah 2 detik jika terjadi error
    }

    setNfcProcessing(false); // Reset status pemrosesan NFC
  };

  return (
    <NfcContext.Provider
      value={{
        pesan,
        aktif,
        isSuccess,
        nfcProcessing,
        startNfcSession,
        startScan,
        setGetId,
        setGetTopic,
        setMessageDetect,
        setIsDetect,
        getId,
        getTopic,
        isDetect,
        isInvalid,
        messageDetect,
      }}
    >
      {children}
    </NfcContext.Provider>
  );
};
