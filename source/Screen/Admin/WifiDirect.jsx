import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/core';
import {styleClass} from '../../Config/styleClass';
const color = '#20b2aa';
const {width, height} = Dimensions.get('window');
import Icon from 'react-native-vector-icons/Ionicons';
export default function WifiDirect() {
  const [lebar, setLebar] = useState(width * 0.9);
  const navigation = useNavigation();
  return (
    <View
      style={[
        styleClass(
          'w-full py-3 bg-aquamarine-500 h-120 shadow-sm  mb-5 items-center px-2',
        ),
        {borderBottomLeftRadius: 15, borderBottomRightRadius: 15},
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styleClass('text-3xl font-bold  text-white ml-5')}>
          Wifi Direct
        </Text>
      </View>
      <View
        style={[
          styleClass(' bg-white h-auto  shadow-sm rounded-lg p-2 mt-5  '),
          {width: lebar},
        ]}
      >
        {/* Door Control Menu */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ListWifi')}
          style={styleClass(
            ' flex-row items-center w-full bg-teal-100  mb-5 rounded-lg h-70 px-3 ',
          )}
        >
          <View
            style={styleClass(
              'w-80 justify-center items-center fle-row p-2 mr-5 bg-teal-400 w-50 h-50 rounded-lg ',
            )}
          >
            <Icon name="open-outline" color={'white'} size={30} />
          </View>
          <Text style={[styleClass('text-xl  '), {color: color}]}>
            Emergency Access
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('WifiConfig')}
          style={styleClass(
            ' flex-row items-center w-full bg-teal-100  mb-5 rounded-lg h-70 px-3 ',
          )}
        >
          <View
            style={styleClass(
              'w-80 justify-center items-center fle-row p-2 mr-5 bg-teal-400 w-50 h-50 rounded-lg ',
            )}
          >
            <Icon name="settings-outline" color={'white'} size={30} />
          </View>
          <Text style={[styleClass('text-xl  '), {color: color}]}>
            Device Configuration
          </Text>
        </TouchableOpacity>

        {/* Reports Menu */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#14b8a6',
  },
});
