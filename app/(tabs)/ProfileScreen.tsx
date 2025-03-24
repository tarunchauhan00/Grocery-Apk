import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../components/supabase';

const ProfileScreen = () => {
  // Profile fields
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [availableAvatars, setAvailableAvatars] = useState<any[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Logged-in user's ID
  const [userId, setUserId] = useState<string | null>(null);

  // Default profile image (local asset)
  const defaultProfileImage = require('@/assets/images/user-icon.png');

  // React Navigation
  const navigation = useNavigation();

  useEffect(() => {
    fetchSessionAndProfile();
    fetchAvailableAvatars();
  }, []);

  // 1. Fetch user & profile from Supabase
  const fetchSessionAndProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert('Error', 'No user logged in.');
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Fetch profile data from 'profiles' table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setUsername(data.username || '');
        setAddress(data.address || '');
        setMobile(data.mobile || '');
        setAlternateMobile(data.alternate_mobile || '');
        if (data.profile_image) {
          setProfileImage(data.profile_image);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch available avatars from Supabase
  const fetchAvailableAvatars = async () => {
    try {
      const { data, error } = await supabase.from('avatars').select('*');
      if (error) throw error;
      setAvailableAvatars(data);
    } catch (err: any) {
      Alert.alert('Error fetching avatars', err.message);
    }
  };

  // 3. Upsert the profile in Supabase (including profile_image)
  const handleSaveProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'No user ID found. Please log in again.');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            username,
            address,
            mobile,
            alternate_mobile: alternateMobile,
            profile_image: profileImage, // Save the chosen avatar URL
          },
          { onConflict: 'user_id' }
        )
        .select();

      if (error) throw error;

      Alert.alert('Success', 'Profile updated!');
      await fetchSessionAndProfile(); // Re-fetch to confirm
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert('Error saving profile', err.message);
      console.error('handleSaveProfile error:', err);
    } finally {
      setUpdating(false);
    }
  };

  // 4. Handle avatar selection from available avatars
  const handleAvatarSelect = (avatarUrl: string) => {
    setProfileImage(avatarUrl);
  };

  // 5. Logout functionality
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.replace('Login');
    } catch (err) {
      console.error('Error logging out:', err);
      Alert.alert('Error', 'Unable to logout at this time.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.avatarWrapper}>
          <Image
            source={
              profileImage ? { uri: profileImage } : defaultProfileImage
            }
            style={styles.avatar}
          />
        </View>
        <Text style={styles.headerUsername}>
          {username || 'Your Name'}
        </Text>
      </View>

      {/* Show avatar selection only in edit mode */}
      {isEditing && (
        <View style={styles.avatarSelection}>
          <Text style={styles.sectionTitle}>Select an Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableAvatars.map((avatar: any) => (
              <TouchableOpacity
                key={avatar.id}
                onPress={() => handleAvatarSelect(avatar.image_url)}
              >
                <Image
                  source={{ uri: avatar.image_url }}
                  style={styles.avatarOption}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Text style={styles.cardTitle}>Personal Details</Text>

        {/* Username Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Username</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={username}
              onChangeText={setUsername}
            />
          ) : (
            <Text style={styles.valueText}>{username || 'Not set'}</Text>
          )}
        </View>

        {/* Address Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Address</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
              multiline
            />
          ) : (
            <Text style={styles.valueText}>{address || 'Not set'}</Text>
          )}
        </View>

        {/* Mobile Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Mobile Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              placeholder="Enter your mobile number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.valueText}>{mobile || 'Not set'}</Text>
          )}
        </View>

        {/* Alternate Mobile Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Alternate Mobile</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              placeholder="Enter your alternate mobile number"
              value={alternateMobile}
              onChangeText={setAlternateMobile}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.valueText}>{alternateMobile || 'Not set'}</Text>
          )}
        </View>

        {/* Edit / Save / Cancel Buttons */}
        {isEditing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveProfile}
              disabled={updating}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        {updating && (
          <ActivityIndicator style={{ marginTop: 10 }} size="large" color="#000" />
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.actionButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    backgroundColor: '#4CAF50',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerUsername: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  avatarSelection: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  avatarOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginRight: 5,
  },
  cancelButton: { 
    backgroundColor: '#f44336',
    flex: 1,
    marginLeft: 5,
  },
  logoutButton: {
    backgroundColor: '#9e160d',
    marginHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
});
