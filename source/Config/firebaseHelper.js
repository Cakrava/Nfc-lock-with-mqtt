import {ref, set, onValue, get, update} from 'firebase/database'; // Firebase Realtime Database
import {database} from './firebase';
import Toast from 'react-native-toast-message'; // Pastikan Toast sudah diinstal
import {useGlobalStateContext} from './GlobalStateContext';
import {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
// import DeviceInfo from 'react-native-device-info';
export function SaveHistory(
  loginId,
  loginName,
  deviceName,
  uid,
  loginImage,
  cekKondisi,
) {
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
  const historyRef = ref(database, `History/${loginId}/${randomId}`);
  const allHistoryRef = ref(database, `AllHistory/${randomId}`);
  let isiPesan = '';
  if (cekKondisi === 'terbuka') {
    isiPesan = `Membuka pintu ${deviceName}`;
  } else if (cekKondisi === 'tertutup') {
    isiPesan = `Mengunci pintu ${deviceName}`;
  } else {
    isiPesan = `Aksi pada pintu ${deviceName}`;
  }
  // Data yang akan disimpan
  const historyData = {
    idHistory: randomId,
    user: loginName,
    iduser: loginId,
    idDevice: uid,
    device: deviceName,
    timeStamp: timeStamp,
    image: loginImage,
    pesan: isiPesan,
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
        console.log('mencoba mendapatkan data history saya');

        const data = snapshot.val();
        setMyhistory(
          data ? Object.keys(data).map(key => ({id: key, ...data[key]})) : [],
        );
        if (!data) {
          setMyHistoryEmpty(true);
          console.log('data history sukses diambil');
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
    setRefreshMyData,
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
            setRefreshMyData(false);
            console.log('Data dari Firebase:', value.name); // DebuggingrefreshMyData
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

// Fungsi untuk menyimpan phoneId ke database dan AsyncStorage
export async function simpanPhoneDataId(loginId) {
  try {
    // 1. Cek terlebih dahulu apakah key sudah ada di AsyncStorage
    const existingKey = await AsyncStorage.getItem('@phonedataid_saved');

    // 2. Jika key sudah ada, hentikan fungsi agar tidak menyimpan ulang
    if (existingKey) {
      console.log(
        'Phone data id sudah tersimpan sebelumnya. Proses dibatalkan.',
      );
      return; // Keluar dari fungsi
    }

    // --- Jika key belum ada, lanjutkan proses penyimpanan ---

    // 3. Buat key unik dengan format phone-{timestamp}
    const key = `phone-${Date.now()}`;
    console.log(`Membuat key baru dan menyimpan: ${key}`);

    // 4. Siapkan data yang akan disimpan ke database
    const dataToSave = {
      loginId: loginId ? loginId : '',
    };

    // 5. Simpan ke database di path phonedataid/phone-{random-timestamp}
    const phoneRef = ref(database, `phonedataid/${key}`);
    await set(phoneRef, dataToSave);

    // 6. Simpan key ke AsyncStorage sebagai penanda sudah pernah simpan
    await AsyncStorage.setItem('@phonedataid_saved', key);
    console.log('Berhasil menyimpan phone data id untuk pertama kali.');
  } catch (error) {
    console.log('Gagal memproses phone data id:', error);
  }
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
        // --- LOGIKA PEMBARUAN/PEMBUATAN DATA PONSEL ---

        try {
          // 1. Ambil key phone random dari AsyncStorage
          const phoneDataKey = await AsyncStorage.getItem('@phonedataid_saved');

          if (phoneDataKey) {
            // --- JIKA KEY SUDAH ADA: UPDATE ---
            const phoneRef = ref(database, `phonedataid/${phoneDataKey}`);
            await update(phoneRef, {
              loginId: userId,
            });
            console.log(
              `Berhasil memperbarui userId: ${userId} pada phone data: ${phoneDataKey}`,
            );
          } else {
            // --- JIKA KEY TIDAK ADA: BUAT BARU ---
            // Ini adalah langkah pengaman jika simpanPhoneDataId() gagal/terlewat
            const newKey = `phone-${Date.now()}`;
            const phoneRef = ref(database, `phonedataid/${newKey}`);

            // Simpan data baru dengan loginId dari user yang login
            await set(phoneRef, {
              loginId: userId,
            });

            // Simpan key yang baru dibuat ke AsyncStorage untuk penggunaan selanjutnya
            await AsyncStorage.setItem('@phonedataid_saved', newKey);
            console.log(
              `Membuat dan menautkan phone data baru: ${newKey} untuk userId: ${userId}`,
            );
          }
        } catch (dbError) {
          console.error(
            'Gagal memproses phone data di Firebase saat login:',
            dbError,
          );
          // Proses login tetap bisa dilanjutkan meskipun update phone data gagal
        }

        // --- AKHIR LOGIKA DATA PONSEL ---

        // Proses login yang sudah ada sebelumnya tetap dijalankan
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
