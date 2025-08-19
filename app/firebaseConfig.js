import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDEAuBmiq3Wz77rMBL_FTpNxq3fBZvuw8I",
  authDomain: "manifestor-df56e.firebaseapp.com",
  projectId: "manifestor-df56e",
  storageBucket: "manifestor-df56e.firebasestorage.app",
  messagingSenderId: "160306240167",
  appId: "1:160306240167:web:2060462007052e06721982"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

export { auth, db };
export default firebaseConfig;  