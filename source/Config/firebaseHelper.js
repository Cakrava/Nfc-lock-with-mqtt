import {ref, set, onValue, get} from 'firebase/database'; // Firebase Realtime Database
import {database} from './firebase';
import Toast from 'react-native-toast-message'; // Pastikan Toast sudah diinstal
import {useGlobalStateContext} from './GlobalStateContext';
import {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

export function SaveHistory(idUser, loginUser, deviceName, uid, image) {
  const generateTimestampId = () => {
    return Date.now().toString(); // Menggunakan milidetik saat ini sebagai ID
  };

  // Fungsi untuk mendapatkan timestamp dengan format DD-MM-YYYY HH:mm:ss
  const getFormattedTimestamp = () => {
    const now = new Date();
    const pad = num => (num < 10 ? `0${num}` : num); // Fungsi untuk menambahkan 0 jika angka kurang dari 10
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1); // Bulan dimulai dari 0
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  const randomId = generateTimestampId(); // ID unik berbasis timestamp
  const timeStamp = getFormattedTimestamp(); // Timestamp yang diformat

  // Referensi Firebase
  const historyRef = ref(database, `History/${idUser}/${randomId}`);
  const allHistoryRef = ref(database, `AllHistory/${randomId}`);

  // Data yang akan disimpan
  const historyData = {
    idHistory: randomId,
    user: loginUser,
    idUser: idUser,
    idDevice: uid,
    device: deviceName,
    timeStamp: timeStamp,
    image: image,
    pesan: `Membuka pintu ${deviceName}`,
  };

  // Simpan ke dua lokasi berbeda
  Promise.all([
    set(historyRef, historyData), // Simpan ke History
    set(allHistoryRef, historyData), // Simpan ke AllHistory
  ])
    .then(() => {
      Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'History berhasil disimpan!',
        position: 'bottom',
      });
    })
    .catch(error => {
      console.error('Error saving data:', error);
      Toast.show({
        type: 'error',
        text1: 'Gagal',
        text2: 'Gagal menyimpan data!',
        position: 'bottom',
      });
    });
}

export function useApiUrl() {
  const {setApiUrl} = useGlobalStateContext();

  useEffect(() => {
    const apiUrlRef = ref(database, 'validatorHelper/apiUrl');

    const unsubscribe = onValue(apiUrlRef, snapshot => {
      const url = snapshot.val();

      // Pastikan URL ada dan merupakan string
      if (url && typeof url === 'string') {
        // Cek apakah URL diakhiri dengan '/'.
        // Jika tidak, tambahkan '/' di akhir. Jika sudah ada, gunakan apa adanya.
        const finalUrl = url.endsWith('/') ? url : `${url}/`;

        // Simpan URL yang sudah diformat ke global state
        setApiUrl(finalUrl);
        console.log('Fetched & Formatted API URL:', finalUrl);
      } else {
        console.warn(
          'API URL tidak ditemukan atau formatnya salah di Firebase.',
        );
      }
    });

    // Best practice: Lakukan cleanup saat komponen di-unmount
    // untuk menghindari memory leak.
    return () => {
      unsubscribe();
    };
  }, [setApiUrl]);
}

export function getMyHistory() {
  const {
    setMyhistory,
    setMyHistoryEmpty,
    loginId,
    setLoading,
  } = useGlobalStateContext();

  useEffect(() => {
    if (!loginId) {
      return;
    }

    const historyRef = ref(database, `History/${loginId}`);

    const unsubscribe = onValue(
      historyRef,
      snapshot => {
        console.log('mencoba mendapatkan data');

        const data = snapshot.val();
        setMyhistory(
          data ? Object.keys(data).map(key => ({id: key, ...data[key]})) : [],
        );
        if (!data) {
          setMyHistoryEmpty(true);
        } else {
          setMyHistoryEmpty(false);
        }
      },
      error => {
        console.error('Error:', error);
      },
    );

    return () => unsubscribe(); // Cleanup listener
  }, [loginId]); // Hanya trigger effect jika loginId berubah
}

export async function getMyData() {
  const {
    setLoginId,
    setLoginName,
    setLoginNumber,
    setPaymentStatus,
    refreshMyData,
    setLoginUsername,
    setLoginRole,
    setLoginImage,
    setLoginPassword,
    tempId,
    setRefToken,
    setLoginImageToken,
  } = useGlobalStateContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil data dari AsyncStorage
        const userData = await AsyncStorage.getItem('@user_data');

        const parsedData = JSON.parse(userData);

        // Mengakses nilai statusLogin dan checkId
        const statusLogin = parsedData.statusLogin;
        const checkId = parsedData.checkId;

        console.log('Status Login:', statusLogin);
        console.log('Check ID:', checkId);
        console.log('Data dari AsyncStorage:', statusLogin);
        // Ambil data dari Firebase
        var validId = '';
        if (checkId == null) {
          validId = tempId;
        } else {
          validId = checkId;
        }

        const paymentStatusRef = ref(database, 'payment/');
        onValue(paymentStatusRef, snapshot => {
          const paymentStatus = snapshot.val();
          if (paymentStatus) {
            setPaymentStatus(paymentStatus.status === 1);
            console.log(paymentStatus.ref_token);
          } else {
            setPaymentStatus(false);
            console.log('Status Pembayaran: Tidak Lunas');
          }
        });

        const dataRef = ref(database, `Anggota/${validId}`); // Ganti dengan ID yang sesuai
        const unsubscribe = onValue(dataRef, snapshot => {
          const value = snapshot.val();
          if (value) {
            var data = `${value.name} Login aplikasi!`;
            sendLog(data); // Kirim log login
            setLoginId(value.id);
            setLoginName(value.name);
            setLoginNumber(value.nomorWhatsapp);
            setLoginUsername(value.username);
            setLoginRole(value.role);
            setLoginImage(value.imageUrl);
            setLoginPassword(value.password);
            setLoginImageToken(value.imageToken || '');

            console.log('Data dari Firebase:', value.name); // Debugging
          } else {
            console.warn('Data tidak ditemukan di Firebase.');
          }
        });

        // Membersihkan listener ketika komponen unmount
        return () => unsubscribe();
      } catch (error) {
        console.log('Terjadi kesalahan saat mengambil data:', error);
      }
    };

    // Panggil fetchData untuk mendapatkan data
    fetchData();
  }, [tempId, refreshMyData]); // Hanya berjalan sekali ketika komponen pertama kali di-mount
}

export function sendMessage(data) {
  const validatorHelper = ref(database, 'validatorHelper/sendMessaage');
  set(validatorHelper, {
    dataSendMessage: data,
  });
}

export function sendLog(data) {
  if (data) {
    const getFormattedTimestamp = () => {
      const now = new Date();
      const pad = num => (num < 10 ? `0${num}` : num); // Fungsi untuk menambahkan 0 jika angka kurang dari 10
      const day = pad(now.getDate());
      const month = pad(now.getMonth() + 1); // Bulan dimulai dari 0
      const year = now.getFullYear();
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    };
    const getId = () => {
      const now = new Date();
      const pad = num => (num < 10 ? `0${num}` : num); // Fungsi untuk menambahkan 0 jika angka kurang dari 10
      const day = pad(now.getDate());
      const month = pad(now.getMonth() + 1); // Bulan dimulai dari 0
      const year = now.getFullYear();
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      return `${day}${month}${year}${hours}${minutes}${seconds}`;
    };

    const timeStamp = getFormattedTimestamp(); // Timestamp yang diformat
    const forId = getId(); // Timestamp yang diformat

    if (timeStamp && forId) {
      const validatorHelper = ref(database, `validatorHelper/logs/${forId}`);
      set(validatorHelper, {
        id: forId,
        logs: data,
        timeStamp,
      });
    }
  }
}

export function getAllHistory() {
  const {setAllHistory, setAllHistoryEmpty} = useGlobalStateContext();

  useEffect(() => {
    const historyRef = ref(database, 'AllHistory');

    const unsubscribe = onValue(
      historyRef,
      snapshot => {
        console.log('mencoba mendapatkan semua history');

        const data = snapshot.val();
        setAllHistory(
          data ? Object.keys(data).map(key => ({id: key, ...data[key]})) : [],
        );
        if (!data) {
          setAllHistoryEmpty(true);
        } else {
          setAllHistoryEmpty(false);
        }
      },
      error => {
        console.error('Error:', error);
      },
    );

    return () => unsubscribe(); // Cleanup listener
  }, []); // Hanya trigger effect jika loginId berubah
}
export function sendDeviceStatus(device, deviceStatus) {
  const validatorHelper = ref(
    database,
    `validatorHelper/deviceStatus/${device}`,
  );
  set(validatorHelper, {
    deviceStatus: deviceStatus,
  });
}

export async function handleLogin(
  DataId,
  DataPassword,
  setStatusLogin,
  setTempId,
) {
  try {
    const hanyaAngka = /^[0-9]+$/.test(DataId); // cek full angka

    let foundUser = null;
    let userId = null;

    if (hanyaAngka) {
      // Akses langsung via ID
      const dataRef = ref(database, `Anggota/${DataId}`);
      const snapshot = await get(dataRef);
      if (snapshot.exists()) {
        foundUser = snapshot.val();
        userId = DataId;
      }
    } else {
      // Cari berdasarkan username
      const allUsersRef = ref(database, 'Anggota');
      const snapshot = await get(allUsersRef);
      if (snapshot.exists()) {
        const allUsers = snapshot.val();
        const matchingEntry = Object.entries(allUsers).find(
          ([key, user]) => user.username === DataId,
        );
        if (matchingEntry) {
          userId = matchingEntry[0];
          foundUser = matchingEntry[1];
        }
      }
    }

    if (foundUser) {
      if (foundUser.password === DataPassword) {
        await AsyncStorage.setItem(
          '@user_data',
          JSON.stringify({statusLogin: 'sukses', checkId: userId}),
        );
        setStatusLogin(true);
        setTempId(userId);
        console.log('Berhasil login!');
      } else {
        alert('Password atau ID salah!');
      }
    } else {
      alert('Akun tidak ditemukan');
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat login:', error);
  }
}
