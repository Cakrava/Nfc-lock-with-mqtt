import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-simple-toast';
import {ref, set} from 'firebase/database'; // Firebase Realtime Database
import {database} from '../Config/firebase'; // Firebase Realtime Database Config
import {styleClass} from '../Config/styleClass';
import {useNfcContext} from '../Config/useNfc';
import {useGlobalStateContext} from '../Config/GlobalStateContext';
import {sendMessage} from '../Config/firebaseHelper';

export default function NewUser({bottomSheetRef}) {
  const [saving, setSaving] = useState(false);
  const {isDetect, setIsDetect} = useNfcContext();
  const {getId, setGetId} = useNfcContext();
  const [name, setName] = useState('');
  const {getTopic, setGetTopic} = useNfcContext();
  const {aktif, setAktif} = useNfcContext();
  const {messageDetect, setMessageDetect} = useNfcContext('');

  const handleSaveData = async () => {
    if (!name || !getTopic || !getId) {
      alert('Lengkapi data!');
      return;
    }

    const deviceRef = ref(database, `Device/${getId}`);

    setSaving(true);
    set(deviceRef, {
      id: getId,
      name: name,
      topic: getTopic,
    })
      .then(() => {
        Toast.show('Berhasil Menambah Perangkat!', Toast.LONG);
        setSaving(false);
        closeBottomSheet();
      })
      .catch(error => {
        console.error('Error saving data:', error);
        setSaving(false);
        alert('Gagal menyimpan data!');
      });
  };

  const closeBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  };
  useEffect(() => {
    var data = 'false';
    sendMessage(data);
    return () => {
      var data = 'true';
      sendMessage(data);
    };
  }, []);

  useEffect(() => {
    setGetId('');
    setGetTopic('');
    setMessageDetect('Dekatkan ke perangkat');
    setIsDetect(false);
  }, []);

  return (
    <View style={styleClass('w-full h-full items-center')}>
      <FastImage
        source={
          isDetect
            ? require('../Assets/icon/ic_success.gif')
            : aktif
            ? require('../Assets/icon/ic_loader.gif')
            : require('../Assets/icon/ic_failed.gif')
        }
        style={styleClass('w-200 h-200 mt-5 mb-5')}
      />
      {messageDetect && (
        <Text style={styleClass('text-teal-500 text-xl font-semibold')}>
          {messageDetect}
        </Text>
      )}
      <TextInput
        style={styleClass('w-1/9 p-4 border rounded-lg mt-3 text-md')}
        placeholder="Nama Perangkat"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styleClass(
          `w-1/9 p-4 border rounded-lg mt-3 text-md ${
            isDetect ? 'bg-green-100' : 'bg-gray-300'
          }`,
        )}
        placeholder="ID didapatkan secara otomatis"
        value={getId}
        onChangeText={setGetId}
        editable={false}
      />
      <TextInput
        style={styleClass(
          `w-1/9 p-4 border rounded-lg mt-3 text-md ${
            isDetect ? 'bg-green-100' : 'bg-gray-300'
          }`,
        )}
        placeholder="Alamat didapatkan secara otomatis"
        value={getTopic}
        onChangeText={setGetTopic}
        editable={false}
      />

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
