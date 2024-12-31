import {StyleSheet, Text, View, Dimensions} from 'react-native';
import React, {useState} from 'react';
import {styleClass} from '../Config/styleClass';
import LottieView from 'lottie-react-native';
const {width} = Dimensions.get('window');

export default function Limitasi() {
  const [lebar, setLebar] = useState(width * 0.8);
  return (
    <View style={styleClass('w-full  h-full bg-orange-500 center p-3')}>
      <LottieView
        style={{height: lebar, width: lebar}}
        autoPlay
        source={require('../Assets/Animation/denied.json')}
      />
      <Text style={styleClass('text-lg font-bold text-white text-center')}>
        Anda terlalu sering mengakses aplikasi ini!
      </Text>
      <Text style={styleClass('text-md font-bold text-white text-center ')}>
        Coba lagi dalam 30 menit kedepan
      </Text>
      <Text
        style={styleClass(
          'text-xl   font-bold text-white text-center absolute bottom-20 ',
        )}
      >
        Sistem Keamanan Sekolah Aman
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({});
