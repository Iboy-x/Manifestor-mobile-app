import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../app/firebaseConfig';
import { Dream } from '../components/DreamCard';

export interface DreamData {
  id?: string;
  title: string;
  description: string;
  type: 'short-term' | 'long-term';
  category: string;
  targetDate: string;
  progress: number;
  daysLeft: number;
  status: string;
  tasks: string;
  subtask?: string;
  completed: boolean;
  checklist: any[];
  createdAt: Date;
  updatedAt: Date;
}

// Convert Dream to DreamData
const convertToDreamData = (dream: Dream, userId: string): Omit<DreamData, 'id'> => {
  return {
    title: dream.title,
    description: dream.description,
    type: dream.type === 'short term' ? 'short-term' : 'long-term', // Convert to database format
    category: dream.category,
    targetDate: new Date().toISOString().split('T')[0], // Default to today
    progress: dream.progress,
    daysLeft: dream.daysLeft,
    status: dream.status,
    tasks: dream.tasks,
    subtask: dream.subtask,
    completed: dream.completed,
    checklist: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Convert DreamData to Dream
const convertToDream = (dreamData: DreamData, docId: string): Dream => {
  // Convert Firebase Timestamp to Date if needed
  const createdAt = dreamData.createdAt instanceof Timestamp 
    ? dreamData.createdAt.toDate() 
    : dreamData.createdAt || new Date();

  // Use the document ID as a string to avoid conversion issues
  const dreamId = docId || '0';

  return {
    id: dreamId, // Keep as string to avoid conversion issues
    title: dreamData.title || 'Untitled Dream',
    description: dreamData.description || dreamData.subtask || 'No description available',
    type: dreamData.type === 'short-term' ? 'short term' : 'long term', // Convert to UI format
    category: dreamData.category || 'everything',
    progress: typeof dreamData.progress === 'number' ? Math.max(0, Math.min(100, dreamData.progress)) : 0,
    daysLeft: typeof dreamData.daysLeft === 'number' ? Math.max(0, dreamData.daysLeft) : 0,
    status: dreamData.status || 'In progress',
    tasks: dreamData.tasks || '0 of 0 tasks',
    subtask: dreamData.subtask,
    completed: Boolean(dreamData.completed),
    createdAt,
    checklist: dreamData.checklist || [],
  };
};

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
      });
    }
  }
  
  return userRef;
};

// Add a new dream
export const addDream = async (dreamData: Omit<DreamData, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    console.log('Adding dream for user:', user.uid);
    console.log('Dream data:', dreamData);

    // Get or create user document
    const userRef = await getUserDocument(user.uid);
    
    // Add dream to user's dreams sub-collection
    const dreamsCollectionRef = collection(userRef, 'dreams');
    
    const dreamWithTimestamps = {
      ...dreamData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Saving dream with data:', dreamWithTimestamps);

    const docRef = await addDoc(dreamsCollectionRef, dreamWithTimestamps);
    console.log('Dream created with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding dream:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to add dream: ${error.message}`);
    }
    throw new Error('Failed to add dream. Please try again.');
  }
};

// Get all dreams for current user
export const getDreams = (callback: (dreams: Dream[]) => void) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      callback([]);
      return () => {}; // Return empty cleanup function
    }

    console.log('Getting dreams for user:', user.uid);

    // Reference to user's dreams sub-collection
    const userRef = doc(db, 'users', user.uid);
    const dreamsCollectionRef = collection(userRef, 'dreams');

    return onSnapshot(dreamsCollectionRef, 
      (querySnapshot) => {
        const dreams: Dream[] = [];
        console.log('Received dreams snapshot with', querySnapshot.size, 'documents');
        
        querySnapshot.forEach((doc) => {
          try {
            console.log('Processing dream document:', doc.id);
            const data = doc.data() as DreamData;
            console.log('Dream data:', data);
            
            const dream = convertToDream(data, doc.id);
            console.log('Converted dream:', dream);
            
            dreams.push(dream);
          } catch (error) {
            console.error('Error processing dream document:', error);
            // Skip invalid documents
          }
        });
        
        // Sort by createdAt in descending order (newest first)
        dreams.sort((a, b) => {
          const aDate = a.createdAt || new Date(0);
          const bDate = b.createdAt || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
        
        console.log('Returning', dreams.length, 'dreams');
        callback(dreams);
      },
      (error) => {
        console.error('Error in dreams listener:', error);
        
        // Check if it's an index error and provide helpful message
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
          console.warn('Firebase index not ready. This is normal for new projects and will resolve automatically.');
          // Return empty array but don't show error to user
          callback([]);
        } else {
          callback([]);
        }
      }
    );
  } catch (error) {
    console.error('Error getting dreams:', error);
    callback([]);
    return () => {}; // Return empty cleanup function
  }
};

// Update a dream
export const updateDream = async (dreamId: string, updates: Partial<DreamData>) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userRef = doc(db, 'users', user.uid);
    const dreamRef = doc(userRef, 'dreams', dreamId);
    
    await updateDoc(dreamRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating dream:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to update dream: ${error.message}`);
    }
    throw new Error('Failed to update dream. Please try again.');
  }
};

// Delete a dream
export const deleteDream = async (dreamId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userRef = doc(db, 'users', user.uid);
    const dreamRef = doc(userRef, 'dreams', dreamId);
    
    await deleteDoc(dreamRef);
  } catch (error) {
    console.error('Error deleting dream:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete dream: ${error.message}`);
    }
    throw new Error('Failed to delete dream. Please try again.');
  }
};

// Toggle dream completion status
export const toggleDreamCompletion = async (dreamId: string, completed: boolean) => {
  try {
    await updateDream(dreamId, { completed });
  } catch (error) {
    console.error('Error toggling dream completion:', error);
    throw error;
  }
};

// Update dream progress
export const updateDreamProgress = async (dreamId: string, progress: number) => {
  try {
    await updateDream(dreamId, { progress });
  } catch (error) {
    console.error('Error updating dream progress:', error);
    throw error;
  }
};

// Get dreams by category
export const getDreamsByCategory = (category: string, callback: (dreams: Dream[]) => void) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      callback([]);
      return () => {}; // Return empty cleanup function
    }

    const userRef = doc(db, 'users', user.uid);
    const dreamsCollectionRef = collection(userRef, 'dreams');

    const q = query(
      dreamsCollectionRef,
      where('category', '==', category)
    );

    return onSnapshot(q, 
      (querySnapshot) => {
        const dreams: Dream[] = [];
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data() as DreamData;
            dreams.push(convertToDream(data, doc.id));
          } catch (error) {
            console.error('Error processing dream document:', error);
            // Skip invalid documents
          }
        });
        
        // Sort by createdAt in descending order
        dreams.sort((a, b) => {
          const aDate = a.createdAt || new Date(0);
          const bDate = b.createdAt || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
        
        callback(dreams);
      },
      (error) => {
        console.error('Error in category dreams listener:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error getting dreams by category:', error);
    callback([]);
    return () => {}; // Return empty cleanup function
  }
};

// Get dreams by type (short term / long term)
export const getDreamsByType = (type: 'short term' | 'long term', callback: (dreams: Dream[]) => void) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      callback([]);
      return () => {}; // Return empty cleanup function
    }

    const userRef = doc(db, 'users', user.uid);
    const dreamsCollectionRef = collection(userRef, 'dreams');

    const q = query(
      dreamsCollectionRef,
      where('type', '==', type)
    );

    return onSnapshot(q, 
      (querySnapshot) => {
        const dreams: Dream[] = [];
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data() as DreamData;
            dreams.push(convertToDream(data, doc.id));
          } catch (error) {
            console.error('Error processing dream document:', error);
            // Skip invalid documents
          }
        });
        
        // Sort by createdAt in descending order
        dreams.sort((a, b) => {
          const aDate = a.createdAt || new Date(0);
          const bDate = b.createdAt || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
        
        callback(dreams);
      },
      (error) => {
        console.error('Error in type dreams listener:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error getting dreams by type:', error);
    callback([]);
    return () => {}; // Return empty cleanup function
  }
}; 