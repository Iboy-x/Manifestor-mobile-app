import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  where,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../app/firebaseConfig';

export interface ReflectionData {
  content: string;
  date: string;
  dreamIds: string[];
  productivityRating: number;
}

export interface Reflection {
  id: string;
  content: string;
  date: string;
  dreamIds: string[];
  productivityRating: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReflectionDate: string;
  totalReflections: number;
}

// Get or create user document
const getUserDocument = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    // Create user document if it doesn't exist
    const user = auth.currentUser;
    if (user) {
      await setDoc(userRef, {
        displayName: user.displayName || '',
        email: user.email || '',
        emailVerified: user.emailVerified || false,
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          lastReflectionDate: null,
          totalReflections: 0
        }
      });
    }
  }
  
  return userRef;
};

// Calculate streak based on reflection dates
const calculateStreak = (reflections: Reflection[]): StreakData => {
  if (reflections.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastReflectionDate: '',
      totalReflections: 0
    };
  }

  // Sort reflections by date (newest first)
  const sortedReflections = reflections.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastReflectionDate = '';

  // Check if there's a reflection for today
  const todayReflection = sortedReflections.find(reflection => {
    const reflectionDate = new Date(reflection.date);
    reflectionDate.setHours(0, 0, 0, 0);
    return reflectionDate.getTime() === today.getTime();
  });

  if (todayReflection) {
    lastReflectionDate = todayReflection.date;
    currentStreak = 1;
    tempStreak = 1;
  }

  // Calculate streak by checking consecutive days
  let expectedDate = todayReflection ? yesterday : today;
  
  for (let i = 0; i < sortedReflections.length; i++) {
    const reflection = sortedReflections[i];
    const reflectionDate = new Date(reflection.date);
    reflectionDate.setHours(0, 0, 0, 0);

    // Skip if we've already counted today's reflection
    if (i === 0 && todayReflection) {
      continue;
    }

    // Check if this reflection is for the expected date
    if (reflectionDate.getTime() === expectedDate.getTime()) {
      tempStreak++;
      currentStreak = tempStreak;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (reflectionDate.getTime() < expectedDate.getTime()) {
      // We found a gap, reset streak
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      tempStreak = 0;
      expectedDate = new Date(reflectionDate);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      // This reflection is older than expected, skip it
      continue;
    }
  }

  // Update longest streak if current streak is longer
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    lastReflectionDate: lastReflectionDate || (sortedReflections[0]?.date || ''),
    totalReflections: reflections.length
  };
};

// Update user's streak data
const updateUserStreak = async (userId: string, streakData: StreakData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      streak: streakData
    });
  } catch (error) {
    console.error('Error updating streak:', error);
  }
};

// Add a new reflection
export const addReflection = async (reflectionData: ReflectionData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    console.log('Adding reflection for user:', user.uid);
    console.log('Reflection data:', reflectionData);

    // Get or create user document
    const userRef = await getUserDocument(user.uid);
    
    // Add reflection to user's reflections sub-collection
    const reflectionsCollectionRef = collection(userRef, 'reflections');
    
    const reflectionWithTimestamp = {
      ...reflectionData,
      date: new Date().toISOString(),
    };

    console.log('Saving reflection with data:', reflectionWithTimestamp);

    const docRef = await addDoc(reflectionsCollectionRef, reflectionWithTimestamp);
    console.log('Reflection created with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding reflection:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to add reflection: ${error.message}`);
    }
    throw new Error('Failed to add reflection. Please try again.');
  }
};

// Get all reflections for current user
export const getReflections = (callback: (reflections: Reflection[]) => void) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      callback([]);
      return () => {}; // Return empty cleanup function
    }

    console.log('Getting reflections for user:', user.uid);

    // Reference to user's reflections sub-collection
    const userRef = doc(db, 'users', user.uid);
    const reflectionsCollectionRef = collection(userRef, 'reflections');

    return onSnapshot(reflectionsCollectionRef, 
      (querySnapshot) => {
        const reflections: Reflection[] = [];
        console.log('Received reflections snapshot with', querySnapshot.size, 'documents');
        
        querySnapshot.forEach((doc) => {
          try {
            console.log('Processing reflection document:', doc.id);
            const data = doc.data() as ReflectionData;
            console.log('Dream data:', data);
            
            const reflection: Reflection = {
              id: doc.id,
              content: data.content || '',
              date: data.date || new Date().toISOString(),
              dreamIds: data.dreamIds || [],
              productivityRating: data.productivityRating || 0,
            };
            
            console.log('Converted reflection:', reflection);
            reflections.push(reflection);
          } catch (error) {
            console.error('Error processing reflection document:', error);
            // Skip invalid documents
          }
        });
        
        // Sort by date in descending order (newest first)
        reflections.sort((a, b) => {
          const aDate = new Date(a.date);
          const bDate = new Date(b.date);
          return bDate.getTime() - aDate.getTime();
        });
        
        console.log('Returning', reflections.length, 'reflections');
        callback(reflections);
      },
      (error) => {
        console.error('Error in reflections listener:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error getting reflections:', error);
    callback([]);
    return () => {}; // Return empty cleanup function
  }
};

// Get streak data for current user
export const getStreakData = (callback: (streakData: StreakData) => void) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      callback({
        currentStreak: 0,
        longestStreak: 0,
        lastReflectionDate: '',
        totalReflections: 0
      });
      return () => {};
    }

    console.log('Getting streak data for user:', user.uid);

    // Reference to user's reflections sub-collection
    const userRef = doc(db, 'users', user.uid);
    const reflectionsCollectionRef = collection(userRef, 'reflections');

    return onSnapshot(reflectionsCollectionRef, 
      (querySnapshot) => {
        const reflections: Reflection[] = [];
        
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data() as ReflectionData;
            const reflection: Reflection = {
              id: doc.id,
              content: data.content || '',
              date: data.date || new Date().toISOString(),
              dreamIds: data.dreamIds || [],
              productivityRating: data.productivityRating || 0,
            };
            reflections.push(reflection);
          } catch (error) {
            console.error('Error processing reflection document for streak:', error);
          }
        });
        
        // Calculate streak based on reflections
        const streakData = calculateStreak(reflections);
        console.log('Calculated streak data:', streakData);
        
        // Update user's streak data in Firestore
        updateUserStreak(user.uid, streakData);
        
        callback(streakData);
      },
      (error) => {
        console.error('Error in streak listener:', error);
        callback({
          currentStreak: 0,
          longestStreak: 0,
          lastReflectionDate: '',
          totalReflections: 0
        });
      }
    );
  } catch (error) {
    console.error('Error getting streak data:', error);
    callback({
      currentStreak: 0,
      longestStreak: 0,
      lastReflectionDate: '',
      totalReflections: 0
    });
    return () => {};
  }
}; 