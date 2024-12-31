import React, {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Vibration,
  Modal,
} from 'react-native';
import {database} from '../../Config/firebase';
import {ref, onValue, update, remove} from 'firebase/database';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import RBSheet from 'react-native-raw-bottom-sheet';
import {styleClass} from '../../Config/styleClass';
import LottieView from 'lottie-react-native';
import {useGlobalStateContext} from '../../Config/GlobalStateContext';

const {width, height} = Dimensions.get('window');

export default function Log() {
  const [anggotaList, setLogList] = useState([]);
  const [sortedList, setSortedHistory] = useState([]);
  const [rbContent, setRbContent] = useState('');
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const bottomSheetRef = useRef();
  const [lebar, setLebar] = useState(width * 0.8);
  const [tinggi, setTinggi] = useState(height * 0.8);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpti] = useState(true);
  const {loginId} = useGlobalStateContext();

  useEffect(() => {
    const logRef = ref(database, 'validatorHelper/logs');
    setLoading(true);
    const unsubscribe = onValue(
      logRef,
      snapshot => {
        const data = snapshot.val();
        setLogList(
          data ? Object.keys(data).map(key => ({id: key, ...data[key]})) : [],
        );
        setLoading(false);
        if (data) {
          setIsEmpti(false);
        } else {
          setIsEmpti(true);
        }
      },

      error => {
        console.error('Error:', error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (anggotaList) {
      const sorted = [...anggotaList].sort((a, b) => {
        const dateA = new Date(
          ...a.timeStamp
            .split(/[- :]/)
            .map((num, i) => (i === 1 ? num - 1 : Number(num))),
        );
        const dateB = new Date(
          ...b.timeStamp
            .split(/[- :]/)
            .map((num, i) => (i === 1 ? num - 1 : Number(num))),
        );
        return dateB - dateA; // Urutkan dari terbaru ke terlama
      });
      setSortedHistory(sorted);
    }
  }, [anggotaList]);

  const handleClearHistory = () => {
    Alert.alert(
      'Konfirmasi', // Judul Alert
      'Apakah Anda yakin ingin membersihkan riwayat ini?', // Pesan
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Bersihkan',
          onPress: () => {
            const logRef = ref(database, `validatorHelper/logs`);
            remove(logRef)
              .then(() => Toast.show('Log berhasil dibersihkan', Toast.LONG))
              .catch(error => {
                console.error('Error deleting data:', error);
                alert('Gagal membersihkan Log!');
              });
          },
          style: 'destructive', // Menandai tombol bersihkan sebagai aksi penting
        },
      ],
      {cancelable: true}, // Alert bisa ditutup dengan menekan di luar
    );
  };
  const renderItem = ({item}) => (
    <View
      style={[
        styleClass('shadow-md mb-4 rounded-lg'),
        {backgroundColor: '#e0f2f1', padding: 12},
      ]}
    >
      <View style={styleClass('flex-row items-center')}>
        <View style={styleClass('flex-1 ml-3')}>
          <Text style={styleClass('text-xl font-semibold text-gray-800')}>
            {item.logs}
          </Text>
          <Text style={styleClass('text-sm text-gray-700 mt-1')}>
            {item.timeStamp}
          </Text>
        </View>
      </View>
    </View>
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
          Log Sistem
        </Text>
      </View>
      {loading && (
        <View
          style={styleClass(
            'absolute top-0 left-0 right-0 bottom-0 justify-center items-center',
          )}
        >
          <LottieView
            source={require('../../Assets/Animation/load_data.json')}
            autoPlay
            style={{width: lebar, height: lebar}}
          />
        </View>
      )}
      {isEmpty && (
        <View
          style={styleClass(
            'absolute top-0 left-0 right-0 bottom-0 justify-center items-center',
          )}
        >
          <LottieView
            source={require('../../Assets/Animation/empty_data.json')}
            autoPlay
            style={{width: lebar, height: lebar}}
          />
        </View>
      )}
      <View style={styleClass('p-3')}>
        <FlatList
          data={sortedList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          style={styleClass('p-2')}
        />
      </View>

      <TouchableOpacity
        onPress={handleClearHistory}
        style={styleClass(
          'bg-red-500 rounded-lg p-3 flex-row items-center absolute bottom-20 right-10 shadow-lg',
        )}
      >
        <Icon name="trash-outline" size={30} color="white" />
        <Text style={styleClass('text-white text-md font-semibold ml-2')}>
          Bersihkan
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({});
