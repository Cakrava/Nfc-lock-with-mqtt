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
import {useDeviceStatusContext} from '../../Config/DeviceListContext';
import NewDevice from '../../Components/NewDevice';
import {sendLog} from '../../Config/firebaseHelper';

const {height} = Dimensions.get('window');

export default function Device() {
  const navigation = useNavigation();
  const {deviceList, deleteDevice, forceCloseDoor} = useDeviceStatusContext();
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

  // Fungsi handler baru untuk menutup pintu secara paksa
  const handleForceClose = (topic, name) => {
    Alert.alert(
      'Konfirmasi Tutup Paksa',
      `Apakah Anda yakin ingin menutup pintu "${name}"?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Ya, Tutup',
          onPress: () => {
            forceCloseDoor(topic, name)
              .then(() => {
                Toast.show(`Pintu "${name}" berhasil ditutup.`, Toast.LONG);
              })
              .catch(error => {
                Toast.show(`Gagal menutup pintu: ${error.message}`, Toast.LONG);
              });
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  const renderItem = ({item}) => {
    const isOnline = item.status === 'online';
    const statusText = isOnline ? 'Online' : 'Offline';
    const statusBgColor = isOnline ? 'bg-green-500' : 'bg-red-500';
    const statusPayloadText = isOnline
      ? 'Device is active'
      : 'Device is offline';
    const lockStateText =
      item.lockState.charAt(0).toUpperCase() + item.lockState.slice(1);
    const lockStateIcon =
      item.lockState === 'terbuka'
        ? 'lock-open-outline'
        : 'lock-closed-outline';
    const lockStateColor =
      item.lockState === 'terbuka' ? 'text-green-600' : 'text-red-600';
    const lockStateIconColor =
      item.lockState === 'terbuka' ? '#22c55e' : '#ef4444';

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

            {item.lockState !== 'tidak diketahui' && (
              <View style={styleClass('mt-3')}>
                <View
                  style={styleClass('flex-row items-center justify-between')}
                >
                  {/* Bagian Kiri: Status Pintu */}
                  <View style={styleClass('flex-row items-center')}>
                    <Icon
                      name={lockStateIcon}
                      size={22}
                      color={lockStateIconColor}
                    />
                    <Text
                      style={styleClass(
                        `text-lg font-bold ml-2 ${lockStateColor}`,
                      )}
                    >
                      {lockStateText}
                    </Text>
                  </View>

                  {/* Tombol ikon tutup paksa tampil jika pintu terbuka */}
                  {item.lockState === 'terbuka' && (
                    <TouchableOpacity
                      onPress={() => handleForceClose(item.topic, item.name)}
                      style={styleClass('p-2')}
                    >
                      <Icon
                        name="close-circle-outline"
                        size={30}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tampilkan baris "Oleh" HANYA JIKA `item.actedBy` memiliki nilai */}
                {item.actedBy && (
                  <Text style={styleClass('text-sm text-gray-600 ml-8')}>
                    Oleh: {item.actedBy}
                  </Text>
                )}
              </View>
            )}

            <View style={styleClass('items-end w-full')}>
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
          ListEmptyComponent={
            <View style={styleClass('items-center justify-center mt-20')}>
              <Text style={styleClass('text-lg text-gray-500')}>
                Tidak ada perangkat ditemukan.
              </Text>
            </View>
          }
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
