import React, {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  Modal,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  TextInput,
  Pressable,
  Image,
  Alert,
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

export default function WifiConfiguration() {
  const nav = useNavigation();
  const [wifiList, setWifiList] = useState([]);
  const [wifiData, setWifiData] = useState([]); // Untuk menyimpan data dari Firebase
  const [isScanning, setIsScanning] = useState(false);
  const bottomSheetRef = useRef();
  const [selectedSSID, setSelectedSSID] = useState('');
  const [wifiEnabled, setWifiEnabled] = useState(true); // default true biar gak ganggu

  const {loginPassword} = useGlobalStateContext();
  const [connecting, setConnecting] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isForget, setIsForget] = useState(false);
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState('');
  const {checkingInternet, setChekingInternet} = useGlobalStateContext();
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

  function closeBottomSheet() {
    bottomSheetRef.current.close();
  }

  const scanWifi = () => {
    if (isScanning) {
      console.log('Pemindaian masih berlangsung, abaikan request baru.');
      return;
    }

    setIsScanning(true);
    setWifiList([]);

    WifiManager.isEnabled()
      .then(isEnabled => {
        if (!isEnabled) {
          setIsScanning(false);
          Alert.alert('Wi-Fi Mati', 'Nyalakan Wi-Fi dulu sebelum memindai.', [
            {text: 'OK'},
          ]);
          return;
        }

        WifiManager.reScanAndLoadWifiList()
          .then(networks => {
            if (!Array.isArray(networks)) {
              console.warn('Hasil scan bukan array:', networks);
              setWifiList([]);
              setIsScanning(false);
              return;
            }

            const filteredNetworks = networks.filter(
              network => network.SSID && network.SSID.startsWith('Device'),
            );

            console.log('Hasil jaringan Device:', filteredNetworks);
            setWifiList(filteredNetworks);
            setIsScanning(false);
          })
          .catch(error => {
            console.error(
              'Gagal memindai jaringan Wi-Fi:',
              error.message,
              error,
            );
            setIsScanning(false);
          });
      })
      .catch(error => {
        console.error('Gagal mengecek status Wi-Fi:', error.message, error);
        setIsScanning(false);
      });
  };
  useEffect(() => {
    const initialize = async () => {
      await requestLocationPermission();
      await fetchDeviceData();

      WifiManager.isEnabled()
        .then(isEnabled => {
          if (!isEnabled) {
            Alert.alert('Wi-Fi Mati', 'Nyalakan Wi-Fi dulu sebelum lanjut.', [
              {text: 'OK'},
            ]);
            return;
          } else {
            scanWifi();
          }
        })
        .catch(error => {
          console.error('Gagal mengecek status Wi-Fi:', error.message, error);
        });
    };

    initialize();
  }, []);

  const connectToWifiAndSendMessage = ssid => {
    setChekingInternet(false);
    WifiManager.connectToProtectedSSID(
      ssid,
      'SISTEMKEAMANANSEKOLAHAMAN',
      false,
      false,
    )
      .then(() => {
        console.log(`Terhubung ke ${ssid}`);
        setConnected(true);
        setConnecting(false);

        setIsFailed(false);
        nav.navigate('WebViewConfigure'); // Navigasi ke WebView setelah koneksi sukses
      })
      .catch(err => {
        setIsFailed(true);
        setConnecting(false);
        setConnected(false);
        console.warn('Gagal terhubung ke Wi-Fi:', err);
      });
  };

  const renderItem = ({item}) => {
    const matchedDevice = wifiData.find(device => device.topic === item.SSID);
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedSSID(item.SSID); // simpan SSID sebagai string
          bottomSheetRef.current.open();
        }}
        style={styleClass('bg-white rounded-xl p-4 shadow-sm mb-3')}
      >
        <Text style={styleClass('text-base font-semibold text-gray-800')}>
          {matchedDevice ? matchedDevice.name : item.SSID}
        </Text>
        <View style={styleClass('flex-row justify-between mt-2')}>
          <View>
            <Text style={styleClass('text-xs text-gray-600')}>BSSID</Text>
            <Text style={styleClass('text-sm text-gray-800')}>
              {item.BSSID}
            </Text>
          </View>
          <View>
            <Text style={styleClass('text-xs text-gray-600')}>Signal</Text>
            <Text style={styleClass('text-sm text-gray-800')}>
              {item.level} dBm
            </Text>
          </View>
          <View>
            <Text style={styleClass('text-xs text-gray-600')}>Freq</Text>
            <Text style={styleClass('text-sm text-gray-800')}>
              {item.frequency} MHz
            </Text>
          </View>
        </View>
        <Text style={styleClass('text-xs text-gray-500 mt-2')}>
          {item.capabilities}
        </Text>
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
        <Text style={styles.headerTitle}>Configure Device</Text>
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

      <Modal
        transparent={true}
        visible={connecting || isFailed}
        animationType="fade"
        onDismiss={() => {
          setConnecting(false);
          setIsFailed(false);
        }}
      >
        <Pressable
          onPress={() => {
            setConnecting(false);
            setIsFailed(false);
          }}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          {/* Stop event propagation to prevent modal from closing when pressing the content */}
          <Pressable
            onPress={e => e.stopPropagation()}
            style={{
              borderWidth: 0.5,
              borderColor: '#dedede',
              borderRadius: 10,
              backgroundColor: 'white',
              padding: 20,
            }}
          >
            <FastImage
              source={
                connecting
                  ? require('../../Assets/icon/ic_loader.gif')
                  : isFailed
                  ? require('../../Assets/icon/ic_failed.gif')
                  : null
              }
              style={{
                width: 100,
                height: 100,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* RBSheet tetap di bawah */}
      <RBSheet
        draggable={true}
        closeOnDrag={true}
        ref={bottomSheetRef}
        closeOnPressBack={true}
        closeOnPressMask={true}
        onClose={resetState}
        customStyles={{
          container: {
            backgroundColor: '#fff',
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            paddingBottom: 20,
          },
        }}
      >
        <View style={styleClass('w-full center h-auto')}>
          <TextInput
            value={selectedSSID}
            editable={false}
            style={styleClass('w-1/9 border rounded-lg p-4 text-gray-500 mt-5')}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Masukkan password anda"
            style={styleClass('w-1/9 border rounded-lg p-4 text-gray-500 mt-5')}
          />
          {response && (
            <Text style={styleClass('text-red-500 mt-2')}>{response}</Text>
          )}
          <TouchableOpacity
            disabled={password === ''}
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
                : ' Buka Konfigurasi '}
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
