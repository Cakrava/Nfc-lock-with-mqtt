import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {styleClass} from './Config/styleClass';

// Import komponen screen dengan benar
import HomeScreen from './Screen/Admin/Home';
import ArchiveScreen from './Screen/Admin/Arsip';
import ProfileScreen from './Screen/Profile';

const {width} = Dimensions.get('window');
const ACTIVE_TAB_COLOR = '#66cdaa';
const INACTIVE_TAB_COLOR = 'gray';

// Type untuk tab (jika menggunakan TypeScript)
// type TabType = {
//   name: string;
//   label: string;
//   icon: string;
//   component: React.ComponentType;
// };

const TabButton = React.memo(({tab, isActive, onPress}) => {
  const iconColor = isActive ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;
  const textColor = isActive ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={() => onPress(tab.name)}
      activeOpacity={0.7}
    >
      <Icon name={tab.icon} size={25} color={iconColor} />
      <Text style={[styles.tabLabel, {color: textColor}]}>{tab.label}</Text>
    </TouchableOpacity>
  );
});

const BottomNavigation = () => {
  const [selectedTab, setSelectedTab] = useState('home');
  const [animation] = useState(new Animated.Value(0));

  // Konfigurasi tab
  const tabs = [
    {
      name: 'home',
      label: 'Home',
      icon: 'home-outline',
      component: HomeScreen,
    },
    {
      name: 'archive',
      label: 'Archive',
      icon: 'layers-outline',
      component: ArchiveScreen,
    },
    {
      name: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      component: ProfileScreen,
    },
  ];

  const handleTabPress = useCallback(tabName => {
    setSelectedTab(tabName);
    // Tambahkan animasi jika diperlukan
    Animated.timing(animation, {
      toValue: tabs.findIndex(tab => tab.name === tabName),
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderActiveScreen = useCallback(() => {
    const ActiveScreen = tabs.find(tab => tab.name === selectedTab)?.component;
    return ActiveScreen ? <ActiveScreen /> : null;
  }, [selectedTab]);

  return (
    <View style={styles.container}>
      {/* Area Konten Utama */}
      <View style={styles.contentContainer}>{renderActiveScreen()}</View>

      {/* Tab Navigator */}
      <View style={styles.tabBarContainer}>
        {tabs.map(tab => (
          <TabButton
            key={tab.name}
            tab={tab}
            isActive={selectedTab === tab.name}
            onPress={handleTabPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    marginBottom: 60, // Sesuaikan dengan tinggi tab bar
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default React.memo(BottomNavigation);
