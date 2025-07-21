import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {styleClass} from '../../Config/styleClass';
import {useNavigation} from '@react-navigation/core';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons
import Menu from '../../Components/Menu';
import Baner from '../../Components/Baner';
import Scan from '../../Components/Scan';
import {useGlobalStateContext} from '../../Config/GlobalStateContext';
import ListHistory from '../../Components/ListHistory';
import Limitasi from '../../Components/Limitasi';
const color = '#20b2aa';
export default function Home() {
  const {
    loginName,
    loginImage,
    totalDevice,
    mqttConnected,
  } = useGlobalStateContext();
  const navigation = useNavigation();
  useEffect(() => {}, [loginName, loginImage]);

  return (
    <ScrollView style={styleClass('w-full h-full bg-gray-100')}>
      <View
        style={[
          styleClass(
            `w-full p-4 ${
              mqttConnected ? 'bg-aquamarine-500' : 'bg-orange-500'
            } h-auto shadow-sm`,
          ),
          {borderBottomLeftRadius: 15, borderBottomRightRadius: 15},
        ]}
      >
        <View style={styleClass('flex-row justify-between items-center p-1 ')}>
          <Text style={styleClass('text-white text-xl font-semibold')}>
            Selamat Datang, {loginName}
          </Text>

          <Image
            style={styleClass(
              'border border-white border-2 border-white w-50 h-50 rounded-full ',
            )}
            source={
              loginImage
                ? {uri: `${loginImage}`}
                : require('../../Assets/icon/ic_sikesa.png')
            }
          />
        </View>
        <View
          style={styleClass(
            'mt-1 bg-white rounded-lg w-full h-auto  p-4 items-center flex-row justify-between',
          )}
        >
          <Scan />
        </View>
      </View>

      <View style={[styleClass('w-full px-3 py-2 z-20'), {marginBottom: 100}]}>
        <View style={styleClass('w-full bg-white shadow-sm  rounded-lg ')}>
          <View
            style={styleClass(
              'w-full bg-white shadow-sm  rounded-lg flex-row p-2',
            )}
          >
            <View style={styleClass('w-1/5  flex-row')}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ListWifi')}
                style={styleClass('center w-70 h-100')}
              >
                <Icon
                  name="wifi-outline"
                  style={styleClass('bg-aquamarine-500 rounded-lg p-2')}
                  color={'white'}
                  size={30}
                />
                <Text style={[styleClass('text-md mt-1'), {color: color}]}>
                  WiFi direct
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('History')}
                style={styleClass('center w-70 h-100')}
              >
                <Icon
                  name="time-outline"
                  style={styleClass('bg-aquamarine-500 rounded-lg p-2')}
                  color={'white'}
                  size={30}
                />
                <Text style={[styleClass('text-md mt-1'), {color: color}]}>
                  History
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={styleClass('w-1/5  bg-aquamarine-300  rounded-lg p-2 ')}
            >
              <Text style={styleClass('text-sm text-white')}>Device</Text>
              <Text
                style={{
                  fontSize: 50,
                  fontWeight: 'bold',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                {totalDevice}
              </Text>
            </View>
          </View>
        </View>
        <Baner />
        <ListHistory />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
