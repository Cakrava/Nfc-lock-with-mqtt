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
import RBSheet from 'react-native-raw-bottom-sheet'; // Impor RBSheet
import NewUser from '../../Components/NewUser';
import EditUser from '../../Components/EditUser';
import {styleClass} from '../../Config/styleClass';
import LottieView from 'lottie-react-native';
import {useGlobalStateContext} from '../../Config/GlobalStateContext';
import {sendLog} from '../../Config/firebaseHelper';

const {width, height} = Dimensions.get('window');

export default function Anggota() {
  const [anggotaList, setAnggotaList] = useState([]);
  const [rbContent, setRbContent] = useState('');
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const bottomSheetRef = useRef();
  const [lebar, setLebar] = useState(width * 0.8);
  const [tinggi, setTinggi] = useState(height * 0.8);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpti] = useState(true);
  const {loginId} = useGlobalStateContext();
  const handleTingkatkan = id => {
    const UpdateAnggota = ref(database, 'Anggota/' + id);
    const data = {role: 'Admin'};
    update(UpdateAnggota, data)
      .then(() =>
        Toast.show(
          'Berhasil Ditingkatkan',
          Toast.LONG,
          sendLog(`Admin berhasil menaikkan ${id} ke admin`),
        ),
      )

      .catch(error => {
        console.error('Error saving data:', error);
        alert('Gagal!');
      });
  };

  const handleTurunkan = id => {
    const UpdateAnggota = ref(database, 'Anggota/' + id);
    const data = {role: 'User'};
    update(UpdateAnggota, data)
      .then(() =>
        Toast.show(
          'Berhasil Diturunkan',
          Toast.LONG,
          sendLog(`Admin berhasil menurunkan ${id} ke user`),
        ),
      )
      .catch(error => {
        console.error('Error saving data:', error);
        alert('Gagal!');
      });
  };

  useEffect(() => {
    const anggotaRef = ref(database, 'Anggota');
    setLoading(true);
    const unsubscribe = onValue(
      anggotaRef,
      snapshot => {
        const data = snapshot.val();
        setAnggotaList(
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

  const handleDelete = id => {
    const anggotaRef = ref(database, `Anggota/${id}`);
    remove(anggotaRef)
      .then(() =>
        Toast.show(
          'Anggota berhasil dihapus',
          Toast.LONG,
          sendLog(`Admin berhasil menghapus ${id}`),
        ),
      )
      .catch(error => {
        console.error('Error deleting data:', error);
        alert('Gagal menghapus anggota!');
      });
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedId(item.id);
        setRbContent('EditUser');
        bottomSheetRef.current.open();
      }}
      disabled={item.id == loginId ? true : false}
      onLongPress={() => {
        Vibration.vibrate(100);
        Alert.alert(
          'Delete Confirmation',
          `Are you sure you want to delete ${item.name}?`,
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Delete', onPress: () => handleDelete(item.id)},
          ],
          {cancelable: true},
        );
      }}
      delayLongPress={300}
      style={[
        styleClass('shadow-md mb-4 rounded-lg'),
        {backgroundColor: '#e0f2f1', padding: 12},
      ]}
    >
      <View style={styleClass('flex-row items-center')}>
        <Image
          source={{uri: item.imageUrl}}
          style={[
            styleClass('w-60 h-60 rounded-full'),
            {borderWidth: 3, borderColor: '#14b8a6'},
          ]}
          resizeMode="cover"
        />
        <View style={styleClass('flex-1 ml-3')}>
          <Text style={styleClass('text-xl font-semibold text-gray-800')}>
            {item.name}
          </Text>
          <Text style={styleClass('text-sm text-teal-600')}>ID: {item.id}</Text>
          <Text style={styleClass('text-sm text-gray-700 mt-1')}>
            {item.nomorWhatsapp}
          </Text>
        </View>
        {item.id == loginId ? (
          <View style={styleClass('py-2 px-4 bg-teal-500 rounded-lg')}>
            <Text
              style={styleClass('text-md font-semibold text-white text-center')}
            >
              Saya
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() =>
              item.role === 'Admin'
                ? handleTurunkan(item.id)
                : handleTingkatkan(item.id)
            }
            style={[
              styleClass('p-3 rounded-full'),
              {backgroundColor: item.role === 'Admin' ? '#14b8a6' : 'orange'},
            ]}
          >
            <Icon
              name={item.role === 'Admin' ? 'arrow-up' : 'arrow-down'}
              size={28}
              color="white"
            />
          </TouchableOpacity>
        )}
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
          User
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
          data={anggotaList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          style={styleClass('p-2')}
        />
      </View>
      <RBSheet
        draggable={true}
        closeOnDrag={true}
        ref={bottomSheetRef}
        height={tinggi}
        customStyles={{
          container: {
            backgroundColor: '#fff',
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
          },
        }}
      >
        {rbContent === 'NewUser' ? (
          <NewUser bottomSheetRef={bottomSheetRef} />
        ) : (
          <EditUser id={selectedId} bottomSheetRef={bottomSheetRef} />
        )}
      </RBSheet>
      <TouchableOpacity
        onPress={() => {
          setRbContent('NewUser');
          bottomSheetRef.current.open();
        }}
        style={styleClass(
          'bg-teal-500 rounded-lg p-3 flex-row items-center absolute bottom-20 right-10 shadow-lg',
        )}
      >
        <Icon name="add" size={30} color="white" />
        <Text style={styleClass('text-white text-md font-semibold ml-2')}>
          Tambah User
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({});
