import React, {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import WifiManager from 'react-native-wifi-reborn';
import {ref, get} from 'firebase/database';
import {useNavigation} from '@react-navigation/core';
import {database} from '../../Config/firebase';
import {styleClass} from '../../Config/styleClass';
import RBSheet from 'react-native-raw-bottom-sheet';
import LottieView from 'lottie-react-native';
import FastImage from 'react-native-fast-image';
import {useGlobalStateContext} from '../../Config/GlobalStateContext';

const {height, width} = Dimensions.get('window');

export default function ListWifi() {
  const nav = useNavigation();
  const [wifiList, setWifiList] = useState([]);
  const [wifiData, setWifiData] = useState([]); // Untuk menyimpan data dari Firebase
  const [isScanning, setIsScanning] = useState(false);
  const bottomSheetRef = useRef();
  const [selectedSSID, setSelectedSSID] = useState('');

  const [lebar, setLebar] = useState(width * 0.8);
  const [tinggi, setTinggi] = useState(height * 0.8);
  const {loginPassword} = useGlobalStateContext();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isForget, setIsForget] = useState(false);
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState('');
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Izin Lokasi Dibutuhkan',
            message: 'Aplikasi membutuhkan akses lokasi untuk memindai Wi-Fi.',
            buttonNeutral: 'Nanti',
            buttonNegative: 'Tolak',
            buttonPositive: 'Izinkan',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Izin lokasi diberikan.');
        } else {
          console.log('Izin lokasi ditolak.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const fetchDeviceData = async () => {
    try {
      const snapshot = await get(ref(database, 'Device'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const deviceList = Object.values(data).map(device => ({
          topic: device.topic,
          name: device.name,
        }));
        setWifiData(deviceList);
        console.log('Data perangkat dari Firebase:', deviceList);
      }
    } catch (error) {
      console.error('Gagal mengambil data dari Firebase:', error);
    }
  };

  const scanWifi = () => {
    console.log('Memulai pemindaian Wi-Fi...');
    setIsScanning(true);
    setWifiList([]);

    WifiManager.loadWifiList()
      .then(networks => {
        console.log('Hasil jaringan ditemukan:', networks);
        const filteredNetworks = networks
          .map(network => network.SSID)
          .filter(ssid => ssid && ssid.startsWith('Device'));
        console.log('SSID yang difilter:', filteredNetworks);
        setWifiList(filteredNetworks);
      })
      .catch(error => {
        console.error('Gagal memindai jaringan Wi-Fi:', error);
      })
      .finally(() => {
        setIsScanning(false);
        console.log('Proses pemindaian selesai.');
      });
  };

  useEffect(() => {
    const initialize = async () => {
      await requestLocationPermission();
      await fetchDeviceData();
      scanWifi();
    };
    initialize();
  }, []);

  const connectToWifiAndSendMessage = ssid => {
    WifiManager.connectToProtectedSSID(
      ssid,
      'SISTEMKEAMANANSEKOLAHAMAN',
      false,
      false,
    )
      .then(() => {
        console.log(`Terhubung ke ${ssid}`);
        setConnected(true);
        fetch('http://192.168.4.1/message', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({message: 'buka'}),
        })
          .then(() => {
            console.log('Pesan terkirim. Memutuskan koneksi...');
            setConnecting(false);
            setConnected(true);
            WifiManager.disconnect()

              .then(() => {
                console.log(`Koneksi dengan ${ssid} diputuskan.`);
              })
              .catch(err => {
                console.error(`Gagal memutus koneksi dari ${ssid}:`, err);
              });
          })
          .catch(err => {
            console.error('Gagal mengirim pesan:', err);
          });
      })
      .catch(err => {
        console.error('Gagal terhubung ke Wi-Fi:', err);
      });
  };

  const renderItem = ({item}) => {
    const matchedDevice = wifiData.find(device => device.topic === item);
    return (
      <TouchableOpacity
        style={[styles.listItem, styles.shadow]}
        onPress={() => {
          setSelectedSSID(item); // Simpan SSID yang dipilih
          bottomSheetRef.current.open(); // Buka bottom sheet
        }}
      >
        <View>
          {matchedDevice && (
            <Text style={styleClass('text-xl text-teal-500 font-bold')}>
              {matchedDevice.name}
            </Text>
          )}
          <Text style={styleClass('text-sm text-gray-600')}>{item}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  function handleConfirmation(ssid) {
    console.log(`ini adalah pw : ${loginPassword}`);
    if (password === loginPassword) {
      setConnecting(true);
      setConnected(false);
      connectToWifiAndSendMessage(ssid);
    } else {
      setResponse('Password tidak cocok');
    }
  }

  const resetState = () => {
    setSelectedSSID(''); // Reset SSID yang dipilih
    setPassword(''); // Hapus input password
    setResponse(''); // Hapus pesan error atau respon
    setConnecting(false); // Reset status connecting
    setConnected(false); // Reset status connected
    setIsForget(false); // Reset status isForget
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Icon name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Open Device</Text>
      </View>

      {isScanning ? (
        <View style={styles.centeredView}>
          <ActivityIndicator size="large" color="#14b8a6" />
          <Text style={styles.loadingText}>Mencari jaringan...</Text>
        </View>
      ) : (
        <FlatList
          data={wifiList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          style={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Tidak ada jaringan dengan SSID yang diawali "Device"
            </Text>
          }
        />
      )}

      <TouchableOpacity
        onPress={() => {
          scanWifi();
          //   bottomSheetRef.current.open();
        }}
        style={styleClass(
          'bg-teal-500 rounded-lg p-3 flex-row items-center absolute bottom-20 right-10 shadow-lg',
        )}
      >
        <Icon name="refresh-outline" size={30} color="white" />
        <Text style={styleClass('text-white text-md font-semibold ml-2')}>
          Pindai ulang
        </Text>
      </TouchableOpacity>
      <RBSheet
        draggable={true}
        closeOnDrag={true}
        ref={bottomSheetRef}
        closeOnPressBack={true}
        closeOnPressMask={true}
        height={tinggi}
        onClose={resetState}
        customStyles={{
          container: {
            backgroundColor: '#fff',
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
          },
        }}
      >
        <View style={styleClass('w-full center h-auto')}>
          {(connecting || connected) && (
            <FastImage
              source={
                connecting
                  ? require('../../Assets/icon/ic_loader.gif')
                  : connected
                  ? require('../../Assets/icon/ic_success.gif')
                  : null // Tidak perlu, karena hanya diakses saat connecting atau connected
              }
              style={styleClass('w-200 h-200 mt-5 mb-5')}
            />
          )}

          <TextInput
            value={selectedSSID}
            editable={false} // SSID hanya untuk tampilan, tidak bisa diubah
            style={styleClass(
              'w-1/9 border rounded-lg p-4 text-gray-500 mt-5 ',
            )}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Masukkan password anda"
            style={styleClass(
              'w-1/9 border rounded-lg p-4 text-gray-500 mt-5 ',
            )}
          />
          {response && (
            <Text style={styleClass('text-red-500 mt-2')}>{response}</Text>
          )}
          <TouchableOpacity
            disabled={password === ''} // Tombol tidak aktif jika password kosong
            onPress={() => handleConfirmation(selectedSSID)}
            style={styleClass(
              `w-1/9 border ${
                password ? 'bg-teal-500' : 'bg-gray-600'
              } rounded-lg center p-4 mt-5 `,
            )}
          >
            <Text style={styleClass('text-white text-xl font-semibold')}>
              {connecting
                ? 'menghubungkan'
                : connected
                ? 'Terhubung'
                : ' Buka pintu '}
            </Text>
          </TouchableOpacity>
        </View>
      </RBSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#14b8a6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 16,
  },
  listContainer: {
    padding: 16,
  },
  listItem: {
    backgroundColor: '#e0f2f1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  ssidText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#aaa',
  },
});
