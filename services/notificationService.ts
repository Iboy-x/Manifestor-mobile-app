import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../app/firebaseConfig';

type SavedNotificationSettings = {
  enabled: boolean;
  times: string[]; // ['HH:MM', 'HH:MM'] in 24h
};

export async function configureNotifications(): Promise<void> {
  // On Android, a channel is required to show notifications
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export function dateToHHMM(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function hhmmToHourMinute(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
  return { hour: h || 0, minute: m || 0 };
}

export async function getUserDisplayName(): Promise<string> {
  const user = auth.currentUser;
  if (!user) return 'there';
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const data = snap.data() as any;
    return data?.displayName || user.displayName || user.email?.split('@')[0] || 'there';
  } catch {
    return user.displayName || user.email?.split('@')[0] || 'there';
  }
}

export async function getSavedNotificationSettings(): Promise<SavedNotificationSettings | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data() as any;
  if (!data || !data.notifications) return null;
  return data.notifications as SavedNotificationSettings;
}

export async function saveNotificationSettings(settings: SavedNotificationSettings): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, { notifications: settings }, { merge: true });
  } else {
    await updateDoc(userRef, { notifications: settings });
  }
}

export async function clearScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function scheduleDailyNotifications(
  displayName: string | undefined,
  timesHHMM: string[],
): Promise<void> {
  await clearScheduledNotifications();
  // Ensure permissions
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const name = displayName || await getUserDisplayName();
  const bodies = [
    `Hey ${name}, how are your dreams going today? Keep your streak alive ✨`,
    `Quick check-in ${name} — made progress toward your dream yet? You've got this! ✨`,
  ];

  const uniqueTimes = Array.from(new Set(timesHHMM.filter(Boolean)));
  for (let i = 0; i < uniqueTimes.length; i++) {
    const { hour, minute } = hhmmToHourMinute(uniqueTimes[i]);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Manifestor',
        body: bodies[i % bodies.length],
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour, 
        minute, 
        repeats: true 
      },
    });
  }
}

export async function syncNotificationsFromServer(displayName?: string): Promise<void> {
  const settings = await getSavedNotificationSettings();
  if (!settings || !settings.enabled || !settings.times?.length) return;
  await scheduleDailyNotifications(displayName, settings.times);
}



