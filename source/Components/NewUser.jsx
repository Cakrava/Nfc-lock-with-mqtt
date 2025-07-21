import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  Dimensions,
  ScrollView,
  View,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import {launchImageLibrary} from 'react-native-image-picker';
import {database} from '../../source/Config/firebase'; // Firebase Realtime Database Config
import {ref, set} from 'firebase/database'; // Firebase Realtime Database
import {styleClass} from '../Config/styleClass';
import {sendLog} from '../Config/firebaseHelper';
import {apiUrl} from '../../source/Config/firebase';
const windowWidth = Dimensions.get('window').width;
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState(null); // URI Gambar
  const [saving, isSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setUsername(name.toLowerCase().replace(/\s/g, ''));
  }, [name]);

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
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        setImage(response.assets[0].uri); // Simpan URI gambar
      }
    });
  };

  const handleSaveData = async () => {
    if (name === '' || password === '') {
      alert('Nama dan Password harus diisi!');
      return;
    }

    isSaving(true);
    let imageUrl = null;

    // Jika ada gambar yang dipilih, unggah terlebih dahulu
    if (image) {
      try {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: `${id}.jpg`,
        });

        console.log(`mencoba link ${apiUrl}`);
        const response = await fetch(`${apiUrl}upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          // Jika unggah berhasil, gunakan URL dari endpoint baru
          imageUrl = `${apiUrl}images/${id}`;
        } else {
          // Jika unggah gagal
          const errorResponse = await response.text();
          console.warn('Image upload failed:', errorResponse);
          alert('Gagal mengunggah gambar!');
          isSaving(false);
          setSaveFailed(true);
          return;
        }
      } catch (error) {
        console.warn('Error uploading image:', error);
        alert('Gagal mengunggah gambar!');
        isSaving(false);
        setSaveFailed(true);
        return;
      }
    }

    // Lanjutkan menyimpan data ke Firebase Realtime Database
    const anggotaRef = ref(database, 'Anggota/' + id);

    set(anggotaRef, {
      id: id,
      name: name,
      password: password,
      nomorWhatsapp: nomorWhatsapp,
      username: username,
      role: 'User',
      imageUrl: imageUrl, // URL gambar dari endpoint baru atau null
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
        setSaveFailed(true);
        alert('Gagal menyimpan data!');
      });
  };

  const closeBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
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
          <Text style={styleClass('text-2xl text-teal-500')}>Tambah User</Text>
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
          style={styleClass('w-full p-4 border rounded-lg text-md')}
          placeholder="e.g. John Smith"
          placeholderTextColor="#dedede"
          value={name}
          onChangeText={setName}
        />

        {/* Username */}
        <View style={styleClass('w-1/4 mt-3 mb-1 self-start')}>
          <Text>Username</Text>
        </View>
        <TextInput
          style={styleClass(
            'w-full p-4 border rounded-lg text-md text-teal-500',
          )}
          placeholder="----------"
          placeholderTextColor="#dedede"
          value={username}
          editable={false}
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
            <Image
              source={{uri: image}}
              style={{
                width: windowWidth - 32, // padding 16 kiri-kanan
                height: windowWidth - 32,
                borderRadius: 8,
              }}
            />
          </View>
        )}

        {/* Tombol Simpan */}
        <TouchableOpacity
          style={styleClass(
            'bg-aquamarine-500 w-full rounded-lg center p-4 mt-4 mb-4',
          )}
          onPress={handleSaveData}
        >
          <Text style={styleClass('text-white text-md font-semibold')}>
            {saving ? 'Menyimpan..' : 'Simpan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent={true}
        visible={saveFailed || saving}
        animationType="fade"
      >
        <Pressable
          onPress={() => {
            setSaveFailed(false);
            isSaving(false);
          }}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          {/* Stop event propagation to prevent modal from closing when pressing the content */}
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

const styles = StyleSheet.create({});
