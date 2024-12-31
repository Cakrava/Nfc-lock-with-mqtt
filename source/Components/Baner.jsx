import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View, Image, FlatList, Dimensions} from 'react-native';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const images = [
  require('../Assets/Banner/1.png'),
  require('../Assets/Banner/2.png'),
  require('../Assets/Banner/3.png'),
];

export default function Banner() {
  const [lebar, setLebar] = useState(0);
  const [tinggi, setTinggi] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Menentukan ukuran gambar berdasarkan lebar layar
    let value = windowWidth * 0.9;
    setLebar(value);
    setTinggi(value * 0.5);

    // Timer untuk mengganti gambar setiap 5 detik
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({animated: true, index: nextIndex});
    }, 5000);

    return () => clearInterval(interval); // Membersihkan interval saat komponen di-unmount
  }, [currentIndex]);

  const renderItem = ({item}) => (
    <Image
      source={item}
      style={{
        width: lebar,
        height: tinggi,
        borderRadius: 10,
        marginRight: 5,
        marginLeft: 5,
      }}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={flatListRef}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / lebar);
          setCurrentIndex(index);
        }}
        snapToInterval={lebar}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 10,
  },
});
