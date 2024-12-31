import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {database} from '../../source/Config/firebase'; // Firebase Realtime Database Config
import {ref, set} from 'firebase/database'; // Firebase Realtime Database
import {styleClass} from '../Config/styleClass';
import {sendLog} from '../Config/firebaseHelper';

// Fungsi untuk menghasilkan ID acak
const generateRandomID = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Fungsi untuk menghasilkan password acak
const generateRandomPassword = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
};

export default function NewUser({bottomSheetRef}) {
  const navigation = useNavigation();
  const [id, setId] = useState(generateRandomID());
  const [name, setName] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState(null); // URI Gambar
  const [saving, isSaving] = useState(false);

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword());
  };

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

  const closeBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  };

  return (
    <View style={styleClass('w-full h-full items-center')}>
      <TextInput
        style={styleClass('w-1/9 p-4 border rounded-lg mt-3 text-md')}
        placeholder="ID"
        value={id}
        editable={false}
      />
      <TextInput
        style={styleClass('w-1/9 p-4 border rounded-lg mt-3 text-md')}
        placeholder="Nama"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styleClass('w-1/9 p-4 border rounded-lg mt-3 text-md')}
        placeholder="Nomor Whatsapp"
        value={nomorWhatsapp}
        keyboardType="number-pad"
        onChangeText={setNomorWhatsapp}
      />
      <View
        style={styleClass(
          'w-1/9 p-2 border rounded-lg mt-3 flex-row items-center justify-between mb-5',
        )}
      >
        <TextInput
          style={styleClass('text-md w-1/8')}
          placeholder="Password"
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={handleShowPassword}>
          <Icon
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#73BBA3"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGeneratePassword}>
          <Icon name="refresh" size={20} color="#73BBA3" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styleClass('w-1/9 p-4 border rounded-lg mt-3 center')}
        onPress={handleChooseImage}
      >
        <Text style={styleClass('text-md text-center text-gray-700')}>
          {image ? 'Ubah Gambar' : 'Pilih Gambar'}
        </Text>
      </TouchableOpacity>

      {image && (
        <View style={styleClass('w-100 h-100 mt-3 mb-5')}>
          <Text style={styleClass('text-gray-600 text-sm mb-3')}>
            Preview Gambar:
          </Text>
          <Image
            source={{uri: image}}
            style={styleClass('w-full h-full rounded-lg ')}
          />
        </View>
      )}

      <TouchableOpacity
        style={styleClass('bg-aquamarine-500 w-1/9 rounded-lg center p-4 mt-4')}
        onPress={handleSaveData}
      >
        <Text style={styleClass('text-white text-md font-semibold')}>
          {saving ? 'Menyimpan..' : 'Simpan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({});
