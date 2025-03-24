// components/Sidebar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Sidebar = () => {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.item}>Dashboard</Text>
      <Text style={styles.item}>Profile</Text>
      <Text style={styles.item}>Settings</Text>
      {/* Add more navigation items as needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 200,
    backgroundColor: '#f2f2f2',
    padding: 16,
  },
  item: {
    marginVertical: 10,
    fontSize: 16,
  },
});

export default Sidebar;
