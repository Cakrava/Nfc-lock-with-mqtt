import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {styleClass} from '../../Config/styleClass';
import MenuArsip from '../../Components/MenuArsip';
import AllHistory from '../../Components/listAllHistory';
import Catatan from '../../Components/Catatan';
import {ChartDevice} from '../../Components/Chart';

export default function Arsip() {
  return (
    <ScrollView
      style={[styleClass('w-full h-full'), {backgroundColor: '#F8F9FA'}]}
    >
      <View
        style={[
          styleClass('w-full items-center h-full'),
          {backgroundColor: '#F8F9FA'},
        ]}
      >
        <View
          style={[
            styleClass(
              'w-full py-3 bg-aquamarine-500 h-120 shadow-sm  mb-5 items-center px-2',
            ),
            {borderBottomLeftRadius: 15, borderBottomRightRadius: 15},
          ]}
        >
          <View style={styleClass('w-full')}>
            <Text style={styleClass('text-3xl font-bold  text-white ml-5')}>
              Arsip
            </Text>
          </View>
          <MenuArsip />
        </View>

        <AllHistory />
        <Catatan />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
