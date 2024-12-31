import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/core';
import {styleClass} from '../Config/styleClass';
const color = '#20b2aa';
const {width, height} = Dimensions.get('window');
import Icon from 'react-native-vector-icons/Ionicons';
export default function MenuArsip() {
  const [lebar, setLebar] = useState(width * 0.9);
  const navigation = useNavigation();
  return (
    <View
      style={[
        styleClass(' bg-white h-auto  shadow-sm rounded-lg p-2 mt-5  '),
        {width: lebar},
      ]}
    >
      {/* Door Control Menu */}
      <TouchableOpacity
        onPress={() => navigation.navigate('UserHistory')}
        style={styleClass(
          ' flex-row items-center w-full bg-teal-100  mb-5 rounded-lg h-70 px-3 ',
        )}
      >
        <View
          style={styleClass(
            'w-80 justify-center items-center fle-row p-2 mr-5 bg-teal-400 w-50 h-50 rounded-lg ',
          )}
        >
          <Icon name="hourglass-outline" color={'white'} size={30} />
        </View>
        <Text style={[styleClass('text-xl  '), {color: color}]}>
          User History
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Log')}
        style={styleClass(
          ' flex-row items-center w-full bg-teal-100  mb-5 rounded-lg h-70 px-3 ',
        )}
      >
        <View
          style={styleClass(
            'w-80 justify-center items-center fle-row p-2 mr-5 bg-teal-400 w-50 h-50 rounded-lg ',
          )}
        >
          <Icon name="newspaper-outline" color={'white'} size={30} />
        </View>
        <Text style={[styleClass('text-xl  '), {color: color}]}>
          Log Sistem
        </Text>
      </TouchableOpacity>

      {/* Reports Menu */}
    </View>
  );
}

const styles = StyleSheet.create({});
