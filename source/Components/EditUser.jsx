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
import {database} from '../../source/Config/firebase';
import {ref, update, onValue, remove} from 'firebase/database';
import Toast from 'react-native-simple-toast';
import {styleClass} from '../Config/styleClass';
import {useGlobalStateContext} from '../Config/GlobalStateContext';
const windowWidth = Dimensions.get('window').width;

export default function EditUser({id, bottomSheetRef}) {
  // --- STATE MANAGEMENT ---
  const [name, setName] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState(null); // Bisa URI lokal atau URL dari server
  const [imageToken, setImageToken] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const {apiUrl} = useGlobalStateContext();
  const [saveFailed, setSaveFailed] = useState(false);

  // --- REFS & CONTEXT ---
  const {setRefreshMyData} = useGlobalStateContext();
  const inputRef = useRef(null);
  const {
    loginId,
    loginName,
    loginNumber,
    LoginUsername,
    loginRole,
    loginImage,
    loginPassword,
    loginImageToken,
  } = useGlobalStateContext();

  // --- UTILITY FUNCTIONS ---
  const generateImageToken = (length = 15) => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const closeBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
    setRefreshMyData(true);
  };

  // --- LIFECYCLE HOOKS (useEffect) ---

  // Fokus ke input nama saat komponen dimuat
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Isi form dengan data dari Global Context saat pertama kali dimuat
  useEffect(() => {
    if (!id) return;

    const userRef = ref(database, `Anggota/${id}`);
    const unsubscribe = onValue(userRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        setName(data.name || '');
        setNomorWhatsapp(data.nomorWhatsapp || '');
        setPassword(data.password || '');
        setUsername(data.username || '');
        setImage(data.imageUrl || '');
        setImageToken(data.imageToken || '');
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, [id]);

  // Update username secara otomatis saat nama diketik
  useEffect(() => {
    const generatedUsername = name.toLowerCase().replace(/\s+/g, '');
    setUsername(generatedUsername);
  }, [name]);

  // --- HANDLER FUNCTIONS ---

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
        // Simpan URI gambar lokal, preview akan otomatis update
        setImage(response.assets[0].uri);
      }
    });
  };

  /**
   * Fungsi utama untuk menangani proses update data.
   * Menggunakan variabel lokal (finalImageUrl, finalImageToken) untuk memastikan konsistensi data
   * saat berinteraksi dengan state yang asinkron.
   */
  const handleUpdateData = async () => {
    if (name === '' || password === '') {
      alert('Nama dan Password harus diisi!');
      return;
    }

    setSaving(true);

    // 1. PERSIAPAN: Siapkan variabel final dengan nilai default dari state saat ini.
    // Ini adalah "single source of truth" untuk data yang akan disimpan ke Firebase.
    let finalImageUrl = image;
    let finalImageToken = imageToken;

    // 2. PROSES KONDISIONAL: Cek jika ada gambar LOKAL baru yang dipilih.
    // URL gambar lokal tidak diawali "https://".
    if (image && !image.startsWith('https://')) {
      try {
        // Buat token baru dan simpan di variabel LOKAL.
        const newToken = generateImageToken();

        const formData = new FormData();
        formData.append('id', id);
        // Gunakan `newToken` yang sudah pasti nilainya baru.
        formData.append('image_token', newToken);
        formData.append('image', {
          uri: image,
          type: 'image/jpeg',
          name: `${id}.jpg`,
        });

        const response = await fetch(`${apiUrl}upload`, {
          method: 'POST',
          body: formData,
          headers: {'Content-Type': 'multipart/form-data'},
        });

        if (response.ok) {
          // Jika upload berhasil, perbarui variabel final untuk disimpan ke Firebase.
          finalImageUrl = `${apiUrl}images/${newToken}`;
          finalImageToken = newToken;

          // Perbarui juga state untuk render selanjutnya.
          setImageToken(newToken);
        } else {
          // Jika upload gagal, hentikan proses.
          const errorResponse = await response.text();
          console.error('Image upload failed:', errorResponse);
          alert('Gagal memperbarui gambar!');
          setSaving(false);
          setSaveFailed(true);
          return;
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Gagal memperbarui gambar!');
        setSaving(false);
        setSaveFailed(true);
        return;
      }
    }

    // 3. TINDAKAN AKHIR: Simpan data ke Firebase menggunakan nilai dari variabel final.
    // Blok ini tidak peduli apakah gambar diubah atau tidak, ia hanya mengambil data terakhir yang paling benar.
    const anggotaRef = ref(database, 'Anggota/' + id);
    update(anggotaRef, {
      name: name,
      password: password,
      nomorWhatsapp: nomorWhatsapp,
      imageUrl: finalImageUrl,
      imageToken: finalImageToken,
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
        alert('Gagal memperbarui data!');
      });
  };

  // --- RENDER COMPONENT ---
  return (
    <View style={styleClass('w-full h-full')}>
      <ScrollView contentContainerStyle={styleClass('items-center p-3')}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styleClass('text-2xl text-teal-500')}>
            Perbarui Profile
          </Text>
        </View>

        {/* Form Inputs */}
        <Text style={styles.label}>ID</Text>
        <TextInput style={styles.inputDisabled} value={id} editable={false} />

        <Text style={styles.label}>Nama</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="e.g. John Smith"
          placeholderTextColor="#dedede"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.inputDisabled}
          value={username}
          editable={false}
        />

        <Text style={styles.label}>Nomor Whatsapp</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 08xxxxxxxxxx"
          placeholderTextColor="#dedede"
          value={nomorWhatsapp}
          keyboardType="number-pad"
          onChangeText={setNomorWhatsapp}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
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

        {/* Image Handling */}
        <TouchableOpacity
          style={styles.buttonChooseImage}
          onPress={handleChooseImage}
        >
          <Text style={styles.buttonText}>
            {image ? 'Ubah Gambar' : 'Pilih Gambar'}
          </Text>
        </TouchableOpacity>

        {image && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview Gambar:</Text>
            <FastImage
              source={{uri: image, priority: FastImage.priority.high}}
              style={{
                ...styles.previewImage,
                width: windowWidth - 24,
                height: windowWidth - 24,
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={styles.buttonSave}
          onPress={handleUpdateData}
          disabled={saving}
        >
          <Text style={styles.buttonSaveText}>
            {saving ? 'Menyimpan...' : 'Perbarui'}
          </Text>
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>

      {/* Modal Loading/Failed */}
      <Modal
        transparent={true}
        visible={saving || saveFailed}
        animationType="fade"
      >
        <Pressable
          onPress={() => setSaveFailed(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
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
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// Saya pindahkan style ke sini agar lebih rapi dan bisa menggunakan StyleSheet.create
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
    paddingLeft: 16,
    paddingRight: 16,
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
