import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  View,
} from 'react-native';
import {sendLog} from '../Config/firebaseHelper';
import React, {useRef, useState} from 'react';
import {styleClass} from '../Config/styleClass';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons
import {useGlobalStateContext} from '../Config/GlobalStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/core';
import RBSheet from 'react-native-raw-bottom-sheet';
import EditUser from '../Components/EditUser';
export default function Profile() {
  const {
    loginImage,
    loginId,
    loginNumber,
    loginName,
    loginRole,
    setStatusLogin,
    setLogin,
  } = useGlobalStateContext();
  const [selectedId, setSelectedId] = useState(loginId);
  const bottomSheetRef = useRef();
  const {width, height} = Dimensions.get('window');
  const [lebar, setLebar] = useState(width * 0.8);
  const [tinggi, setTinggi] = useState(height * 0.8);
  const [id, setId] = useState('');

  const [name, setName] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState(null); // URI Gambar
  const [saving, isSaving] = useState(false);
  const navigation = useNavigation();

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleChooseImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.assets && response.assets.length > 0) {
        setImage(response.assets[0].uri); // Simpan URI gambar
      }
    });
  };
  async function handleLogout() {
    try {
      console.log('berhasil logout');
      setStatusLogin(false);
      setLogin(null);
      await AsyncStorage.clear();
    } catch {
      console.log('gagal menghapus sesi');
    }
  }
  const closeBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  };

  const handleSaveData = async () => {
    if (name === '' || password === '') {
      alert('Nama dan Password harus diisi!');
      return;
    }

    let imageUrl = null;

    if (image) {
      try {
        isSaving(true);
        const storage = getStorage();
        const imageName = `images/${id}.jpg`;
        const storageReference = storageRef(storage, imageName);

        // Upload file ke Firebase Storage
        const response = await fetch(image);
        const blob = await response.blob();
        await uploadBytes(storageReference, blob);

        // Dapatkan URL gambar
        imageUrl = await getDownloadURL(storageReference);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Gagal mengunggah gambar!');
        isSaving(false);
        return;
      }
    }

    const anggotaRef = ref(database, 'Anggota/' + id);

    set(anggotaRef, {
      id: id,
      name: name,
      password: password,
      nomorWhatsapp: nomorWhatsapp,
      role: 'User',
      imageUrl: imageUrl, // URL gambar
    })
      .then(() => {
        Toast.show('Berhasil Menambah Data!', Toast.LONG);
        isSaving(false);
        closeBottomSheet();
        sendLog(`Admin baru saja menambahkan ${name}`);
      })
      .catch(error => {
        console.error('Error saving data:', error);
        isSaving(false);
        alert('Gagal menyimpan data!');
      });
  };

  return (
    <View style={styleClass('w-full h-full bg-white   items-center')}>
      <View
        style={[
          styleClass('w-full h-auto  flex-row mb-5 p-4 bg-aquamarine-500'),
          {borderBottomLeftRadius: 15, borderBottomRightRadius: 15},
        ]}
      >
        <Image
          source={{uri: loginImage}}
          style={[styleClass('w-80 h-80 bg-gray-200   rounded-full border')]}
        />
        <View style={styleClass('ml-5')}>
          <Text style={styleClass('text-white font-semibold text-2xl')}>
            {loginName}
          </Text>
          <Text style={styleClass('text-white text-sm')}>{loginId}</Text>
          <View
            style={styleClass('p-1 px-2 bg-orange-500 rounded-sm mt-5 center')}
          >
            <Text style={styleClass('text-white font-semibold text-sm')}>
              {loginId}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => {
          bottomSheetRef.current.open();
        }}
        style={styleClass(
          'w-1/9 px-3 mt-5 border-gray-300  items-center flex-row border-b-1',
        )}
      >
        <Icon
          name="create-outline"
          size={30}
          color={'gray'}
          style={styleClass('mb-4')}
        />
        <Text style={styleClass(' mb-4 text-xl ml-3')}>Atur ulang profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleLogout}
        style={styleClass(
          'w-1/9 px-3 mt-5 border-gray-300  items-center flex-row border-b-1',
        )}
      >
        <Icon
          name="log-out-outline"
          size={30}
          color={'red'}
          style={styleClass('mb-4')}
        />
        <Text style={styleClass(' mb-4 text-red-500 text-xl ml-3')}>
          Keluar
        </Text>
      </TouchableOpacity>

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
        <View style={styleClass('w-full p-3')}>
          <Text style={styleClass('text-3xl font-semibold text-teal-500')}>
            Atur ulang profile
          </Text>
        </View>
        <EditUser id={selectedId} bottomSheetRef={bottomSheetRef} />
      </RBSheet>
    </View>
  );
}

const styles = StyleSheet.create({});
