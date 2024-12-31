import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {styleClass} from './Config/styleClass'; // Pastikan ini sudah terkonfigurasi
import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons

import Login from './Auth/Login';

import Scan from './Components/Scan';
import Arsip from './Screen/Admin/Arsip';
import Profile from './Screen/Profile';
import Home from './Screen/Admin/Home';
const width = Dimensions.get('window').width;
const color = '#66cdaa'; // Warna untuk tab yang aktif

export default function BottomNavigation() {
  const [selectedTab, setSelectedTab] = useState('home');
  const [lebar, setlebar] = useState(0);
  const [animation] = useState(new Animated.Value(0)); // Animasi transisi tab

  // Daftar tab yang akan ditampilkan
  const tabs = [
    {name: 'home', label: 'Home', icon: 'home-outline', screen: <Home />},
    {
      name: 'arsip',
      label: 'Arsip',
      icon: 'layers-outline',
      screen: <Arsip />,
    },
    {
      name: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      screen: <Profile />,
    },
  ];

  const renderScreen = () => {
    const activeTab = tabs.find(tab => tab.name === selectedTab);
    return activeTab ? activeTab.screen : null;
  };

  useEffect(() => {
    setlebar(width * 0.5); // Menyesuaikan lebar untuk tombol floating
  }, []);

  return (
    <View style={styleClass('flex-1')}>
      {/* Content Area: Menampilkan Screen sesuai dengan Tab */}
      {renderScreen()}
      <View
        style={styleClass(
          'bg-white border-t w-full h-60 absolute bottom-0 flex-row justify-around items-center',
        )}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.name}
            style={styleClass('p-3 center')}
            onPress={() => setSelectedTab(tab.name)}
          >
            <Icon
              name={tab.icon}
              size={25}
              color={selectedTab === tab.name ? color : 'gray'}
            />
            <Text style={{color: selectedTab === tab.name ? color : 'gray'}}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
