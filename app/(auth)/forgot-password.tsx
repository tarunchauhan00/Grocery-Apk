import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Enter email', 'Please enter your registered email address.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-8">
        <Text className="text-green-600 font-medium text-base">← Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-gray-800 mb-2">Forgot Password</Text>
      <Text className="text-gray-500 mb-8">
        Enter your email and we'll send you a reset link.
      </Text>

      {sent ? (
        <View className="items-center py-8">
          <Text className="text-5xl mb-4">📬</Text>
          <Text className="text-xl font-bold text-gray-800 mb-2">Email sent!</Text>
          <Text className="text-gray-500 text-center mb-8">
            Check your inbox for the password reset link.
          </Text>
          <Button title="Back to Login" onPress={() => router.replace('/(auth)/login')} variant="outline" />
        </View>
      ) : (
        <>
          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button title="Send Reset Link" onPress={handleReset} loading={loading} fullWidth size="lg" />
        </>
      )}
    </SafeAreaView>
  );
}
