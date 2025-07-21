import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BottomNavigation from './BottomNavigation'; // Pastikan ini adalah komponen yang valid
import BottomNavigationUser from './BottomNavigationUser'; // Pastikan ini adalah komponen yang valid
import Login from './Auth/Login';
import User from './Screen/Admin/User';
import Device from './Screen/Admin/Device';
import {NfcProvider, useNfcContext} from './Config/useNfc';
import {
  GlobalStateProvider,
  useGlobalStateContext,
} from './Config/GlobalStateContext';
import History from './Screen/Admin/History';
import {DeviceStatusProvider} from './Config/DeviceListContext';
import LoadingScreen from './Screen/LoadingScreen';
import AllHistory from './Screen/Admin/AllHistory';
import UserHistory from './Components/UserHistory';
import Log from './Screen/Admin/Log';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ListWifi from './Screen/Admin/ListWifi';
import WifiConfiguration from './Screen/Admin/WifiConfiguration';
import WifiDirect from './Screen/Admin/WifiDirect';
import WebViewConfigure from './Screen/Admin/WebViewConfigure';
import Pembayaran from './Screen/payment';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GlobalStateProvider>
      <NfcProvider>
        <DeviceStatusProvider>
          <RootNavigator />
        </DeviceStatusProvider>
      </NfcProvider>
    </GlobalStateProvider>
  );
}

function RootNavigator() {
  const {mqttConnected, loginRole} = useGlobalStateContext();
  const [loading, setLoading] = useState(true); // Set awal loading ke true
  const {
    checkStatus,
    statusLogin,
    setLogin,
    isOnline,
    nfcProcessing,
    paymentStatus,
  } = useGlobalStateContext();
  const {nfcSupport, nfcEnabled} = useNfcContext();
  useEffect(() => {
    if (isOnline && nfcSupport && nfcEnabled) {
      // if (isOnline && nfcProcessing && nfcSupport && nfcEnabled) {
      console.log('nfcProcessing', nfcProcessing);
      console.log('nfcSupport', nfcSupport);
      console.log('nfcEnabled', nfcEnabled);
      const fetchData = async () => {
        if (statusLogin == null) {
          try {
            const value = await AsyncStorage.getItem('@user_data');
            if (value) {
              const parsedData = JSON.parse(value);
              const statusLogin = parsedData.statusLogin;
              setLogin(statusLogin);
              setLoading(false); // Set loading true ketika mqttConnected = true
            }
          } catch (error) {
            console.error('Error fetching data from AsyncStorage', error);
          } finally {
            setLoading(false); // Setelah data diambil, set loading false
          }
        }
      };

      fetchData(); // Ambil data status login ketika mqttConnected true
    } else {
      setLoading(true); // Jika mqttConnected false, set loading false
    }
  }, [
    isOnline,
    checkStatus,
    statusLogin,
    paymentStatus,
    nfcSupport,
    nfcEnabled,
  ]); // Menunggu perubahan pada mqttConnected

  if (loading || loginRole === null) {
    // Tampilkan loading jika sedang memuat data atau saat mqttConnected false
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Loading"
            component={LoadingScreen}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (!paymentStatus) {
    // Tampilkan loading jika sedang memuat data atau saat mqttConnected false
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="payment"
            component={Pembayaran}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Setelah mqttConnected true dan statusLogin diperiksa
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {statusLogin === 'sukses' ? (
          loginRole && (loginRole === 'admin' || loginRole === 'Admin') ? (
            <>
              <Stack.Screen
                name="BottomNavigation"
                component={BottomNavigation}
                options={{headerShown: false}}
              />
            </>
          ) : loginRole && (loginRole === 'user' || loginRole === 'User') ? (
            <>
              <Stack.Screen
                name="BottomNavigationUser"
                component={BottomNavigationUser}
                options={{headerShown: false}}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={Login}
                options={{headerShown: false}}
              />
            </>
          )
        ) : (
          <Stack.Screen
            name="Login"
            component={Login}
            options={{headerShown: false}}
          />
        )}
        <Stack.Screen
          name="User"
          component={User}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Device"
          component={Device}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="History"
          component={History}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AllHistory"
          component={AllHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="UserHistory"
          component={UserHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Log"
          component={Log}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ListWifi"
          component={ListWifi}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="WifiConfig"
          component={WifiConfiguration}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="WifiDirect"
          component={WifiDirect}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="WebViewConfigure"
          component={WebViewConfigure}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({});
