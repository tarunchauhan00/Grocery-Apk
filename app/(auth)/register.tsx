import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleButton } from '@/components/ui/GoogleButton';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { session } = await authService.signUp(email.trim().toLowerCase(), password, fullName.trim());
      if (!session) {
        Alert.alert('Check your email', 'We sent a verification link. Please verify before logging in.');
        router.replace('/(auth)/login');
      }
    } catch (e: any) {
      Alert.alert('Registration failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (e: any) {
      if (e.message !== 'Google sign-in was cancelled') {
        Alert.alert('Google sign-in failed', e.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="bg-green-600 px-6 pt-12 pb-16 items-center">
            <Text className="text-4xl font-bold text-white">🛒</Text>
            <Text className="text-3xl font-bold text-white mt-2">SwiftMart</Text>
            <Text className="text-green-100 mt-1">Groceries in 30 minutes</Text>
          </View>

          <View className="flex-1 bg-white rounded-t-3xl -mt-6 px-6 pt-8">
            <Text className="text-2xl font-bold text-gray-800 mb-1">Create account</Text>
            <Text className="text-gray-500 mb-6">Join thousands of happy shoppers</Text>

            {/* Google Sign-Up */}
            <GoogleButton
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={loading}
            />

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="text-gray-400 text-sm mx-3">or sign up with email</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <Input
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
            />
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Password"
              placeholder="Minimum 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <Text className="text-green-600 text-sm font-medium">
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              }
              onRightIconPress={() => setShowPassword((p) => !p)}
            />
            <Input
              label="Confirm Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              disabled={googleLoading}
              fullWidth
              size="lg"
            />

            <View className="flex-row justify-center mt-6 mb-8">
              <Text className="text-gray-500">Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-green-600 font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
