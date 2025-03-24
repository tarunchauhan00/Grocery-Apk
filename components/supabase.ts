import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynwjscodckypnrqmamop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlud2pzY29kY2t5cG5ycW1hbW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyMTQ5NjksImV4cCI6MjA1Mzc5MDk2OX0.Fscp7nm2UQSEb_z2VSvt6NseEs9jtXlgLaJjfpfEeAs';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,           // Use AsyncStorage for React Native
    persistSession: true,
    detectSessionInUrl: false,        // Disable URL detection for native apps
  },
});

// Handle user login
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

// Handle user signup
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

// Get the current user using the updated API
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  return user;
};
