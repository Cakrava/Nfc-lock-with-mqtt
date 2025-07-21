import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {styleClass} from '../Config/styleClass';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ref, get, child, database} from 'firebase/database';
import {handleLogin} from '../Config/firebaseHelper';
import {useGlobalStateContext} from '../Config/GlobalStateContext';
export default function Login() {
  const {height, width} = Dimensions.get('window');
  const [lebar, setLebar] = useState(0);
  const [DataId, setIdNumbber] = useState('');
  const [DataPassword, setPassword] = useState('');
  const [alertId, setAlertId] = useState('');
  const [alertPassword, setAlertPassword] = useState('');
  const navigation = useNavigation();
  const {setStatusLogin, setTempId} = useGlobalStateContext();

  DataId, DataPassword;
  useEffect(() => {
    setLebar(width * 0.8);
  }, []);

  function clickLogin() {
    if (DataId && DataPassword) {
      handleLogin(DataId, DataPassword, setStatusLogin, setTempId);
    } else if (!DataId) {
      setAlertId('Masukkan ID anda!');
    } else if (!DataPassword) {
      setAlertPassword('Masukkan password anda!');
    }
  }
  return (
    <View style={styleClass('w-full h-full bg-aquamarine-300 center')}>
      <LottieView
        source={require('../Assets/Animation/login.json')}
        style={{width: lebar, height: lebar}}
        autoPlay
        loop
      ></LottieView>
      <Text style={styleClass('text-3xl font-bold text-white')}>
        Login to Sikesa
      </Text>
      <View
        style={styleClass(
          'w-1/9 border bg-white  border-white-100   rounded-lg mt-5',
        )}
      >
        <TextInput
          value={DataId}
          onChangeText={setIdNumbber}
          style={styleClass('w-full  text-gray-900 text-xl  p-3')}
          placeholder="ID atau Username"
        />
      </View>
      {alertId && (
        <View style={styleClass('mt-1 w-1/9 px-2')}>
          <Text style={styleClass('text-red-500 ')}>{alertId}</Text>
        </View>
      )}
      <View
        style={styleClass(
          'w-1/9 border bg-white  items-center flex-row border-white-100   rounded-lg mt-5',
        )}
      >
        <TextInput
          value={DataPassword}
          onChangeText={setPassword}
          style={styleClass('w-1/9  text-gray-900 text-xl  p-3')}
          placeholder="Password"
        />
        <TouchableOpacity>
          <Icon name="eye-outline" size={25} color={'white'}></Icon>
        </TouchableOpacity>
      </View>
      {alertPassword && (
        <View style={styleClass('mt-1 w-1/9 px-2')}>
          <Text style={styleClass('text-red-500 ')}>{alertPassword}</Text>
        </View>
      )}
      <TouchableOpacity
        style={styleClass(
          'w-1/9 p-3 rounded-lg bg-aquamarine-500 center mt-5 ',
        )}
        onPress={clickLogin}
      >
        <Text style={styleClass('text-xl font-bold text-white')}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({});
