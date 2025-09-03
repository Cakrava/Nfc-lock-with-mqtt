import {BackHandler} from 'react-native';
import React, {useRef} from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  Dimensions, // Disimpan untuk RBSheet height
} from 'react-native';
import {database} from '../Config/firebase';
import {useGlobalStateContext} from '../Config/GlobalStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ref, set, onValue, get, remove, close} from 'firebase/database'; // Firebase Realtime Database
import RBSheet from 'react-native-raw-bottom-sheet';
import EditUser from '../Components/EditUser';
import {styleClass} from '../Config/styleClass'; // Asumsi ini adalah style helper Anda

export default function Profile() {
  // 1. Mengambil data dan fungsi yang relevan dari Global Context
  const {
    loginImage,
    loginId,
    loginNumber,
    LoginUsername,
    loginName,
    loginRole,
    setStatusLogin,
    setLogin,
    setLoginId,
    setLoginName,
    setLoginImage,
    setLoginRole,
    setLoginUsername,
    setLoginNumber,
    setMyhistory, // Kosongkan juga data history, dll.
    setMyHistoryEmpty,
    setRefreshMyData,
    setTempId,
    tempId,

    // Reset status login untuk memicu navigasi
  } = useGlobalStateContext();

  // 2. Refs untuk mengontrol Bottom Sheets
  const editProfileSheetRef = useRef();
  const logoutSheetRef = useRef();
  const {height} = Dimensions.get('window');

  // Di dalam file Profile.js

  // ...

  const executeLogout = async () => {
    try {
      console.log('Memulai proses logout...');

      // LANGKAH 1: RESET SEMUA STATE GLOBAL YANG BERKAITAN DENGAN USER
      setLoginId(null);
      setLoginName('');
      setLoginImage('');
      setLoginRole('');
      setLoginUsername('');
      setLoginNumber('');
      setMyhistory([]);
      setMyHistoryEmpty(true);
      setTempId('');
      setStatusLogin(false);
      setLogin(null);

      console.log('State global telah di-reset.');

      // LANGKAH 2: HAPUS HANYA DATA SESI PENGGUNA DARI ASYNCSTORAGE
      // Perbaikan: removeItem hanya menerima satu key, jadi harus dipanggil dua kali untuk menghapus dua key
      // Hapus semua data AsyncStorage kecuali @phonedataid_saved
      // Hapus hanya key '@user_data' dari AsyncStorage saat logout
      await AsyncStorage.removeItem('@user_data');
      console.log('Semua data di AsyncStorage telah dihapus.');

      // LANGKAH 3: Tutup sheet logout jika masih terbuka
      if (logoutSheetRef.current) {
        logoutSheetRef.current.close();
      }

      // Catatan: Jika ingin lebih aman, bisa tambahkan notifikasi sebelum keluar
    } catch (error) {
      console.warn('Terjadi kegagalan saat proses logout:', error);
      // Anda bisa menambahkan notifikasi error untuk pengguna di sini jika perlu
    }
  };

  // ...

  // 5. Render komponen
  return (
    <View style={{flex: 1, backgroundColor: '#F8F9FA', padding: 20}}>
      {/* Header Profil */}
      <View
        style={[
          styleClass('bg-aquamarine-500 shadow-md'),
          {
            flexDirection: 'row',
            marginBottom: 30,
            alignItems: 'center',
            padding: 15,
            borderRadius: 12,
            shadowColor: '#CED4DA',
            elevation: 3,
          },
        ]}
      >
        <Image
          source={{uri: loginImage}}
          style={{
            width: 80,
            height: 80,
            borderRadius: 10,
            backgroundColor: '#E9ECEF',
            marginRight: 20,
          }}
        />
        <View style={{flex: 1}}>
          <Text style={{fontSize: 26, fontWeight: '600', color: 'white'}}>
            {loginName}
          </Text>
          <Text style={{fontSize: 16, color: 'white'}}>{loginRole}</Text>
        </View>
      </View>

      {/* Grid Info Pengguna */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <InfoItem label="ID PENGGUNA" value={loginId} width="48%" />
        <InfoItem label="USERNAME" value={LoginUsername} width="48%" />
        <InfoItem label="WHATSAPP" value={loginNumber} width="100%" />
      </View>

      {/* Tombol Aksi */}
      <TouchableOpacity
        onPress={() => editProfileSheetRef.current.open()}
        style={styles.actionButton}
      >
        <Text style={styles.actionButtonText}>Atur ulang profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => logoutSheetRef.current.open()}
        style={[styles.actionButton, styles.logoutButton]}
      >
        <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
          Keluar
        </Text>
      </TouchableOpacity>

      {/* Bottom Sheet untuk Edit Profile */}
      <RBSheet
        ref={editProfileSheetRef}
        height={height}
        draggable={true}
        customStyles={sheetStyles}
      >
        {/* Komponen EditUser bertanggung jawab atas logikanya sendiri */}
        <EditUser id={loginId} bottomSheetRef={editProfileSheetRef} />
      </RBSheet>

      {/* Bottom Sheet untuk Konfirmasi Logout */}
      <RBSheet
        ref={logoutSheetRef}
        height={250}
        draggable={true}
        customStyles={sheetStyles}
      >
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Konfirmasi Logout</Text>
          <Text style={styles.sheetSubtitle}>
            Apakah Anda yakin ingin keluar?
          </Text>
          <View style={styles.sheetButtonRow}>
            <TouchableOpacity
              onPress={() => logoutSheetRef.current.close()}
              style={[styles.sheetButton, styles.cancelButton]}
            >
              <Text style={styles.sheetButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={executeLogout}
              style={[styles.sheetButton, styles.confirmLogoutButton]}
            >
              <Text style={[styles.sheetButtonText, {color: '#D94854'}]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </RBSheet>
    </View>
  );
}

// Komponen kecil untuk menghindari duplikasi kode pada Grid Info
const InfoItem = ({label, value, width}) => (
  <View style={[styles.infoItem, {width}]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

// Style dipindahkan ke StyleSheet untuk kerapian
const sheetStyles = {
  wrapper: {backgroundColor: 'rgba(0, 0, 0, 0.4)'},
  draggableIcon: {backgroundColor: '#ADB5BD'},
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
};

const styles = {
  infoItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#DEE2E6',
  },
  infoLabel: {
    fontSize: 12,
    color: '#ADB5BD',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#F1AEB5',
  },
  logoutButtonText: {
    color: '#D94854',
  },
  sheetContainer: {
    padding: 20,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 10,
    textAlign: 'center',
  },
  sheetButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    width: '100%',
  },
  sheetButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E9ECEF',
  },
  confirmLogoutButton: {
    backgroundColor: '#F1AEB5',
  },
  sheetButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '500',
  },
};
