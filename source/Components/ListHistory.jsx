import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import {styleClass} from '../Config/styleClass';
import {useGlobalStateContext} from '../Config/GlobalStateContext';

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

  const renderItem = ({item}) => (
    <View
      style={[
        {
          backgroundColor: 'white',
          borderBottomWidth: 1,
          padding: 8,
          borderColor: '#dedede',
          marginTop: 10,
        },
      ]}
    >
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
    <View style={[styles.container, styleClass('rounded-lg shadow-sm p-3')]}>
      <Text style={styleClass('text-md')}>Riwayat saya</Text>
      <View style={styleClass('w-full h-2 bg-gray-300 mt-2')} />
      {myHistoryEmpty && (
        <View style={styleClass('w-full center')}>
          <LottieView
            source={require('../Assets/Animation/empty_data.json')}
            autoPlay
            style={{width: height * 0.2, height: height * 0.2}}
          />
        </View>
      )}
      <FlatList
        scrollEnabled={false}
        data={sortedHistory.slice(0, 5)}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 16}}
        style={{padding: 0}}
      />
      <TouchableOpacity
        onPress={() => navigation.navigate('History')}
        style={styleClass('center flex-row w-full h-50')}
      >
        <Text style={styleClass('text-sm text-gray-600 text-center mr-2')}>
          Selengkapnya
        </Text>
        <Icon name="chevron-forward-outline" size={20} color={'gray'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
    backgroundColor: 'white',
  },

  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});