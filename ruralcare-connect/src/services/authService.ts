import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isMockMode } from './firebase';
import { mockAuth } from './mockDb';
import { User, UserRole, Doctor } from '../types';

let cachedUser: User | null = null;
const listeners: ((user: User | null) => void)[] = [];

const triggerListeners = (user: User | null) => {
  cachedUser = user;
  listeners.forEach(l => l(user));
};

// Initialize listener when using real Firebase
if (!isMockMode && auth && db) {
  onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as Omit<User, 'id'>;
          
          // Check if doctor is rejected
          if (userData.role === 'doctor') {
            const docDocRef = doc(db, 'doctors', firebaseUser.uid);
            const docSnapshot = await getDoc(docDocRef);
            if (docSnapshot.exists() && docSnapshot.data().verificationStatus === 'rejected') {
              console.warn("Doctor rejected. Signing out.");
              await firebaseSignOut(auth);
              triggerListeners(null);
              return;
            }
          }
          
          triggerListeners({ id: firebaseUser.uid, ...userData } as User);
        } else {
          // Fallback if auth exists but Firestore document was not created
          triggerListeners({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: 'patient',
            phone: '',
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Error fetching user profile from Firestore:", err);
        triggerListeners(null);
      }
    } else {
      triggerListeners(null);
    }
  });
}

export const authService = {
  subscribe: (callback: (user: User | null) => void) => {
    if (isMockMode) {
      return mockAuth.subscribe(callback);
    }
    listeners.push(callback);
    callback(cachedUser);
    return () => {
      const idx = listeners.indexOf(callback);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },

  getCurrentUser: (): User | null => {
    if (isMockMode) {
      return mockAuth.getCurrentUser();
    }
    return cachedUser;
  },

  signIn: async (email: string, password?: string): Promise<User> => {
    if (isMockMode) {
      return mockAuth.signIn(email, password);
    }
    
    if (!auth || !db) throw new Error("Firebase Auth not initialized");
    if (!password) throw new Error("Password is required for live login.");
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error("User record not found in database.");
    }
    
    const data = userDoc.data() as User;
    if (data.role === 'doctor') {
      const docProfile = await getDoc(doc(db, 'doctors', uid));
      if (docProfile.exists() && docProfile.data().verificationStatus === 'rejected') {
        await firebaseSignOut(auth);
        throw new Error("This doctor account has been rejected by the admin.");
      }
    }
    
    const fullUser = { ...data, id: uid } as User;
    triggerListeners(fullUser);
    return fullUser;
  },

  signUp: async (
    email: string,
    password?: string,
    name?: string,
    role?: 'patient' | 'doctor',
    phone?: string,
    village?: string,
    district?: string,
    state?: string,
    latitude?: number,
    longitude?: number
  ): Promise<User> => {
    if (isMockMode) {
      return mockAuth.signUp(email, password, name, role, phone, village, district, state, latitude, longitude);
    }

    if (!auth || !db) throw new Error("Firebase Auth not initialized");
    if (!password) throw new Error("Password is required for live registration.");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const newUser: Omit<User, 'id'> = {
      name: name || 'Demo User',
      email: email.toLowerCase(),
      role: role || 'patient',
      phone: phone || '',
      village,
      district,
      state,
      latitude,
      longitude,
      createdAt: new Date().toISOString()
    };

    // Create record in users collection
    await setDoc(doc(db, 'users', uid), newUser);

    // If signing up as doctor, create doctor detail record
    if (role === 'doctor') {
      const newDoctor: Doctor = {
        id: uid,
        name: newUser.name,
        specialty: 'General Medicine',
        qualifications: 'MBBS',
        experience: 1,
        hospitalId: 'hosp-3', // Default associated hospital
        city: district || 'Pune',
        state: state || 'Maharashtra',
        consultationFee: 200,
        teleconsultationAvailable: true,
        verificationStatus: 'pending',
        profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
        areasOfSpecialization: ['General Practitioner']
      };
      await setDoc(doc(db, 'doctors', uid), newDoctor);

      // Create default availability calendar
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + i);
        const dateStr = nextDate.toISOString().split('T')[0];
        const availId = `avail-${uid}-${i}`;
        await setDoc(doc(db, 'availability', availId), {
          doctorId: uid,
          date: dateStr,
          slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
        });
      }
    }

    const fullUser = { id: uid, ...newUser } as User;
    triggerListeners(fullUser);
    return fullUser;
  },

  signOut: async (): Promise<void> => {
    if (isMockMode) {
      return mockAuth.signOut();
    }
    if (!auth) return;
    await firebaseSignOut(auth);
    triggerListeners(null);
  },

  resetPassword: async (email: string): Promise<void> => {
    if (isMockMode) {
      console.log(`Mock mode password reset sent to ${email}`);
      return;
    }
    if (!auth) return;
    await firebaseSendPasswordResetEmail(auth, email);
  },

  updateProfile: async (updates: Partial<User>): Promise<User> => {
    if (isMockMode) {
      return mockAuth.updateProfile(updates);
    }

    if (!auth || !db || !cachedUser) throw new Error("Auth not initialized");

    const userDocRef = doc(db, 'users', cachedUser.id);
    await updateDoc(userDocRef, updates);

    if (cachedUser.role === 'doctor') {
      const docDocRef = doc(db, 'doctors', cachedUser.id);
      await updateDoc(docDocRef, { name: updates.name });
    }

    const updatedUser = { ...cachedUser, ...updates };
    triggerListeners(updatedUser);
    return updatedUser;
  }
};
