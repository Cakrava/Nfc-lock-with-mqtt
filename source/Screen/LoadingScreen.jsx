import {
  Image,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import {styleClass} from '../Config/styleClass';
import LottieView from 'lottie-react-native';
import {useGlobalStateContext} from '../Config/GlobalStateContext';
import {useNfcContext} from '../Config/useNfc';
const {width, height} = Dimensions.get('window');

export default function LoadingScreen() {
  const [lebar, setLebar] = useState(width * 0.8);
  const [tinggi, setTinggi] = useState(lebar * 0.4);
  const [tinggiLottie, setTinggiLottie] = useState(lebar * 0.8);
  const {isOnline, mqttConnected, nfcProcessing} = useGlobalStateContext();

  const {nfcSupport, nfcEnabled, startNfcSession} = useNfcContext();

  return (
    <View style={styleClass('w-full h-full bg-white center')}>
      <Image
        source={require('../Assets/icon/ic_sikesa.png')}
        style={{height: tinggi, width: lebar}}
      />
      <View
        style={[
          styleClass(' center mt-n-20'),
          {width: lebar, height: tinggiLottie},
        ]}
      >
        <LottieView
          source={require('../Assets/Animation/loading.json')}
          autoPlay
          style={{
            height: '100%',
            width: '100%',
            marginBottom: -80,
            marginTop: -80,
          }}
        />
        {!isOnline ? (
          <Text style={styleClass('text-gray-700 text-md')}>
            Memeriksa jaringan...
          </Text>
        ) : !mqttConnected ? (
          <Text style={styleClass('text-gray-700 text-md')}>
            Menghubungkan ke MQTT...
          </Text>
        ) : !nfcSupport ? (
          <Text style={styleClass('text-gray-700 text-md')}>
            Perangkat tidak mendukung NFC
          </Text>
        ) : !nfcEnabled ? (
          <Text style={styleClass('text-gray-700 text-md')}>
            Nyalakan NFC di perangkat Anda
          </Text>
        ) : nfcProcessing ? (
          <Text style={styleClass('text-gray-700 text-md')}>
            Mempersiapkan sesi NFC...
          </Text>
        ) : null}
      </View>

      <View style={styleClass('h-auto w-1/8 absolute bottom-20')}>
        <Text style={styleClass('text-gray-700 text-xl text-center')}>
          Sistem Keamanan Sekolah Aman
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
