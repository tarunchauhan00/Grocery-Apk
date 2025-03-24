// components/CustomDrawerContent.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';

const CustomDrawerContent = (props: any) => {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.headerContainer}>
        {/* Render the image */}
        <Image
          source={require('../../assets/images/react-logo.png')} // Adjust the path as needed
          style={styles.logo}
          resizeMode="contain"
        />
        {/* Render the title */}
        <Text style={styles.headerTitle}>ChauhanMarket</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
    alignItems: 'center', // Center the content
  },
  logo: {
    width: 80,       // Adjust size as needed
    height: 80,      // Adjust size as needed
    marginBottom: 10, // Space between image and title
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;
