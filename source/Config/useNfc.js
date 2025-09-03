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
import {ref, get, set} from 'firebase/database';

import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const isRequestingNfcRef = useRef(false);
  const scanLoopTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useApiUrl();
  getMyHistory();
  getAllHistory();
  getMyData();

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
    // Pengecekan awal, tidak berubah
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
    if (!mqttConnected) {
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
      } catch (e) {
        /* Abaikan error pembatalan */
      }

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

        if (!mqttConnected) {
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

          // ==========================================================
          //         MODIFIKASI: MENGAMBIL DATA PENGGUNA AKTIF
          // ==========================================================
          let currentUserId = null;
          let currentUserName = 'Pengguna tidak dikenal';
          let currentUserImage = '';

          try {
            // 1. Dapatkan kunci phone-random dari AsyncStorage
            const phoneDataKey = await AsyncStorage.getItem(
              '@phonedataid_saved',
            );
            if (!phoneDataKey) {
              throw new Error(
                'Kunci data ponsel tidak ditemukan. Silakan login ulang.',
              );
            }

            // 2. Dapatkan loginId (currentUserId) dari 'phonedataid'
            const phoneRef = ref(database, `phonedataid/${phoneDataKey}`);
            const phoneSnapshot = await get(phoneRef);
            if (!phoneSnapshot.exists() || !phoneSnapshot.val().loginId) {
              throw new Error('Sesi pengguna tidak valid. Coba login ulang.');
            }
            currentUserId = phoneSnapshot.val().loginId;

            // 3. Dapatkan detail pengguna dari 'Anggota'
            const userRef = ref(database, `Anggota/${currentUserId}`);
            const userSnapshot = await get(userRef);
            if (!userSnapshot.exists()) {
              throw new Error(
                `Data untuk pengguna dengan ID ${currentUserId} tidak ditemukan.`,
              );
            }

            const userData = userSnapshot.val();
            currentUserName = userData.name || 'Nama Tidak Ada';
            currentUserImage = userData.imageUrl || '';
          } catch (userError) {
            console.error('Gagal mengambil data pengguna:', userError.message);
            if (isMountedRef.current) {
              setPesan(userError.message);
              setIsInvalid(true);
            }
            // Hentikan proses jika data pengguna gagal didapatkan
            isRequestingNfcRef.current = false;
            return;
          }

          // ==========================================================
          //         LANJUTAN LOGIKA DENGAN DATA PENGGUNA BARU
          // ==========================================================

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
              `Device/${topic}/status`,
            );
            const snapStatusData = await get(checkStatusDeviceRef);
            const deviceStatus = snapStatusData.val();

            console.log(
              `startScan: UID Valid: ${uid}, Topic: ${topic}, Status: ${deviceStatus}`,
            );

            if (deviceStatus === 'online') {
              const checkKondisiPintuRef = ref(
                database,
                `Device/${topic}/kondisi`,
              );
              const snapKondisi = await get(checkKondisiPintuRef);
              const kondisiData = snapKondisi.val() || {
                status: 'tertutup',
                oleh: '',
              };
              const statusPintu = kondisiData.status || 'tertutup';
              const pemilikPintuId = kondisiData.oleh || '';

              if (statusPintu === 'tertutup') {
                if (isMountedRef.current) {
                  setIsInvalid(false);
                  setIsSuccess(true);
                  setPesan(`Membuka pintu ${deviceName}...`);
                }
                publishMessage('buka', topic);
                await set(checkKondisiPintuRef, {
                  status: 'terbuka',
                  oleh: currentUserId,
                });

                SaveHistory(
                  currentUserId,
                  currentUserName,
                  deviceName,
                  uid,
                  currentUserImage,
                  'terbuka',
                );
                sendLog(
                  `Pintu ${deviceName} dibuka oleh ${currentUserName} (UID: ${uid})`,
                );
              } else {
                // statusPintu === 'terbuka'
                if (currentUserId === pemilikPintuId) {
                  if (isMountedRef.current) {
                    setIsInvalid(false);
                    setIsSuccess(true);
                    setPesan(`Menutup pintu ${deviceName}...`);
                  }
                  publishMessage('tutup', topic);
                  await set(checkKondisiPintuRef, {
                    status: 'tertutup',
                    oleh: '',
                  });

                  SaveHistory(
                    currentUserId,
                    currentUserName,
                    deviceName,
                    uid,
                    currentUserImage,
                    'tertutup',
                  );
                  sendLog(
                    `Pintu ${deviceName} ditutup oleh ${currentUserName} (UID: ${uid})`,
                  );
                } else {
                  const pemilikRef = ref(database, `Anggota/${pemilikPintuId}`);
                  const snapPemilik = await get(pemilikRef);
                  let namaPemilik = 'pengguna lain';
                  if (snapPemilik.exists()) {
                    namaPemilik = snapPemilik.val().name || 'pengguna lain';
                  }

                  if (isMountedRef.current) {
                    setIsInvalid(true);
                    setIsSuccess(false);
                    setPesan(`Pintu dibuka oleh ${namaPemilik}`);
                  }
                  sendLog(
                    `Akses ${currentUserName} ditolak, pintu sedang digunakan oleh ${namaPemilik}`,
                  );
                }
              }
            } else {
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
          // Jika UID kartu tidak ditemukan, perlu tahu siapa yang mencoba
          // Kita fetch data pengguna bahkan untuk UID yang tidak valid untuk keperluan logging
          let attemptedBy = 'Pengguna tidak dikenal';
          try {
            const phoneKey = await AsyncStorage.getItem('@phonedataid_saved');
            if (phoneKey) {
              const pRef = ref(database, `phonedataid/${phoneKey}`);
              const pSnap = await get(pRef);
              if (pSnap.exists() && pSnap.val().loginId) {
                const uRef = ref(database, `Anggota/${pSnap.val().loginId}`);
                const uSnap = await get(uRef);
                if (uSnap.exists()) {
                  attemptedBy = uSnap.val().name;
                }
              }
            }
          } catch (logError) {
            console.error(
              'Gagal mendapatkan nama pengguna untuk log UID tidak valid:',
              logError,
            );
          }

          if (isMountedRef.current) {
            setPesan('Perangkat tidak dikenali!');
            setIsInvalid(true);
            setIsSuccess(false);
          }
          console.log(`startScan: UID Tidak Valid: ${uid}`);
          sendLog(`${attemptedBy} mendeteksi UID ${uid} yang tidak dikenali!`);
        }

        if (isMountedRef.current && aktif) {
          await new Promise(r => setTimeout(r, isSuccess ? 1500 : 3000));
        }
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
      } catch (e) {
        /* Abaikan */
      }

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
