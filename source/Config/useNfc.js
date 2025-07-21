import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import {connectMQTT, publishMessage} from './mqtt';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import {database} from './firebase';
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
  const {nfcProcessing, setNfcProcessing} = useGlobalStateContext();
  const [isInvalid, setIsInvalid] = useState(false);
  const [getTopic, setGetTopic] = useState('');
  const [getId, setGetId] = useState('');
  const [messageDetect, setMessageDetect] = useState('');
  const [idUser, setIdUser] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [image, setImage] = useState('');

  const [nfcSupport, setNfcSupport] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);

  const {mqttConnected, isOnline} = useGlobalStateContext();

  getMyData();
  getMyHistory();
  getAllHistory();

  const isRequestingNfcRef = useRef(false);
  const scanLoopTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Efek untuk memulai sesi NFC utama
  useEffect(() => {
    console.log(
      `NfcProvider Init Effect: mqtt=${mqttConnected}, nfcProc=${nfcProcessing}, aktif=${aktif}`,
    );
    if (mqttConnected && !nfcProcessing && !aktif) {
      console.log(
        'NfcProvider Init Effect: Conditions met to start NFC session. Scheduling...',
      );
      const timeout = setTimeout(() => {
        if (isMountedRef.current && mqttConnected && !aktif) {
          console.log(
            'NfcProvider Init Effect: Timeout finished, calling startNfcSession().',
          );
          startNfcSession();
        } else {
          console.log(
            'NfcProvider Init Effect: Timeout finished, but conditions no longer met.',
          );
        }
      }, 2000);
      return () => {
        console.log(
          'NfcProvider Init Effect: Clearing timeout for startNfcSession.',
        );
        clearTimeout(timeout);
      };
    }
  }, [mqttConnected, nfcProcessing, aktif]);

  // Efek untuk cleanup total saat unmount
  useEffect(() => {
    return () => {
      console.log('NfcProvider: Unmounting component, final NFC cleanup.');
      setAktif(false);
      if (scanLoopTimeoutRef.current) {
        clearTimeout(scanLoopTimeoutRef.current);
      }
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  // Efek untuk memicu startScan ketika 'aktif' menjadi true
  useEffect(() => {
    if (aktif && isMountedRef.current) {
      console.log(
        "NfcProvider Effect [aktif]: 'aktif' is true. Calling startScan().",
      );
      startScan();
    } else if (!aktif && isMountedRef.current) {
      console.log(
        "NfcProvider Effect [aktif]: 'aktif' is false. Scan loop will stop.",
      );
      if (scanLoopTimeoutRef.current) {
        clearTimeout(scanLoopTimeoutRef.current);
      }
    }
  }, [aktif]);

  const startNfcSession = async () => {
    if (!isMountedRef.current) {
      console.log('startNfcSession: Not mounted.');
      return;
    }
    if (aktif || nfcProcessing) {
      console.log(
        `startNfcSession: Session already active or global nfcProcessing. aktif: ${aktif}, nfcProc: ${nfcProcessing}`,
      );
      return;
    }
    setNfcProcessing(true);
    console.log('startNfcSession: Attempting to start NFC session...');
    if (isMountedRef.current) {
      setPesan('Mempersiapkan NFC...');
    } // Diatur di sini agar jelas saat inisialisasi

    try {
      const isSupported = await NfcManager.isSupported();
      if (!isMountedRef.current) {
        console.log('startNfcSession: Unmounted.');
        setNfcProcessing(false);
        return;
      }
      setNfcSupport(isSupported);
      if (!isSupported) {
        console.log('startNfcSession: NFC not supported.');
        if (isMountedRef.current) {
          setPesan('NFC tidak didukung');
        }
        setAktif(false);
        setNfcProcessing(false);
        return;
      }
      const isEnabled = await NfcManager.isEnabled();
      if (!isMountedRef.current) {
        console.log('startNfcSession: Unmounted.');
        setNfcProcessing(false);
        return;
      }
      setNfcEnabled(isEnabled);
      if (!isEnabled) {
        console.log('startNfcSession: NFC is not enabled by user.');
        if (isMountedRef.current) {
          setPesan('Nyalakan NFC Anda');
        }
        setAktif(false);
        setNfcProcessing(false);
        return;
      }
      await NfcManager.start();
      console.log('startNfcSession: NfcManager.start() successful.');
      if (isMountedRef.current) {
        setNfcProcessing(true);
        setAktif(true); // Ini akan memicu useEffect[aktif] untuk memanggil startScan
        console.log(
          'startNfcSession: Session set to active. useEffect[aktif] will call startScan().',
        );
      } else {
        setNfcProcessing(false);
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      console.warn('startNfcSession: Error during NFC session startup:', error);
      if (isMountedRef.current) {
        setPesan('Gagal memulai sesi NFC');
        setAktif(false);
        setNfcProcessing(false);
      }
    }
  };

  const startScan = async () => {
    if (!isMountedRef.current || !aktif) {
      if (isMountedRef.current && !aktif) {
        console.log('startScan: Sesi tidak aktif, tidak memulai pemindaian.');
      }
      return;
    }
    if (isRequestingNfcRef.current) {
      console.log('startScan: Permintaan NFC sebelumnya masih berjalan, skip.');
      return;
    }
    isRequestingNfcRef.current = true;

    // --- Logika Pesan Baru ---
    let currentPesan = 'Dekatkan ke perangkat';
    if (!isOnline) {
      currentPesan = 'Tidak ada koneksi internet. Deteksi kartu tetap aktif.';
    } else if (!mqttConnected) {
      currentPesan = 'Jaringan server terputus. Deteksi kartu tetap aktif.';
    }
    if (isMountedRef.current) {
      setPesan(currentPesan);
      setIsSuccess(false);
      setIsInvalid(false);
    }
    // --- Akhir Logika Pesan Baru ---

    try {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {}
      await NfcManager.requestTechnology(NfcTech.Ndef);
      if (!isMountedRef.current || !aktif) {
        isRequestingNfcRef.current = false;
        return;
      }

      const tag = await NfcManager.getTag();
      if (!isMountedRef.current || !aktif) {
        isRequestingNfcRef.current = false;
        return;
      }

      if (tag) {
        const uid = tag.id || 'UID_TIDAK_DIKETAHUI';
        console.log(`startScan: UID Terdeteksi: ${uid}`);
        if (isMountedRef.current) {
          setGetId(uid);
          setIsDetect(true);
        }

        // Jika tidak ada koneksi MQTT, kita mungkin tidak ingin melanjutkan ke logika server
        // tapi tetap memberikan feedback bahwa kartu terdeteksi.
        if (!mqttConnected || !isOnline) {
          if (isMountedRef.current) {
            setMessageDetect(
              `Kartu ${uid} terdeteksi. Server tidak terhubung.`,
            );
            // Jangan set isSuccess atau isInvalid karena kita tidak bisa validasi ke server
          }
          sendLog(`Deteksi ${uid} saat server tidak terhubung.`);
          // Langsung ke finally untuk loop scan berikutnya
          // Jeda singkat agar pesan terbaca
          if (isMountedRef.current && aktif) {
            await new Promise(r => setTimeout(r, 2000));
          }
          return; // Keluar dari try blok, langsung ke finally
        }

        // --- BLOK LOGIKA PEMROSESAN TAG (Hanya jika MQTT terhubung) ---
        const deviceRef = ref(database, `Device/${uid}`);
        const messageValue = ref(database, 'validatorHelper/sendMessaage');
        const snapshot = await get(deviceRef);
        const snapData = await get(messageValue);
        const messageData = snapData.val()?.dataSendMessage;
        const ndefRecords = tag.ndefMessage;

        if (ndefRecords && ndefRecords.length > 0) {
          const textRecord = ndefRecords.find(
            r =>
              r.tnf === 1 && r.type && String.fromCharCode(...r.type) === 'T',
          );
          if (textRecord && textRecord.payload) {
            const langCodeLength = textRecord.payload[0] & 0x3f;
            const textPayload = textRecord.payload.slice(1 + langCodeLength);
            const plainText = String.fromCharCode(...textPayload);
            if (isMountedRef.current) {
              setGetTopic(plainText);
              setMessageDetect('Berhasil mendapatkan data NDEF!');
            }
            sendLog(`UID: ${uid} terdeteksi dengan NDEF: ${plainText}`);
          } else {
            if (isMountedRef.current) {
              setMessageDetect(
                'Record text/plain tidak ditemukan atau payload kosong',
              );
            }
            sendLog(
              `Deteksi ${uid} tanpa record text/plain atau payload kosong!`,
            );
          }
        } else {
          if (isMountedRef.current) {
            setMessageDetect('Berhasil mendapatkan data');
          }
          sendLog(`Deteksi ${uid} tanpa NdefMessage.`);
        }

        if (snapshot.exists()) {
          const deviceData = snapshot.val();
          const deviceName = deviceData.name;
          const topic = deviceData.topic;
          if (!topic) {
            if (isMountedRef.current) {
              setPesan(`Topic tidak valid untuk ${deviceName}`);
              setIsInvalid(true);
            }
            sendLog(
              `Gagal proses ${deviceName} (UID: ${uid}), topic tidak ada di Firebase.`,
            );
          } else {
            const checkStatusDeviceRef = ref(
              database,
              `validatorHelper/deviceStatus/${topic}`,
            );
            const snapStatusData = await get(checkStatusDeviceRef);
            const dataStatus = snapStatusData.val()?.deviceStatus;
            console.log(
              `startScan: UID Valid: ${uid}, Topic: ${topic}, Device Status: ${dataStatus}`,
            );
            if (messageData == 'true') {
              if (dataStatus == 'online') {
                if (isMountedRef.current) {
                  setIsInvalid(false);
                  setIsSuccess(true);
                  setPesan(`Membuka pintu ${deviceName}`);
                }
                publishMessage(
                  'Pintu Dibuka oleh pengguna dengan UID valid',
                  topic,
                );
                SaveHistory(idUser, loginUser, deviceName, uid, image);
                sendLog(`Pintu dibuka oleh ${loginUser} (UID: ${uid})`);
              } else {
                if (isMountedRef.current) {
                  setPesan(`Perangkat ${deviceName} offline!`);
                  setIsInvalid(true);
                  setIsSuccess(false);
                }
                sendLog(`Akses ${deviceName} (UID: ${uid}) gagal, offline!`);
              }
            } else {
              if (isMountedRef.current) {
                setPesan('Pengiriman pesan tidak diizinkan.');
                setIsInvalid(true);
                setIsSuccess(false);
              }
              sendLog(`Akses ke ${uid} gagal, messageData bukan "true"`);
            }
          }
        } else {
          if (isMountedRef.current) {
            setPesan('Perangkat tidak dikenali!');
            setIsInvalid(true);
            setIsSuccess(false);
          }
          console.log(`startScan: UID Tidak Valid: ${uid}`);
          sendLog(`${loginUser} mendeteksi UID ${uid} yang tidak dikenali!`);
        }
        if (isMountedRef.current && aktif) {
          await new Promise(r => setTimeout(r, isSuccess ? 1500 : 3000));
        }
        // --- AKHIR BLOK LOGIKA PEMROSESAN TAG ---
      } else {
        // Tidak ada tag, pesan sudah diatur di atas sesuai kondisi jaringan
        if (isMountedRef.current) {
          // setPesan('Tidak ada tag. Tempelkan ulang.'); // Pesan sudah diatur di atas
          setIsDetect(false);
        }
      }
    } catch (error) {
      if (!isMountedRef.current || !aktif) {
        isRequestingNfcRef.current = false;
        return;
      }
      console.error('startScan: Error during NFC scanning:', error.message);
      if (isMountedRef.current) {
        if (
          error.message &&
          (error.message.includes('cancelled') ||
            error.message.includes('closed'))
        ) {
          // Pesan sudah diatur sesuai kondisi jaringan
        } else {
          // Pesan error NFC umum, mungkin timpa pesan jaringan jika lebih penting
          setPesan('Terjadi kesalahan NFC...');
        }
        setIsDetect(false);
      }
    } finally {
      isRequestingNfcRef.current = false;
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {}
      if (isMountedRef.current && aktif) {
        clearTimeout(scanLoopTimeoutRef.current);
        scanLoopTimeoutRef.current = setTimeout(() => {
          console.log('startScan finally: Scheduling next scan.');
          startScan();
        }, 1000); // Jeda untuk loop
      } else if (isMountedRef.current) {
        console.log(
          'startScan finally: Sesi tidak aktif, tidak menjadwalkan scan berikutnya.',
        );
      }
    }
  };

  return (
    <NfcContext.Provider
      value={{
        pesan,
        aktif,
        isSuccess,
        nfcProcessing,
        startNfcSession,
        setGetId,
        setGetTopic,
        setMessageDetect,
        setIsDetect,
        getId,
        getTopic,
        isDetect,
        isInvalid,
        messageDetect,
        nfcSupport,
        nfcEnabled,
      }}
    >
      {children}
    </NfcContext.Provider>
  );
};
