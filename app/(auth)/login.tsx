import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleButton } from '@/components/ui/GoogleButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await authService.signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
      // Root layout's onAuthStateChange handles redirect
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
          {/* Header */}
          <View className="bg-green-600 px-6 pt-12 pb-16 items-center">
            <Text className="text-4xl font-bold text-white">🛒</Text>
            <Text className="text-3xl font-bold text-white mt-2">SwiftMart</Text>
            <Text className="text-green-100 mt-1">Groceries in 30 minutes</Text>
          </View>

          {/* Card */}
          <View className="flex-1 bg-white rounded-t-3xl -mt-6 px-6 pt-8">
            <Text className="text-2xl font-bold text-gray-800 mb-1">Welcome back</Text>
            <Text className="text-gray-500 mb-6">Sign in to continue shopping</Text>

            {/* Google Sign-In */}
            <GoogleButton
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={loading}
            />

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="text-gray-400 text-sm mx-3">or sign in with email</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

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
              placeholder="••••••••"
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

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} className="mb-6">
              <Text className="text-green-600 text-sm font-medium text-right">Forgot password?</Text>
            </TouchableOpacity>

            <Button title="Sign In" onPress={handleLogin} loading={loading} disabled={googleLoading} fullWidth size="lg" />

            <View className="flex-row justify-center mt-6 mb-8">
              <Text className="text-gray-500">Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-green-600 font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
