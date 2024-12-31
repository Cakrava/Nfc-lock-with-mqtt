import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';

import {ref, onValue, update, remove} from 'firebase/database';

import Toast from 'react-native-simple-toast';
import {database} from '../../Config/firebase';
import {styleClass} from '../../Config/styleClass';
import {useGlobalStateContext} from '../../Config/GlobalStateContext';

const {height, width} = Dimensions.get('window');

// Fungsi untuk menghitung waktu relatif
const getRelativeTime = timeStamp => {
  const now = new Date();
  const [day, month, year, hours, minutes, seconds] = timeStamp
    .split(/[- :]/)
    .map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  const diff = Math.floor((now - date) / 1000); // Selisih dalam detik

  if (diff < 60) return `${diff} detik yang lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari yang lalu`;

  return `${day}-${month}-${year}`;
};

export default function History() {
  const navigation = useNavigation();
  const [sortedHistory, setSortedHistory] = useState([]);
  const {loginId, myHistory, myHistoryEmpty} = useGlobalStateContext();

  // Mengurutkan data berdasarkan timeStamp saat myHistory berubah
  useEffect(() => {
    if (myHistory) {
      const sorted = [...myHistory].sort((a, b) => {
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
  }, [myHistory]);

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
            const historyRef = ref(database, `History/${loginId}`);
            remove(historyRef)
              .then(() =>
                Toast.show('History berhasil dibersihkan', Toast.LONG),
              )
              .catch(error => {
                console.error('Error deleting data:', error);
                alert('Gagal membersihkan history!');
              });
          },
          style: 'destructive', // Menandai tombol bersihkan sebagai aksi penting
        },
      ],
      {cancelable: true}, // Alert bisa ditutup dengan menekan di luar
    );
  };

  const renderItem = ({item}) => (
    <View style={styleClass('bg-white rounded-lg p-3 mb-2 shadow-sm')}>
      <View style={styles.itemContent}>
        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styleClass('text-md font-semibold text-green-500')}>
            {item.pesan}
          </Text>
          <Text style={[styleClass('text-orange-600'), {fontSize: 12}]}>
            {item.idHistory}
          </Text>
          <View style={styleClass('w-full h-auto items-end')}>
            <Text style={styleClass('text-sm text-gray-700 mt-1')}>
              {getRelativeTime(item.timeStamp)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styleClass('rounded-lg w-full h-full')]}>
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
          History Saya
        </Text>
      </View>

      {myHistoryEmpty && (
        <View style={styleClass('w-full h-full center')}>
          <LottieView
            source={require('../../Assets/Animation/empty_data.json')}
            autoPlay
            style={{width: width * 0.8, height: width * 0.8}}
          />
        </View>
      )}
      <FlatList
        data={sortedHistory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 16}}
        style={{padding: 10, marginTop: -10}}
      />

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

const styles = StyleSheet.create({
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
