import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import {styleClass} from '../../Config/styleClass';
import {useGlobalStateContext} from '../../Config/GlobalStateContext';

const {height} = Dimensions.get('window');

// Fungsi untuk menghitung waktu relatif (tidak ada perubahan)
const getRelativeTime = timeStamp => {
  const now = new Date();
  // Format tanggal: DD-MM-YYYY HH:mm:ss
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
  const {allHistory} = useGlobalStateContext();

  // State untuk menandakan apakah data kosong setelah difilter
  const [isHistoryEmpty, setIsHistoryEmpty] = useState(true);

  useEffect(() => {
    // PERBAIKAN 1: Cek apakah allHistory adalah objek dan tidak kosong
    if (
      allHistory &&
      typeof allHistory === 'object' &&
      Object.keys(allHistory).length > 0
    ) {
      // PERBAIKAN 2: Ubah objek allHistory menjadi array
      const historyArray = Object.values(allHistory);
      [1];

      // Filter array berdasarkan idDevice yang diterima dari route.params
      const filtered = historyArray.filter(item => item.idDevice === idData);

      // Cek apakah hasil filter kosong
      if (filtered.length === 0) {
        setIsHistoryEmpty(true);
        setSortedHistory([]); // Kosongkan state jika tidak ada data
        return;
      }

      setIsHistoryEmpty(false);

      // Urutkan array yang sudah difilter berdasarkan timeStamp
      const sorted = filtered.sort((a, b) => {
        const dateA = new Date(
          ...a.timeStamp
            .split(/[- :]/)
            .map((num, i) => (i === 1 ? Number(num) - 1 : Number(num))),
        );
        const dateB = new Date(
          ...b.timeStamp
            .split(/[- :]/)
            .map((num, i) => (i === 1 ? Number(num) - 1 : Number(num))),
        );
        return dateB - dateA; // Urutkan dari terbaru ke terlama
      });

      setSortedHistory(sorted);
    } else {
      // Jika allHistory kosong dari global state
      setIsHistoryEmpty(true);
      setSortedHistory([]);
    }
  }, [allHistory, idData]);

  const renderItem = ({item}) => (
    <View
      style={styleClass(
        'bg-white rounded-lg p-3 mb-2 border-b border-gray-200 mt-3 mx-4',
      )}
    >
      <View style={styleClass('flex-row w-full items-center')}>
        <Image
          source={{uri: item.image}}
          style={styleClass('w-16 h-16 rounded-full bg-gray-300 mr-4')}
        />
        <View style={styleClass('flex-1')}>
          <Text style={styleClass('text-lg font-bold text-teal-600')}>
            {item.pesan}
          </Text>
          <Text
            style={[
              styleClass('text-orange-600'),
              {fontSize: 12, fontWeight: '600'},
            ]}
          >
            {`Diakses oleh: ${item.user}`}
          </Text>
          <Text style={styleClass('text-sm text-gray-500 mt-1')}>
            {getRelativeTime(item.timeStamp)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Riwayat Akses</Text>
      </View>

      {/* Konten */}
      {isHistoryEmpty ? (
        <View style={styles.emptyContainer}>
          <LottieView
            source={require('../../Assets/Animation/empty_data.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.emptyText}>Belum Ada Riwayat Akses</Text>
        </View>
      ) : (
        <FlatList
          data={sortedHistory}
          // PERBAIKAN 3: Gunakan idHistory yang unik sebagai key
          keyExtractor={item => item.idHistory}
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom: 20}}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5', // Warna background netral
  },
  header: {
    backgroundColor: '#14b8a6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: height * 0.25,
    height: height * 0.25,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
});
