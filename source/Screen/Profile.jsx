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
    LoginUsername,
    loginName,
    loginRole,
    setStatusLogin,
    setLogin,
  } = useGlobalStateContext();
  const [selectedId, setSelectedId] = useState(loginId);
  const bottomSheetRef = useRef();
  const logoutSheetRef = useRef(); // Tambahkan referensi untuk bottom sheet logout
  const {width, height} = Dimensions.get('window');
  const [lebar, setLebar] = useState(width * 0.8);
  const [tinggi, setTinggi] = useState(height);
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
    logoutSheetRef.current.open(); // Buka bottom sheet logout
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
    <View style={{flex: 1, backgroundColor: '#F8F9FA', padding: 20}}>
      {/* Header Grid */}
      <View
        style={[
          styleClass('bg-aquamarine-500 shadow-md'),
          {
            flexDirection: 'row',
            marginBottom: 30,
            alignItems: 'center',
            padding: 15,
            borderRadius: 12,
            shadowColor: '#CED4DA',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.5,
            shadowRadius: 3,
            elevation: 3,
          },
        ]}
      >
        <Image
          source={{uri: loginImage}}
          style={{
            width: 80,
            height: 80,
            borderRadius: 10,
            backgroundColor: '#E9ECEF',
            marginRight: 20,
          }}
        />
        <View style={[{flex: 1}]}>
          <Text style={{fontSize: 26, fontWeight: '600', color: 'white'}}>
            {loginName}
          </Text>
          <Text style={{fontSize: 16, color: 'white'}}>{loginRole}</Text>
        </View>
      </View>

      {/* Grid Info */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        {/* Item Grid 1 */}
        <View
          style={[
            {
              width: '48%',
              backgroundColor: '#FFFFFF',
              padding: 15,
              borderRadius: 8,
              marginBottom: 15,
              shadowColor: '#DEE2E6',
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 0.7,
              shadowRadius: 2,
              elevation: 2,
            },
            styleClass('shadow-sm'),
          ]}
        >
          <Text style={{fontSize: 12, color: '#ADB5BD', marginBottom: 5}}>
            ID PENGGUNA
          </Text>
          <Text style={{fontSize: 16, color: '#495057', fontWeight: '500'}}>
            {loginId}
          </Text>
        </View>
        {/* Item Grid 2 */}
        <View
          style={[
            {
              width: '48%',
              backgroundColor: '#FFFFFF',
              padding: 15,
              borderRadius: 8,
              marginBottom: 15,
              shadowColor: '#DEE2E6',
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 0.7,
              shadowRadius: 2,
              elevation: 2,
            },
            styleClass('shadow-sm'),
          ]}
        >
          <Text style={{fontSize: 12, color: '#ADB5BD', marginBottom: 5}}>
            USERNAME
          </Text>
          <Text style={{fontSize: 16, color: '#495057', fontWeight: '500'}}>
            {LoginUsername}
          </Text>
        </View>
        {/* Item Grid 3 */}
        <View
          style={[
            {
              width: '100%',
              backgroundColor: '#FFFFFF',
              padding: 15,
              borderRadius: 8,
              marginBottom: 25,
              shadowColor: '#DEE2E6',
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 0.7,
              shadowRadius: 2,
              elevation: 2,
            },
            styleClass('shadow-sm'),
          ]}
        >
          <Text style={{fontSize: 12, color: '#ADB5BD', marginBottom: 5}}>
            WHATSAPP
          </Text>
          <Text style={{fontSize: 16, color: '#495057', fontWeight: '500'}}>
            {loginNumber}
          </Text>
        </View>
      </View>

      {/* Tombol Aksi */}
      <TouchableOpacity
        onPress={() => {
          bottomSheetRef.current.open();
        }}
        style={{
          backgroundColor: '#E9ECEF',
          paddingVertical: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{color: '#495057', fontSize: 16, fontWeight: '500'}}>
          Atur ulang profile
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: '#F1AEB5',
          paddingVertical: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{color: '#D94854', fontSize: 16, fontWeight: '500'}}>
          Keluar
        </Text>
      </TouchableOpacity>

      <RBSheet
        ref={bottomSheetRef}
        height={tinggi}
        draggable={true}
        customStyles={{
          wrapper: {backgroundColor: 'rgba(200, 200, 200, 0.4)'},
          draggableIcon: {backgroundColor: '#ADB5BD'},
          container: {
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            padding: 10,
            borderWidth: 1,
            borderColor: '#F1F3F5',
          },
        }}
      >
        <View style={{padding: 15, alignItems: 'center'}}></View>
        <EditUser id={selectedId} bottomSheetRef={bottomSheetRef} />
      </RBSheet>

      <RBSheet
        ref={logoutSheetRef}
        draggable={true}
        customStyles={{
          wrapper: {backgroundColor: 'rgba(200, 200, 200, 0.4)'},
          draggableIcon: {backgroundColor: '#ADB5BD'},
          container: {
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            padding: 10,
            borderWidth: 1,
            borderColor: '#F1F3F5',
          },
        }}
      >
        <View style={{padding: 15, alignItems: 'center'}}>
          <Text style={{fontSize: 18, fontWeight: 'bold', color: '#495057'}}>
            Konfirmasi Logout
          </Text>
          <Text style={{fontSize: 14, color: '#495057', marginTop: 10}}>
            Apakah Anda yakin ingin logout?
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => logoutSheetRef.current.close()}
              style={{
                backgroundColor: '#E9ECEF',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                alignItems: 'center',
                margin: 5,
              }}
            >
              <Text style={{color: '#495057', fontSize: 16, fontWeight: '500'}}>
                Batal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                try {
                  console.log('berhasil logout');
                  setStatusLogin(false);
                  setLogin(null);
                  await AsyncStorage.clear();
                  logoutSheetRef.current.close();
                } catch {
                  console.log('gagal menghapus sesi');
                }
              }}
              style={{
                margin: 5,
                backgroundColor: '#F1AEB5',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{color: '#D94854', fontSize: 16, fontWeight: '500'}}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </RBSheet>
    </View>
  );
}

const styles = StyleSheet.create({});
