import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {database} from '../../source/Config/firebase';
import {ref, update, onValue} from 'firebase/database';
import Toast from 'react-native-simple-toast';
import {styleClass} from '../Config/styleClass';
import {useGlobalStateContext} from '../Config/GlobalStateContext';

const windowWidth = Dimensions.get('window').width;

export default function EditUser({id, bottomSheetRef}) {
  const [name, setName] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const {setRefreshMyData} = useGlobalStateContext();
  const inputRef = useRef(null);

  const closeBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
    setRefreshMyData(true);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const anggotaRef = ref(database, 'Anggota/' + id);
    onValue(anggotaRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        setName(data.name);
        setNomorWhatsapp(data.nomorWhatsapp);
        setPassword(data.password);
        setImage(data.imageUrl || null);
      }
    });
  }, [id]);

  const handleChooseImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.assets && response.assets.length > 0) {
        setImage(response.assets[0].uri);
      }
    });
  };

  const handleUpdateData = async () => {
    if (name === '' || password === '') {
      alert('Nama dan Password harus diisi!');
      return;
    }

    let imageUrl = image;

    if (image && !image.startsWith('https://')) {
      try {
        setSaving(true);
        const storage = getStorage();
        const imageName = `images/${id}.jpg`;
        const storageReference = storageRef(storage, imageName);

        const response = await fetch(image);
        const blob = await response.blob();
        await uploadBytes(storageReference, blob);

        imageUrl = await getDownloadURL(storageReference);
      } catch (error) {
        console.error('Error uploading image:', error);
        setSaving(false);
        setSaveFailed(true);
        return;
      }
    }

    const anggotaRef = ref(database, 'Anggota/' + id);

    update(anggotaRef, {
      name: name,
      password: password,
      nomorWhatsapp: nomorWhatsapp,
      imageUrl: imageUrl,
    })
      .then(() => {
        Toast.show('Berhasil Memperbarui Data!', Toast.LONG);
        setRefreshMyData(false);
        setSaving(false);
        closeBottomSheet();
      })
      .catch(error => {
        console.error('Error updating data:', error);
        setSaving(false);
        setSaveFailed(true);
      });
  };

  return (
    <View style={styleClass('w-full h-full')}>
      <ScrollView contentContainerStyle={styleClass('items-center p-3')}>
        {/* ID */}
        <View
          style={{
            width: '100%',
            borderBottomWidth: 1,
            borderColor: '#dedede',
            paddingBottom: 10,
          }}
        >
          <Text style={styleClass('text-2xl text-teal-500')}>
            Perbarui Profile
          </Text>
        </View>
        <View style={styleClass('w-1/4 mt-3 mb-1 self-start')}>
          <Text>ID</Text>
        </View>
        <TextInput
          style={styleClass('w-full p-4 border rounded-lg text-md')}
          placeholder="ID"
          value={id}
          editable={false}
        />

        {/* Nama */}
        <View style={styleClass('w-1/4 mt-3 mb-1 self-start')}>
          <Text>Nama</Text>
        </View>
        <TextInput
          ref={inputRef}
          style={styleClass('w-full p-4 border rounded-lg text-md')}
          placeholder="e.g. John Smith"
          placeholderTextColor="#dedede"
          value={name}
          onChangeText={setName}
        />

        {/* Nomor WhatsApp */}
        <View style={styleClass('w-1/4 mt-3 mb-1 self-start')}>
          <Text>Nomor Whatsapp</Text>
        </View>
        <TextInput
          style={styleClass('w-full p-4 border rounded-lg text-md')}
          placeholder="e.g. 08xxxxxxxxxx"
          placeholderTextColor="#dedede"
          value={nomorWhatsapp}
          keyboardType="number-pad"
          onChangeText={setNomorWhatsapp}
        />

        {/* Password */}
        <View style={styleClass('w-1/4 mt-3 mb-1 self-start')}>
          <Text>Password</Text>
        </View>
        <View
          style={styleClass(
            'w-full p-2 border rounded-lg flex-row items-center justify-between mb-5',
          )}
        >
          <TextInput
            style={styleClass('text-md w-1/8')}
            placeholder="e.g. password"
            placeholderTextColor="#dedede"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#73BBA3"
            />
          </TouchableOpacity>
        </View>

        {/* Tombol Pilih Gambar */}
        <TouchableOpacity
          style={styleClass('w-full p-4 border rounded-lg center mt-3')}
          onPress={handleChooseImage}
        >
          <Text style={styleClass('text-md text-center text-gray-700')}>
            {image ? 'Ubah Gambar' : 'Pilih Gambar'}
          </Text>
        </TouchableOpacity>

        {/* Preview Gambar */}
        {image && (
          <View style={styleClass('w-full mt-3 mb-5')}>
            <Text style={styleClass('text-gray-600 text-sm mb-3')}>
              Preview Gambar:
            </Text>
            <FastImage
              source={{uri: image}}
              style={{
                width: windowWidth - 32,
                height: windowWidth - 32,
                borderRadius: 8,
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>
        )}

        {/* Tombol Simpan */}

        <TouchableOpacity
          style={styleClass(
            'bg-aquamarine-500 w-full rounded-lg center p-4 mt-4 mb-5',
          )}
          onPress={handleUpdateData}
        >
          <Text style={styleClass('text-white text-md font-semibold')}>
            {saving ? 'Menyimpan...' : 'Perbarui'}
          </Text>
        </TouchableOpacity>
        <View style={{height: 20}}></View>
      </ScrollView>

      <Modal
        transparent={true}
        visible={saveFailed || saving}
        animationType="fade"
      >
        <Pressable
          onPress={() => {
            setSaveFailed(false);
            setSaving(false);
          }}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={{
              borderWidth: 0.5,
              borderColor: '#dedede',
              borderRadius: 10,
              backgroundColor: 'white',
              padding: 20,
            }}
          >
            <FastImage
              source={
                saving
                  ? require('../Assets/icon/ic_loader.gif')
                  : saveFailed
                  ? require('../Assets/icon/ic_failed.gif')
                  : null
              }
              style={{
                width: 100,
                height: 100,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
