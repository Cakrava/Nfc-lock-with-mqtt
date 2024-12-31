import {StyleSheet, Text, View} from 'react-native';
import React, {useState, useEffect} from 'react';
import FastImage from 'react-native-fast-image';
import {styleClass} from '../Config/styleClass';
import {useNfcContext} from '../Config/useNfc';
import {useGlobalStateContext} from '../Config/GlobalStateContext';

export default function Scan() {
  const {pesan, setPesan} = useNfcContext();
  const {aktif, setAktif} = useNfcContext();
  const {isSuccess, setIsSuccess} = useNfcContext();
  const {mqttConnected, setMqttConnect, isOnline} = useGlobalStateContext();
  const {isInvalid, setIsInvalid} = useNfcContext();
  const [statusKoneksi, setStatusKoneksi] = useState('');
  useEffect(() => {
    if (mqttConnected && isOnline) {
      setStatusKoneksi('Connected');
    } else if (mqttConnected && !isOnline) {
      setStatusKoneksi('Disconnect');
    } else {
      setStatusKoneksi('Disconnect');
    }
  }, [mqttConnected, isOnline, statusKoneksi]);

  return (
    <View>
      <View
        style={styleClass(
          'w-full h-auto flex-row items-center justify-between',
        )}
      >
        <View style={styleClass('w/1-8 ')}>
          {isOnline ? (
            <Text style={styleClass('text-xl text-teal-500 font-bold ')}>
              {pesan}
            </Text>
          ) : (
            <Text style={styleClass('text-xl text-teal-500 font-bold ')}>
              Koneksi terputus
            </Text>
          )}
        </View>

        <FastImage
          source={
            isOnline
              ? isInvalid
                ? require('../Assets/icon/ic_failed.gif')
                : isSuccess
                ? require('../Assets/icon/ic_success.gif')
                : aktif
                ? require('../Assets/icon/ic_loader.gif')
                : require('../Assets/icon/ic_failed.gif')
              : require('../Assets/icon/ic_failed.gif')
          }
          style={styleClass('w-50 h-50')}
        ></FastImage>
      </View>
      <View
        style={styleClass(
          `w-auto px-3 py-2 rounded-lg mt-4   ${
            statusKoneksi == 'Connected' ? 'bg-green-500 ' : 'bg-orange-500 '
          }`,
        )}
      >
        <Text style={styleClass('text-md text-white font-bold ')}>
          {statusKoneksi}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
