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
import Toast from 'react-native-simple-toast';
import {launchImageLibrary} from 'react-native-image-picker';
import {database} from '../../source/Config/firebase'; // Firebase Realtime Database Config
import {ref, set} from 'firebase/database'; // Firebase Realtime Database
import {styleClass} from '../Config/styleClass';
import {sendLog} from '../Config/firebaseHelper';
import {useGlobalStateContext} from '../Config/GlobalStateContext';

const windowWidth = Dimensions.get('window').width;

// --- FUNGSI HELPERS (diletakkan di luar komponen) ---

// Fungsi untuk menghasilkan ID acak
const generateRandomID = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Fungsi untuk menghasilkan password acak
const generateRandomPassword = (length = 8) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Fungsi untuk menghasilkan token gambar acak
const generateImageToken = (length = 15) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function NewUser({bottomSheetRef}) {
  // --- STATE MANAGEMENT ---
  const [id, setId] = useState(generateRandomID());
  const [name, setName] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState(null); // URI Gambar Lokal
  const [imageToken, setImageToken] = useState(''); // State untuk token gambar
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const {apiUrl} = useGlobalStateContext();

  // --- LIFECYCLE HOOKS (useEffect) ---
  useEffect(() => {
    // Generate username otomatis dari nama
    setUsername(name.toLowerCase().replace(/\s/g, ''));
  }, [name]);

  // --- HANDLER FUNCTIONS ---
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
        setImage(response.assets[0].uri);
      }
    });
  };

  const handleSaveData = async () => {
    if (name === '' || password === '') {
      alert('Nama dan Password harus diisi!');
      return;
    }

    setSaving(true);

    // 1. PERSIAPAN: Siapkan variabel final dengan nilai default null.
    let finalImageUrl = null;
    let finalImageToken = null;

    // 2. PROSES KONDISIONAL: Jika ada gambar yang dipilih, unggah terlebih dahulu.
    if (image) {
      try {
        // Buat token baru KHUSUS untuk gambar ini.
        const newToken = generateImageToken();

        const formData = new FormData();
        formData.append('id', id);
        // Kirim token yang baru dibuat ke API.
        formData.append('image_token', newToken);
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: `${newToken}.jpg`, // Nama file bisa menggunakan token agar lebih unik
        });

        const response = await fetch(`${apiUrl}upload`, {
          method: 'POST',
          body: formData,
          headers: {'Content-Type': 'multipart/form-data'},
        });

        if (response.ok) {
          // Jika upload berhasil, perbarui variabel final.
          finalImageUrl = `${apiUrl}images/${newToken}`;
          finalImageToken = newToken;

          // Perbarui state (opsional untuk form baru, tapi best practice)
          setImageToken(newToken);
        } else {
          // Jika upload gagal, hentikan proses.
          const errorResponse = await response.text();
          console.warn('Image upload failed:', errorResponse);
          alert('Gagal mengunggah gambar!');
          setSaving(false);
          setSaveFailed(true);
          return;
        }
      } catch (error) {
        console.warn('Error uploading image:', error);
        alert('Gagal mengunggah gambar!');
        setSaving(false);
        setSaveFailed(true);
        return;
      }
    }

    // 3. TINDAKAN AKHIR: Simpan data ke Firebase menggunakan nilai dari variabel final.
    const anggotaRef = ref(database, 'Anggota/' + id);

    set(anggotaRef, {
      id: id,
      name: name,
      password: password,
      nomorWhatsapp: nomorWhatsapp,
      username: username,
      role: 'User',
      imageUrl: finalImageUrl, // URL gambar dari API atau null
      imageToken: finalImageToken, // Token gambar dari generator atau null
    })
      .then(() => {
        Toast.show('Berhasil Menambah Data!', Toast.LONG);
        setSaving(false);
        closeBottomSheet();
        sendLog(`Admin baru saja menambahkan ${name}`);
      })
      .catch(error => {
        console.error('Error saving data:', error);
        setSaving(false);
        setSaveFailed(true);
        alert('Gagal menyimpan data!');
      });
  };

  const closeBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  };

  // --- RENDER COMPONENT ---
  return (
    <View style={styleClass('w-full h-full')}>
      <ScrollView contentContainerStyle={styleClass('items-center p-3')}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styleClass('text-2xl text-teal-500')}>Tambah User</Text>
        </View>

        {/* ID */}
        <Text style={styles.label}>ID</Text>
        <TextInput style={styles.inputDisabled} value={id} editable={false} />

        {/* Nama */}
        <Text style={styles.label}>Nama</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. John Smith"
          placeholderTextColor="#dedede"
          value={name}
          onChangeText={setName}
        />

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.inputDisabled}
          placeholder="terisi-otomatis"
          placeholderTextColor="#dedede"
          value={username}
          editable={false}
        />

        {/* Nomor WhatsApp */}
        <Text style={styles.label}>Nomor Whatsapp</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 08xxxxxxxxxx"
          placeholderTextColor="#dedede"
          value={nomorWhatsapp}
          keyboardType="number-pad"
          onChangeText={setNomorWhatsapp}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Klik ikon untuk generate"
            placeholderTextColor="#dedede"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={handleShowPassword}
            style={{marginRight: 10}}
          >
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
          style={styles.buttonChooseImage}
          onPress={handleChooseImage}
        >
          <Text style={styles.buttonText}>
            {image ? 'Ubah Gambar' : 'Pilih Gambar'}
          </Text>
        </TouchableOpacity>

        {/* Preview Gambar */}
        {image && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview Gambar:</Text>
            <Image
              source={{uri: image}}
              style={{
                ...styles.previewImage,
                width: windowWidth - 24,
                height: windowWidth - 24,
              }}
            />
          </View>
        )}

        {/* Tombol Simpan */}
        <TouchableOpacity
          style={styles.buttonSave}
          onPress={handleSaveData}
          disabled={saving}
        >
          <Text style={styles.buttonSaveText}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Text>
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>

      {/* Modal Loading/Failed */}
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
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={styles.modalContent}
          >
            <FastImage
              source={
                saving
                  ? require('../Assets/icon/ic_loader.gif')
                  : saveFailed
                  ? require('../Assets/icon/ic_failed.gif')
                  : null
              }
              style={styles.modalImage}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Styles diletakkan di bawah untuk kerapian
const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#dedede',
    paddingBottom: 10,
    marginBottom: 10,
  },
  label: {
    width: '100%',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'left',
  },
  input: {
    ...styleClass('w-full p-4 border rounded-lg text-md'),
  },
  inputDisabled: {
    ...styleClass(
      'w-full p-4 border rounded-lg text-md bg-gray-100 text-gray-500',
    ),
  },
  passwordContainer: {
    ...styleClass(
      'w-full p-2 border rounded-lg flex-row items-center justify-between',
    ),
    paddingHorizontal: 16,
  },
  passwordInput: {
    ...styleClass('text-md'),
    flex: 1,
  },
  buttonChooseImage: {
    ...styleClass('w-full p-4 border rounded-lg center mt-5'),
    borderColor: '#dedede',
  },
  buttonText: {
    ...styleClass('text-md text-center text-gray-700'),
  },
  previewContainer: {
    width: '100%',
    marginTop: 12,
  },
  previewLabel: {
    ...styleClass('text-gray-600 text-sm mb-3'),
  },
  previewImage: {
    borderRadius: 8,
  },
  buttonSave: {
    ...styleClass('bg-aquamarine-500 w-full rounded-lg center p-4 mt-5'),
  },
  buttonSaveText: {
    ...styleClass('text-white text-md font-semibold'),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 10,
    backgroundColor: 'white',
    padding: 20,
  },
  modalImage: {
    width: 100,
    height: 100,
  },
});
