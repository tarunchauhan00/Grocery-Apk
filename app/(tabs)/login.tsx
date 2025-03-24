import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../components/supabase';
import { useNavigation } from '@react-navigation/native';

export default function AuthScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle Login
  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Login Failed', error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      Alert.alert('Login Error', 'User not found. Please check your email confirmation.');
      setLoading(false);
      return;
    }

    // Ensure email is confirmed
    if (!data.user.email_confirmed_at) {
      Alert.alert('Email Not Confirmed', 'Please confirm your email before logging in.');
      setLoading(false);
      return;
    }

    // Fetch user role (defaults to 'user' if not found)
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const userRole = userData?.role || 'user';
    Alert.alert('Login Successful', `Welcome, ${userRole}!`);

    // Redirect based on role using React Navigation
    if (userRole === 'admin') {
      navigation.replace('AdminPanel');
    } else {
      navigation.replace('Main');
    }

    setLoading(false);
  };

  // Handle Sign Up
  const handleSignUp = async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert('Signup Failed', error.message);
      setLoading(false);
      return;
    }

    Alert.alert('Success', 'Account created! Check your email for confirmation.');
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Sign Up' : 'Login'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={isSignUp ? 'Sign Up' : 'Login'}
        onPress={isSignUp ? handleSignUp : handleLogin}
        disabled={loading}
      />

      <View style={styles.switchTextContainer}>
        <Text>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</Text>
        <Button
          title={isSignUp ? 'Login here' : 'Sign Up here'}
          onPress={() => setIsSignUp(!isSignUp)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 16, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    marginBottom: 12, 
    borderRadius: 5, 
    width: '100%' 
  },
  switchTextContainer: { 
    marginTop: 12, 
    alignItems: 'center' 
  },
});
