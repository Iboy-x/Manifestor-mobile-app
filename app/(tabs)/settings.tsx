import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  configureNotifications,
  dateToHHMM,
  getSavedNotificationSettings,
  saveNotificationSettings,
  scheduleDailyNotifications,
} from '../../services/notificationService';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import CustomPopup from '../../components/CustomPopup';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [timeOne, setTimeOne] = useState<Date>(new Date());
  const [timeTwo, setTimeTwo] = useState<Date>(new Date(new Date().getTime() + 6 * 60 * 60 * 1000));
  const [showPicker1, setShowPicker1] = useState(false);
  const [showPicker2, setShowPicker2] = useState(false);
  const [userName, setUserName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const usernameLoadedRef = useRef(false);
  
  // Custom popup states
  const [showSaveNotifPopup, setShowSaveNotifPopup] = useState(false);
  const [showSaveNamePopup, setShowSaveNamePopup] = useState(false);
  const [showSignOutPopup, setShowSignOutPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');

  // Function to fetch user data from Firestore
  const fetchUserData = async () => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Use saved displayName from Firestore, fallback to Firebase Auth displayName, then email
        const savedName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User';
        // Only update if the username is different or hasn't been set
        if (userName !== savedName || !usernameLoadedRef.current) {
          setUserName(savedName);
          usernameLoadedRef.current = true;
        }
      } else {
        // If no Firestore document exists, create one with default values
        const defaultName = user?.displayName || user?.email?.split('@')[0] || 'User';
        // Only update if the username is different or hasn't been set
        if (userName !== defaultName || !usernameLoadedRef.current) {
          setUserName(defaultName);
          usernameLoadedRef.current = true;
        }
        // Create the user document
        await setDoc(userRef, { 
          displayName: defaultName,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to basic user info
      const fallbackName = user?.displayName || user?.email?.split('@')[0] || 'User';
      // Only update if the username is different or hasn't been set
      if (userName !== fallbackName || !usernameLoadedRef.current) {
        setUserName(fallbackName);
        usernameLoadedRef.current = true;
      }
    }
  };

  useEffect(() => {
    configureNotifications();
    (async () => {
      const saved = await getSavedNotificationSettings();
      if (saved) {
        setNotifEnabled(saved.enabled);
        if (saved.times?.[0]) {
          const [h1, m1] = saved.times[0].split(':').map((v) => parseInt(v, 10));
          const d1 = new Date(); d1.setHours(h1 || 0, m1 || 0, 0, 0);
          setTimeOne(d1);
        }
        if (saved.times?.[1]) {
          const [h2, m2] = saved.times[1].split(':').map((v) => parseInt(v, 10));
          const d2 = new Date(); d2.setHours(h2 || 0, m2 || 0, 0, 0);
          setTimeTwo(d2);
        }
      }
      
      // Only fetch user data if it hasn't been loaded yet
      if (!usernameLoadedRef.current) {
        await fetchUserData();
      }
    })();
  }, [user?.uid]); // Only depend on user.uid, not the entire user object

  const handleSaveNotifications = async () => {
    try {
      const times = [dateToHHMM(timeOne), dateToHHMM(timeTwo)];
      await saveNotificationSettings({ enabled: notifEnabled, times });
      if (notifEnabled) {
        await scheduleDailyNotifications(userName, times);
      }
      setPopupMessage('Notification preferences updated successfully!');
      setPopupType('success');
      setShowSaveNotifPopup(true);
    } catch {
      setPopupMessage('Failed to save notifications. Please try again.');
      setPopupType('error');
      setShowSaveNotifPopup(true);
    }
  };

  const handleSaveUserName = async () => {
    if (!userName.trim()) {
      setPopupMessage('User name cannot be empty');
      setPopupType('error');
      setShowSaveNamePopup(true);
      return;
    }
    
    try {
      const userRef = doc(db, 'users', user!.uid);
      await updateDoc(userRef, { 
        displayName: userName.trim(),
        updatedAt: new Date()
      });
      
      // Verify the save was successful by fetching the updated data
      await fetchUserData();
      
      setEditingName(false);
      setPopupMessage('User name updated successfully!');
      setPopupType('success');
      setShowSaveNamePopup(true);
    } catch (error) {
      console.error('Error saving username:', error);
      setPopupMessage('Failed to save user name. Please try again.');
      setPopupType('error');
      setShowSaveNamePopup(true);
    }
  };

  const handleSignOut = () => {
    setShowSignOutPopup(true);
  };

  const confirmSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch {
      setPopupMessage('Failed to sign out. Please try again.');
      setPopupType('error');
      setShowSaveNamePopup(true);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
          </View>

          {/* User Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Feather name="user" size={24} color="#ffd600" />
              </View>
              <View style={styles.userInfo}>
                {editingName ? (
                  <View style={styles.nameEditContainer}>
                    <TextInput
                      style={styles.nameInput}
                      value={userName}
                      onChangeText={setUserName}
                      placeholder="Enter your name"
                      placeholderTextColor="#666"
                      autoFocus
                    />
                    <View style={styles.nameEditButtons}>
                      <TouchableOpacity style={styles.nameEditButton} onPress={handleSaveUserName}>
                        <Feather name="check" size={16} color="#ffd600" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.nameEditButton} onPress={() => {
                        setEditingName(false);
                        // Reset to the saved name from Firestore
                        fetchUserData();
                      }}>
                        <Feather name="x" size={16} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.nameContainer} onPress={() => setEditingName(true)}>
                    <Text style={styles.userName}>{userName}</Text>
                    <Feather name="edit-2" size={16} color="#666" style={styles.editIcon} />
                  </TouchableOpacity>
                )}
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>

          {/* Settings Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            {/* Notifications */}
            <View style={styles.settingItem}>
              <Feather name="bell" size={20} color="#b3b3b3" />
              <Text style={styles.settingText}>Notifications</Text>
              <Switch 
                value={notifEnabled} 
                onValueChange={setNotifEnabled}
                trackColor={{ false: '#353535', true: '#ffd600' }}
                thumbColor={notifEnabled ? '#000' : '#fff'}
              />
            </View>

            {notifEnabled && (
              <>
                <View style={styles.timeSection}>
                  <Text style={styles.timeSectionTitle}>Reminder Times</Text>
                  <View style={styles.inlineSettingRow}>
                    <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker1(true)}>
                      <Feather name="clock" size={16} color="#b3b3b3" />
                      <Text style={styles.timeText}>First: {timeOne.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker2(true)}>
                      <Feather name="clock" size={16} color="#b3b3b3" />
                      <Text style={styles.timeText}>Second: {timeTwo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>
                  </View>

                  {showPicker1 && (
                    <DateTimePicker
                      value={timeOne}
                      mode="time"
                      display="default"
                      onChange={(_, d) => { setShowPicker1(false); if (d) setTimeOne(d); }}
                    />
                  )}
                  {showPicker2 && (
                    <DateTimePicker
                      value={timeTwo}
                      mode="time"
                      display="default"
                      onChange={(_, d) => { setShowPicker2(false); if (d) setTimeTwo(d); }}
                    />
                  )}

                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveNotifications}>
                    <Feather name="save" size={16} color="#000" />
                    <Text style={styles.saveButtonText}>Save Notification Times</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.settingItem}>
              <Feather name="sun" size={20} color="#b3b3b3" />
              <Text style={styles.settingText}>Light Mode</Text>
              <Feather name="chevron-right" size={20} color="#b3b3b3" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <Feather name="help-circle" size={20} color="#b3b3b3" />
              <Text style={styles.settingText}>Help & Support</Text>
              <Feather name="chevron-right" size={20} color="#b3b3b3" />
            </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Feather name="log-out" size={20} color="#ff4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Custom Popups */}
      <CustomPopup
        visible={showSaveNotifPopup}
        title={popupType === 'success' ? 'Success' : 'Error'}
        message={popupMessage}
        type={popupType}
        onConfirm={() => setShowSaveNotifPopup(false)}
      />

      <CustomPopup
        visible={showSaveNamePopup}
        title={popupType === 'success' ? 'Success' : 'Error'}
        message={popupMessage}
        type={popupType}
        onConfirm={() => setShowSaveNamePopup(false)}
      />

      <CustomPopup
        visible={showSignOutPopup}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        type="warning"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={confirmSignOut}
        onCancel={() => setShowSignOutPopup(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#b3b3b3',
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#232326',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#353535',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  editIcon: {
    marginLeft: 4,
  },
  nameEditContainer: {
    marginBottom: 4,
  },
  nameInput: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#353535',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  nameEditButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  nameEditButton: {
    backgroundColor: '#353535',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  userEmail: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232326',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  timeSection: {
    backgroundColor: '#232326',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  timeSectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  inlineSettingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#353535',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
    gap: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#ffd600',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232326',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  signOutText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
}); 