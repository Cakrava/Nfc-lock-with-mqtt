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

import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons
import Menu from '../../Components/Menu';
import Baner from '../../Components/Baner';
import Scan from '../../Components/Scan';
import {useGlobalStateContext} from '../../Config/GlobalStateContext';
import ListHistory from '../../Components/ListHistory';
import Limitasi from '../../Components/Limitasi';
const color = '#20b2aa';
export default function Home() {
  const {loginName, loginImage} = useGlobalStateContext();
  useEffect(() => {}, [loginName, loginImage]);
  return (
    <ScrollView style={styleClass('w-full h-full bg-gray-100')}>
      <View
        style={[
          styleClass('w-full p-4 bg-aquamarine-500 h-auto shadow-sm'),
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
        <Menu />
        <Baner />
        <ListHistory />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
