import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {styleClass} from '../Config/styleClass';

export default function Catatan() {
  const [useText, setUseText] = useState(0);

  const messages = [
    'Cek perangkat Anda secara teratur untuk keamanan yang lebih baik.',
    'Gunakan mode malam untuk kenyamanan mata saat bekerja.',
    'Pastikan perangkat Anda selalu terhubung ke jaringan yang aman.',
    'Perbarui perangkat Anda secara berkala untuk kinerja optimal.',
    'Manfaatkan fitur pencarian untuk menemukan perangkat lebih cepat.',
    'Jaga perangkat Anda agar tetap terorganisir dengan baik.',
    'Cek status perangkat Anda setiap beberapa jam.',
    'Lakukan pemeriksaan berkala untuk mendeteksi masalah perangkat.',
    'Pastikan perangkat terhubung dengan stabil sebelum digunakan.',
    'Tetap jaga perangkat Anda agar selalu dalam kondisi terbaik.',
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (useText < messages.length - 1) {
        setUseText(prev => prev + 1);
      } else {
        setUseText(0);
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(intervalId); // Clear interval when component unmounts
  }, [useText]);

  return (
    <View
      style={styleClass('bg-white w-1/9 h-150 p-3 rounded-lg mt-2 shadow-sm')}
    >
      <Text style={styleClass('text-md')}>Catatan</Text>
      <View style={styleClass('w-full h-2 bg-gray-300 mt-2')} />
      <View style={styleClass('w-full p-3 h-full ')}>
        <Text style={styleClass('text-lg text-gray-700 ')}>
          {messages[useText]}{' '}
          {/* Display the message based on the current index */}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
