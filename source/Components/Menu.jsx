import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {styleClass} from '../Config/styleClass';
import {useNavigation} from '@react-navigation/core';
import Icon from 'react-native-vector-icons/Ionicons';
const color = '#20b2aa';
export default function Menu() {
  const navigation = useNavigation();
  return (
    <View>
      <View
        style={styleClass(
          'w-full bg-white shadow-sm  rounded-lg flex-row justify-around flex-wrap',
        )}
      >
        {/* User Management Menu */}
        <TouchableOpacity
          onPress={() => navigation.navigate('User')}
          style={styleClass('center w-70 h-100')}
        >
          <Icon
            name="person-outline"
            style={styleClass('bg-aquamarine-500 rounded-lg p-2')}
            color={'white'}
            size={30}
          />
          <Text style={[styleClass('text-md mt-1'), {color: color}]}>User</Text>
        </TouchableOpacity>

        {/* Settings Menu */}

        <TouchableOpacity
          onPress={() => navigation.navigate('History')}
          style={styleClass('center w-70 h-100')}
        >
          <Icon
            name="time-outline"
            style={styleClass('bg-aquamarine-500 rounded-lg p-2')}
            color={'white'}
            size={30}
          />
          <Text style={[styleClass('text-md mt-1'), {color: color}]}>
            History
          </Text>
        </TouchableOpacity>

        {/* Door Control Menu */}
        <TouchableOpacity
          onPress={() => navigation.navigate('WifiDirect')}
          style={styleClass('center w-70 h-100')}
        >
          <Icon
            name="wifi-outline"
            style={styleClass('bg-aquamarine-500 rounded-lg p-2')}
            color={'white'}
            size={30}
          />
          <Text style={[styleClass('text-md mt-1'), {color: color}]}>
            WiFi direct
          </Text>
        </TouchableOpacity>

        {/* Reports Menu */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Device')}
          style={styleClass('center w-70 h-100')}
        >
          <Icon
            name="extension-puzzle-outline"
            style={styleClass('bg-aquamarine-500 rounded-lg p-2')}
            color={'white'}
            size={30}
          />
          <Text style={[styleClass('text-md mt-1'), {color: color}]}>
            Perangkat
          </Text>
        </TouchableOpacity>

        {/* Help & Support Menu */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
