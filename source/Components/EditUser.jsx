import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {database} from '../../source/Config/firebase'; // Firebase Realtime Database Config
import {ref, update, onValue} from 'firebase/database';
import Toast from 'react-native-simple-toast';
import {styleClass} from '../Config/styleClass';
import {useGlobalStateContext} from '../Config/GlobalStateContext';

export default function EditUser({id, bottomSheetRef}) {
  const [name, setName] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [image, setImage] = useState(null); // URI Gambar
  const [saving, setSaving] = useState(false);
  const {refrashMyData, setRefreshMyData} = useGlobalStateContext();
  const inputRef = useRef(null); // Membuat referensi untuk TextInput
  const closeBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
    setRefreshMyData(true);
  };
  useEffect(() => {
    // Fokus otomatis pada input saat komponen di-mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []); // Hanya dijalankan sekali saat komponen pertama kali dirender

  useEffect(() => {
    const anggotaRef = ref(database, 'Anggota/' + id);
    onValue(anggotaRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        setName(data.name);
        setNomorWhatsapp(data.nomorWhatsapp);
        setPassword(data.password);
        setImage(data.imageUrl || null); // Load URL gambar jika ada
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
        setImage(response.assets[0].uri); // Simpan URI gambar
      }
    });
  };

  const handleUpdateData = async () => {
    if (name === '' || password === '') {
      alert('Nama dan Password harus diisi!');
      return;
    }

    let imageUrl = image; // Tetap gunakan gambar lama jika tidak diubah

    if (image && !image.startsWith('https://')) {
      try {
        setSaving(true);
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
        setSaving(false);
        return;
      }
    }

    const anggotaRef = ref(database, 'Anggota/' + id);

    update(anggotaRef, {
      name: name,
      password: password,
      nomorWhatsapp: nomorWhatsapp,
      imageUrl: imageUrl, // Perbarui URL gambar
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
        alert('Gagal memperbarui data!');
      });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="ID"
        value={id}
        editable={false}
      />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder="Nama"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Nomor Whatsapp"
        value={nomorWhatsapp}
        keyboardType="number-pad"
        onChangeText={setNomorWhatsapp}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
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
      <TouchableOpacity style={styles.button} onPress={handleChooseImage}>
        <Text style={styles.buttonText}>
          {image ? 'Ubah Gambar' : 'Pilih Gambar'}
        </Text>
      </TouchableOpacity>
      {image && (
        <View style={styles.imagePreviewContainer}>
          <Text style={styles.previewText}>Preview Gambar:</Text>
          <Image source={{uri: image}} style={styles.imagePreview} />
        </View>
      )}
      <TouchableOpacity
        style={[styles.saveButton, styleClass('bg-aquamarine-500')]}
        onPress={handleUpdateData}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Menyimpan...' : 'Perbarui'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,

    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#73BBA3',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    height: 50,
  },
  button: {
    padding: 15,
    backgroundColor: '#e0f2f1',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#73BBA3',
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  previewText: {
    color: '#757575',
    marginBottom: 5,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  saveButton: {
    padding: 15,

    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
