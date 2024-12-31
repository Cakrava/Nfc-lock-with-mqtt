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
  const {DeviceList, realtimeMessages, deleteDevice} = useDeviceStatusContext(); // Access global state and actions
  const [tinggi, setTinggi] = useState(height * 0.8);

  const bottomSheetRef = useRef();
  const handleDelete = id => {
    Vibration.vibrate(100);
    Alert.alert(
      'Delete Confirmation',
      'Are you sure you want to delete this device?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          onPress: () => {
            deleteDevice(id)
              .then(
                () => Toast.show('Device successfully deleted!', Toast.LONG),
                (data = 'Device dengan id' + id + 'telah dihapus'),
                sendLog(data),
              )
              .catch(error => {
                console.error('Error deleting device:', error);
                (data = 'Gagal saat megngapus device'),
                  sendLog(data),
                  alert('Failed to delete device!');
              });
          },
        },
      ],
      {cancelable: true},
    );
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      onLongPress={() => handleDelete(item.id)}
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
            Mac: {item.id}
          </Text>
          <Text style={styleClass('text-sm text-gray-700 mt-1')}>
            Address : {item.topic}
          </Text>

          <View style={styleClass('items-end w-full')}>
            <View
              style={styleClass(
                `flex-row center w-1/5 mt-2 rounded-lg p-2  ${
                  realtimeMessages[item.topic + '-status'] == null
                    ? 'bg-red-500'
                    : 'bg-green-500'
                }`,
              )}
            >
              <Text
                style={styleClass(
                  'text-sm font-semibold text-center text-white',
                )}
              >
                {realtimeMessages[item.topic + '-status'] == null
                  ? 'Perangkat offline'
                  : realtimeMessages[item.topic + '-status']}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          data={DeviceList}
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
