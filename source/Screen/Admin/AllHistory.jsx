import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import {styleClass} from '../../Config/styleClass';
import {useGlobalStateContext} from '../../Config/GlobalStateContext';

const {height} = Dimensions.get('window');

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

export default function AllHistory({route}) {
  const {idData} = route.params;
  const navigation = useNavigation();
  const [sortedHistory, setSortedHistory] = useState([]);
  const {loginId, allHistory, allHistoryEmpty} = useGlobalStateContext();

  // Mengurutkan data berdasarkan timeStamp saat allHistory berubah
  useEffect(() => {
    if (allHistory) {
      const filtered = allHistory.filter(item => item.idDevice === idData); // Filter berdasarkan idDevice

      const sorted = filtered.sort((a, b) => {
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
  }, [allHistory, idData]);

  const renderItem = ({item}) => (
    <View
      style={styleClass(
        'bg-white rounded-lg p-3 mb-2  border-b-1 border-gray-300 mt-3',
      )}
    >
      <View style={styleClass('w-full ')}>
        <View style={styleClass(' flex-row w-full ')}>
          <Image
            source={{uri: item.image}}
            style={styleClass('w-70 h-70 rounded-full  bg-gray-300 mr-5')}
          />
          <View style={styleClass('w-full ')}>
            <Text style={styleClass('text-2xl font-semibold text-green-500')}>
              Akses pintu masuk!
            </Text>
            <Text style={styleClass('text-md font-semibold text-gray-500')}>
              Akses masuk ke{item.device}
            </Text>
            <Text style={[styleClass('text-orange-600'), {fontSize: 12}]}>
              Diakses oleh {item.user}
            </Text>

            <Text style={styleClass('text-sm text-gray-700 mt-1')}>
              {getRelativeTime(item.timeStamp)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
  return (
    <View style={[styleClass('rounded-lg w-full bg-white h-full')]}>
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
          Riwayat user
        </Text>
      </View>

      {allHistoryEmpty && (
        <View style={styleClass('w-full center')}>
          <LottieView
            source={require('../../Assets/Animation/empty_data.json')}
            autoPlay
            style={{width: height * 0.2, height: height * 0.2}}
          />
        </View>
      )}
      <FlatList
        scrollEnabled={false}
        data={sortedHistory}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 16}}
        style={{padding: 0}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    backgroundColor: 'white',
  },

  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
