import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import {ref, set, get} from 'firebase/database';

import {database} from '../Config/firebase';

export default function Pembayaran() {
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  const simpanToken = async () => {
    if (!token) {
      Toast.show('Lengkapi token!');
      return;
    }

    try {
      // Ambil ref_token dari database payment/ref_token
      const refTokenSnapshot = await get(ref(database, 'payment/ref_token'));
      const currentRefToken = refTokenSnapshot.val();

      if (token !== currentRefToken) {
        Toast.show('Token tidak cocok!');
        return;
      }

      setSaving(true);

      // Update status dan ref_token di payment
      await set(ref(database, 'payment/'), {
        status: 1,
        ref_token: token,
        token: token,
      });

      Toast.show('Berhasil Menambah Perangkat!');
    } catch (err) {
      console.error('Gagal menyimpan data:', err);
      alert('Gagal menyimpan data!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Input Token</Text>
      <TextInput
        placeholder="Masukkan Token"
        style={styles.input}
        value={token}
        onChangeText={setToken}
        editable={!saving}
      />
      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={simpanToken}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Menyimpan...' : 'Simpan Token'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: '#f0f4f3',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#00796b',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#004d40',
    marginVertical: 12,
    shadowColor: '#00796b',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#b2dfdb',
  },
  button: {
    backgroundColor: '#00796b',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 15,
    shadowColor: '#004d40',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#004d40',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
});
