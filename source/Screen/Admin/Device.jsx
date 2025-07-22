import React, {useRef, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {styleClass} from '../../Config/styleClass';
import Toast from 'react-native-simple-toast';
import {useDeviceStatusContext} from '../../Config/DeviceListContext'; // Pastikan path ini benar
import NewDevice from '../../Components/NewDevice';
import {sendLog} from '../../Config/firebaseHelper';

const {height} = Dimensions.get('window');

export default function Device() {
  const navigation = useNavigation();
  // Ambil `deviceList` dan `deleteDevice`. `realtimeMessages` sudah tidak ada.
  const {deviceList, deleteDevice} = useDeviceStatusContext();
  const [tinggi, setTinggi] = useState(height * 0.8);
  const bottomSheetRef = useRef();

  const handleDelete = (id, name) => {
    Vibration.vibrate(100);
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus perangkat "${name}"?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          onPress: () => {
            deleteDevice(id)
              .then(() => {
                Toast.show('Perangkat berhasil dihapus!', Toast.LONG);
                sendLog(`Pengguna menghapus perangkat ${name} (ID: ${id})`);
              })
              .catch(error => {
                console.error('Gagal saat menghapus perangkat:', error);
                sendLog(`Gagal menghapus perangkat ${name}`);
                alert('Gagal menghapus perangkat!');
              });
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  const renderItem = ({item}) => {
    // Tentukan status dan warna berdasarkan properti `item.status` yang baru.
    const isOnline = item.status === 'online';
    const statusText = isOnline ? 'Online' : 'Offline';
    const statusBgColor = isOnline ? 'bg-green-500' : 'bg-red-500';
    const statusPayloadText = isOnline
      ? 'Device is active'
      : 'Device is offline';

    return (
      <TouchableOpacity
        onLongPress={() => handleDelete(item.id, item.name)}
        delayLongPress={300}
        style={[
          styleClass('shadow-md mb-4 rounded-lg'),
          {backgroundColor: '#e0f2f1', padding: 12},
        ]}
      >
        <View style={styleClass('flex-row items-center')}>
          <View style={styleClass('flex-1 ml-3')}>
            <Text style={styleClass('text-2xl font-semibold text-gray-800')}>
              {item.name}
            </Text>
            <Text style={styleClass('text-sm text-teal-600')}>
              ID: {item.id}
            </Text>
            <Text style={styleClass('text-sm text-gray-700 mt-1')}>
              Topik: {item.topic}
            </Text>

            <View style={styleClass('items-end w-full')}>
              {/* Logika tampilan status sekarang jauh lebih sederhana */}
              <View
                style={styleClass(
                  `flex-row center w-1/4 mt-2 rounded-lg p-2 ${statusBgColor}`,
                )}
              >
                <Text
                  style={styleClass(
                    'text-sm font-semibold text-center text-white',
                  )}
                >
                  {statusText}
                </Text>
              </View>
              {/* Anda bisa menampilkan payload teks jika mau, atau hapus baris ini */}
              <Text style={styleClass('text-xs text-gray-500 mt-1')}>
                {statusPayloadText}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styleClass('w-full h-full bg-white')}>
      <View
        style={[
          styleClass('w-full flex-row items-center mb-4 px-4 py-2'),
          {backgroundColor: '#14b8a6'},
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styleClass('text-white text-2xl font-bold ml-4')}>
          Perangkat
        </Text>
      </View>
      <View style={styleClass('p-3')}>
        <FlatList
          data={deviceList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          style={styleClass('p-2')}
        />
      </View>

      <RBSheet
        ref={bottomSheetRef}
        height={tinggi}
        closeOnPressBack={true}
        closeOnPressMask={true}
        draggable={true}
        customStyles={{
          container: {
            backgroundColor: '#fff',
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
          },
        }}
      >
        <NewDevice bottomSheetRef={bottomSheetRef} />
      </RBSheet>

      <TouchableOpacity
        onPress={() => {
          bottomSheetRef.current.open();
        }}
        style={styleClass(
          'bg-teal-500 rounded-lg p-3 flex-row items-center absolute bottom-20 right-10 shadow-lg',
        )}
      >
        <Icon name="add" size={30} color="white" />
        <Text style={styleClass('text-white text-md font-semibold ml-2')}>
          Tambah Perangkat
        </Text>
      </TouchableOpacity>
    </View>
  );
}
