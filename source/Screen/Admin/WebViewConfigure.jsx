import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {WebView} from 'react-native-webview';
import WifiManager from 'react-native-wifi-reborn';
import {useNavigation} from '@react-navigation/native';
import {useGlobalStateContext} from '../../Config/GlobalStateContext';

export default function WebViewConfigure() {
  const navigation = useNavigation();

  const {checkingInternet, setChekingInternet} = useGlobalStateContext();
  const disconnectWifi = () => {
    WifiManager.disconnect()
      .then(() => {
        console.log('Koneksi Wi-Fi diputuskan');
      })
      .catch(error => {
        console.error('Gagal memutuskan koneksi:', error);
      })
      .finally(() => {
        navigation.goBack();
        setChekingInternet(true);
      });
  };

  useEffect(() => {
    const backAction = () => {
      disconnectWifi();
      return true; // Mencegah default back behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  return (
    <View style={{flex: 1}}>
      <View style={styles.header}>
        <TouchableOpacity onPress={disconnectWifi}>
          <Icon name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Konfigurasi Perangkat</Text>
      </View>
      <WebView
        source={{uri: 'http://192.168.4.1'}}
        style={{flex: 1, padding: 10}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14b8a6',
    padding: 16,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 12,
    fontWeight: 'bold',
  },
});
