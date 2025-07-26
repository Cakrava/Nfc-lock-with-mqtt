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
  useApiUrl,
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

  const [nfcSupport, setNfcSupport] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);

  const {
    mqttConnected,
    isOnline,
    loginId,
    loginName,
    loginImage,
  } = useGlobalStateContext();
  useApiUrl();
  getMyHistory();
  getAllHistory();
  getMyData();

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
    }

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

        if (!mqttConnected || !isOnline) {
          if (isMountedRef.current) {
            setMessageDetect(
              `Kartu ${uid} terdeteksi. Server tidak terhubung.`,
            );
          }
          sendLog(`Deteksi ${uid} saat server tidak terhubung.`);
          if (isMountedRef.current && aktif) {
            await new Promise(r => setTimeout(r, 2000));
          }
          return;
        }

        // --- BLOK LOGIKA PEMROSESAN TAG ---

        // Langkah 1: Validasi UID kartu di Firebase
        const deviceRef = ref(database, `Device/${uid}`);
        const snapshot = await get(deviceRef);
        const ndefRecords = tag.ndefMessage;

        // Logika pembacaan NDEF (tidak berubah)
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
              setMessageDetect('Record text/plain tidak ditemukan.');
            }
            sendLog(`Deteksi ${uid} tanpa record text/plain.`);
          }
        } else {
          if (isMountedRef.current) {
            setMessageDetect('Berhasil mendapatkan data kartu.');
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
            // ==========================================================
            //               MODIFIKASI UTAMA BERDASARKAN KONTEKS SERVER
            // ==========================================================

            // Langkah 2: Gunakan 'topic' dari data kartu untuk mencari status perangkat fisik.
            // Path ini disesuaikan dengan cara server Node.js menyimpan status.
            const checkStatusDeviceRef = ref(
              database,
              `Device/${topic}/status`,
            );
            const snapStatusData = await get(checkStatusDeviceRef);
            const deviceStatus = snapStatusData.val(); // Langsung ambil nilainya, mis: "online" atau "offline"

            console.log(
              `startScan: UID Valid: ${uid}, Topic/DeviceKey: ${topic}, Status: ${deviceStatus}`,
            );

            // Kondisi utama: Periksa apakah perangkat fisik online.
            if (deviceStatus === 'online') {
              if (isMountedRef.current) {
                setIsInvalid(false);
                setIsSuccess(true);
                setPesan(`Membuka pintu ${deviceName}`);
              }
              // Publikasikan pesan ke MQTT untuk membuka pintu
              publishMessage(
                'Pintu Dibuka oleh pengguna dengan UID valid',
                topic,
              );
              // Simpan riwayat akses
              SaveHistory(loginId, loginName, deviceName, uid, loginImage);
              sendLog(
                `Pintu dibuka oleh ${loginName} (${deviceName} - UID: ${uid})`,
              );
            } else {
              // Jika status bukan 'online' (bisa 'offline' atau null)
              if (isMountedRef.current) {
                setPesan(`Perangkat ${deviceName} offline!`);
                setIsInvalid(true);
                setIsSuccess(false);
              }
              sendLog(
                `Akses ${deviceName} (UID: ${uid}) gagal, perangkat offline!`,
              );
            }
          }
        } else {
          // Jika UID kartu tidak ditemukan di Firebase
          if (isMountedRef.current) {
            setPesan('Perangkat tidak dikenali!');
            setIsInvalid(true);
            setIsSuccess(false);
          }
          console.log(`startScan: UID Tidak Valid: ${uid}`);
          sendLog(`${loginName} mendeteksi UID ${uid} yang tidak dikenali!`);
        }

        if (isMountedRef.current && aktif) {
          await new Promise(r => setTimeout(r, isSuccess ? 1500 : 3000));
        }
        // --- AKHIR BLOK LOGIKA PEMROSESAN TAG ---
      } else {
        if (isMountedRef.current) {
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
          // Biarkan pesan jaringan yang ditampilkan
        } else {
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
        }, 1000);
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
