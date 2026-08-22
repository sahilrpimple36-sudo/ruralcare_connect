import {
  SEED_USERS,
  SEED_DOCTORS,
  SEED_HOSPITALS,
  SEED_APPOINTMENTS,
  SEED_CONSULTATIONS,
  SEED_AVAILABILITY,
  SEED_REFERRALS,
  SEED_HEALTH_ASSESSMENTS
} from './seedData';
import { User, Doctor, Hospital, Appointment, Availability, Consultation, MedicalReport, Notification, Feedback, Referral, HealthAssessment } from '../types';

export const MOCK_DB_EVENT = 'rc_mock_db_update';
export const notifyMockDbUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MOCK_DB_EVENT));
  }
};

// Helper to push updates to Vite local network sync server
const syncPushDoc = (collectionName: string, doc: any) => {
  if (typeof window === 'undefined') return;
  fetch(`/api/db/${collectionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc)
  }).catch(() => {});
};

const syncPushCollection = (collectionName: string, data: any[]) => {
  if (typeof window === 'undefined') return;
  fetch(`/api/db/${collectionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(() => {});
};

const syncDeleteDoc = (collectionName: string, id: string) => {
  if (typeof window === 'undefined') return;
  fetch(`/api/db/${collectionName}/${id}`, {
    method: 'DELETE'
  }).catch(() => {});
};

// Background syncer to pull changes made by other laptops/devices on the same Wi-Fi network
const syncPullAll = async () => {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/db');
    if (!res.ok) return;
    const serverDb = await res.json();
    if (!serverDb || typeof serverDb !== 'object') return;

    let hasChanges = false;
    Object.keys(serverDb).forEach(colName => {
      const serverItems = serverDb[colName];
      if (Array.isArray(serverItems)) {
        const localDataStr = localStorage.getItem(`rc_${colName}`);
        const serverDataStr = JSON.stringify(serverItems);
        if (localDataStr !== serverDataStr) {
          localStorage.setItem(`rc_${colName}`, serverDataStr);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      notifyMockDbUpdate();
      window.dispatchEvent(new CustomEvent('rc_mock_chat_update'));
      window.dispatchEvent(new CustomEvent('rc_mock_call_update'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {
    // Network error / server restarting
  }
};

// Helper to initialize local storage with seed data if not present
const initLocalStorage = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem('rc_users')) {
    localStorage.setItem('rc_users', JSON.stringify(SEED_USERS));
  }
  
  // Ensure doctors have coordinates
  const storedDoctors = localStorage.getItem('rc_doctors');
  if (!storedDoctors) {
    localStorage.setItem('rc_doctors', JSON.stringify(SEED_DOCTORS));
  } else {
    const parsed: Doctor[] = JSON.parse(storedDoctors);
    let updated = false;
    parsed.forEach(doc => {
      const seedMatch = SEED_DOCTORS.find(s => s.id === doc.id);
      if (seedMatch) {
        doc.name = seedMatch.name;
        doc.specialty = seedMatch.specialty;
        doc.qualifications = seedMatch.qualifications;
        doc.experience = seedMatch.experience;
        doc.hospitalId = seedMatch.hospitalId;
        doc.consultationFee = seedMatch.consultationFee;
        doc.teleconsultationAvailable = seedMatch.teleconsultationAvailable;
        doc.verificationStatus = seedMatch.verificationStatus;
        doc.profileImage = seedMatch.profileImage;
        doc.city = seedMatch.city;
        doc.state = seedMatch.state;
        doc.latitude = seedMatch.latitude;
        doc.longitude = seedMatch.longitude;
        doc.areasOfSpecialization = seedMatch.areasOfSpecialization;
        updated = true;
      }
    });
    SEED_DOCTORS.forEach(seedDoc => {
      if (!parsed.some(d => d.id === seedDoc.id)) {
        parsed.push(seedDoc);
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem('rc_doctors', JSON.stringify(parsed));
    }
  }

  // Ensure hospitals have coordinates and match seed
  const storedHospitals = localStorage.getItem('rc_hospitals');
  if (!storedHospitals) {
    localStorage.setItem('rc_hospitals', JSON.stringify(SEED_HOSPITALS));
  } else {
    const parsedHosp: Hospital[] = JSON.parse(storedHospitals);
    let updatedH = false;
    parsedHosp.forEach(h => {
      const seedMatch = SEED_HOSPITALS.find(s => s.id === h.id);
      if (seedMatch) {
        h.name = seedMatch.name;
        h.city = seedMatch.city;
        h.district = seedMatch.district;
        h.state = seedMatch.state;
        h.phone = seedMatch.phone;
        h.address = seedMatch.address;
        h.specialties = seedMatch.specialties;
        h.latitude = seedMatch.latitude;
        h.longitude = seedMatch.longitude;
        updatedH = true;
      }
    });
    SEED_HOSPITALS.forEach(seedHosp => {
      if (!parsedHosp.some(h => h.id === seedHosp.id)) {
        parsedHosp.push(seedHosp);
        updatedH = true;
      }
    });
    if (updatedH) {
      localStorage.setItem('rc_hospitals', JSON.stringify(parsedHosp));
    }
  }
  // Ensure all appointments exist and are up to date
  const storedAppts = localStorage.getItem('rc_appointments');
  if (!storedAppts) {
    localStorage.setItem('rc_appointments', JSON.stringify(SEED_APPOINTMENTS));
  } else {
    const parsedAppts: any[] = JSON.parse(storedAppts);
    let updatedA = false;
    SEED_APPOINTMENTS.forEach(seedAppt => {
      const existing = parsedAppts.find(a => a.id === seedAppt.id);
      if (!existing) {
        parsedAppts.push(seedAppt);
        updatedA = true;
      } else if (existing.doctorId === seedAppt.doctorId && existing.status !== 'confirmed') {
        existing.status = 'confirmed';
        existing.date = seedAppt.date;
        updatedA = true;
      }
    });
    if (updatedA) {
      localStorage.setItem('rc_appointments', JSON.stringify(parsedAppts));
    }
  }
  if (!localStorage.getItem('rc_consultations')) {
    localStorage.setItem('rc_consultations', JSON.stringify(SEED_CONSULTATIONS));
  }
  if (!localStorage.getItem('rc_availability')) {
    const allAvail: Availability[] = [];
    SEED_DOCTORS.forEach(doc => {
      allAvail.push(...SEED_AVAILABILITY(doc.id));
    });
    localStorage.setItem('rc_availability', JSON.stringify(allAvail));
  }
  if (!localStorage.getItem('rc_medicalReports')) {
    localStorage.setItem('rc_medicalReports', JSON.stringify([]));
  }
  if (!localStorage.getItem('rc_referrals') || JSON.parse(localStorage.getItem('rc_referrals') || '[]').length === 0) {
    localStorage.setItem('rc_referrals', JSON.stringify(SEED_REFERRALS));
  }
  if (!localStorage.getItem('rc_healthAssessments')) {
    localStorage.setItem('rc_healthAssessments', JSON.stringify(SEED_HEALTH_ASSESSMENTS));
  }
  if (!localStorage.getItem('rc_notifications')) {
    localStorage.setItem('rc_notifications', JSON.stringify([
      {
        id: 'notif-1',
        userId: 'pat-1',
        message: 'Welcome to RuralCare Connect. Find a specialist to start consultation.',
        type: 'appointment_confirmed',
        read: false,
        createdAt: new Date().toISOString()
      }
    ]));
  }
  if (!localStorage.getItem('rc_feedback')) {
    localStorage.setItem('rc_feedback', JSON.stringify([]));
  }
  if (!localStorage.getItem('rc_conversations')) {
    localStorage.setItem('rc_conversations', JSON.stringify([
      {
        id: 'conv_pat-1_doc-1',
        consultationId: 'RC-APT-2026-0001',
        participants: ['pat-1', 'doc-1'],
        participantDetails: {
          'pat-1': { name: 'Ramesh Sawant', role: 'patient' },
          'doc-1': { name: 'Dr. Priya Sharma', role: 'doctor', specialty: 'Oncology', status: 'available' }
        },
        lastMessage: 'Hello Dr. Sharma, I have uploaded my latest biopsy scan report.',
        lastMessageTimestamp: new Date().toISOString(),
        lastMessageSenderId: 'pat-1',
        unreadCount: { 'pat-1': 0, 'doc-1': 1 },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]));
  }
  if (!localStorage.getItem('rc_messages')) {
    localStorage.setItem('rc_messages', JSON.stringify([
      {
        id: 'msg-1',
        conversationId: 'conv_pat-1_doc-1',
        consultationId: 'RC-APT-2026-0001',
        senderId: 'doc-1',
        senderName: 'Dr. Priya Sharma',
        senderRole: 'doctor',
        receiverId: 'pat-1',
        message: 'Hello Ramesh, welcome to RuralCare Connect. Please share any symptoms you have been experiencing.',
        type: 'text',
        read: true,
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'msg-2',
        conversationId: 'conv_pat-1_doc-1',
        consultationId: 'RC-APT-2026-0001',
        senderId: 'pat-1',
        senderName: 'Ramesh Sawant',
        senderRole: 'patient',
        receiverId: 'doc-1',
        message: 'Hello Dr. Sharma, I have uploaded my latest biopsy scan report.',
        type: 'text',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]));
  }
  if (!localStorage.getItem('rc_calls')) {
    localStorage.setItem('rc_calls', JSON.stringify([]));
  }
  if (!localStorage.getItem('rc_callHistory')) {
    localStorage.setItem('rc_callHistory', JSON.stringify([
      {
        id: 'call-hist-1',
        consultationId: 'RC-APT-2026-0003',
        patientId: 'pat-1',
        patientName: 'Ramesh Sawant',
        doctorId: 'doc-3',
        doctorName: 'Dr. Amit Verma',
        doctorSpecialty: 'Neurology',
        callType: 'audio',
        startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        endTime: new Date(Date.now() - 86400000 * 2 + 1000 * 60 * 12).toISOString(),
        duration: 720, // 12 minutes
        status: 'completed',
        notes: 'Followed up on migraine symptoms and provided prescription guidance.'
      }
    ]));
  }
};

// Execute initialization
initLocalStorage();

// Cross-device network sync on initial load
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const serverDb = await res.json();
        const serverKeys = Object.keys(serverDb);
        if (serverKeys.length > 0) {
          // Server already has data from another active laptop, load it
          serverKeys.forEach(col => {
            if (Array.isArray(serverDb[col])) {
              localStorage.setItem(`rc_${col}`, JSON.stringify(serverDb[col]));
            }
          });
          notifyMockDbUpdate();
        } else {
          // Server store is empty, push local state to server
          const dump: Record<string, any[]> = {};
          [
            'users',
            'doctors',
            'hospitals',
            'appointments',
            'consultations',
            'availability',
            'medicalReports',
            'referrals',
            'notifications',
            'feedback',
            'conversations',
            'messages',
            'calls',
            'callHistory'
          ].forEach(col => {
            const data = localStorage.getItem(`rc_${col}`);
            if (data) dump[col] = JSON.parse(data);
          });
          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dump)
          });
        }
      }
    } catch (e) {}
  }, 200);

  // Poll for real-time updates from other laptops on the same Wi-Fi
  setInterval(syncPullAll, 300);
}

// Standard CRUD Operations
export const mockDb = {
  getCollection: <T>(collectionName: string): T[] => {
    const data = localStorage.getItem(`rc_${collectionName}`);
    return data ? JSON.parse(data) : [];
  },

  saveCollection: <T>(collectionName: string, data: T[]): void => {
    localStorage.setItem(`rc_${collectionName}`, JSON.stringify(data));
    syncPushCollection(collectionName, data);
    notifyMockDbUpdate();
  },

  getDoc: <T extends { id: string }>(collectionName: string, id: string): T | undefined => {
    const list = mockDb.getCollection<T>(collectionName);
    return list.find(item => item.id === id);
  },

  setDoc: <T extends { id: string }>(collectionName: string, id: string, data: T): void => {
    const list = mockDb.getCollection<T>(collectionName);
    const index = list.findIndex(item => item.id === id);
    if (index > -1) {
      list[index] = data;
    } else {
      list.push(data);
    }
    localStorage.setItem(`rc_${collectionName}`, JSON.stringify(list));
    syncPushDoc(collectionName, data);
    notifyMockDbUpdate();
  },

  addDoc: <T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>): T => {
    const list = mockDb.getCollection<T>(collectionName);
    const newId = `${collectionName.slice(0, 3).toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newDoc = { ...data, id: newId } as unknown as T;
    list.push(newDoc);
    localStorage.setItem(`rc_${collectionName}`, JSON.stringify(list));
    syncPushDoc(collectionName, newDoc);
    notifyMockDbUpdate();
    return newDoc;
  },

  updateDoc: <T extends { id: string }>(collectionName: string, id: string, data: Partial<T>): void => {
    const list = mockDb.getCollection<T>(collectionName);
    const index = list.findIndex(item => item.id === id);
    if (index > -1) {
      const updatedDoc = { ...list[index], ...data };
      list[index] = updatedDoc;
      localStorage.setItem(`rc_${collectionName}`, JSON.stringify(list));
      syncPushDoc(collectionName, updatedDoc);
      notifyMockDbUpdate();
    }
  },

  deleteDoc: <T extends { id: string }>(collectionName: string, id: string): void => {
    const list = mockDb.getCollection<T>(collectionName);
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(`rc_${collectionName}`, JSON.stringify(filtered));
    syncDeleteDoc(collectionName, id);
    notifyMockDbUpdate();
  }
};

// Auth Mock State & Observers
let authStateListeners: ((user: User | null) => void)[] = [];
let currentUser: User | null = (() => {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem('rc_current_user');
  return storedUser ? JSON.parse(storedUser) : null;
})();

const triggerAuthChange = () => {
  authStateListeners.forEach(listener => listener(currentUser));
};

export const mockAuth = {
  subscribe: (callback: (user: User | null) => void) => {
    authStateListeners.push(callback);
    callback(currentUser); // Immediately notify current state
    return () => {
      authStateListeners = authStateListeners.filter(l => l !== callback);
    };
  },

  signIn: async (email: string, _password?: string): Promise<User> => {
    const users = mockDb.getCollection<User>('users');
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      const doctors = mockDb.getCollection<Doctor>('doctors');
      const doctor = doctors.find(d => d.id === email || d.name.toLowerCase().includes(email.toLowerCase()));

      if (doctor) {
        user = {
          id: doctor.id,
          name: doctor.name,
          email: `${doctor.id}@ruralcare.org`,
          role: 'doctor',
          phone: '+91 98765 00000',
          createdAt: new Date().toISOString()
        };
      } else {
        user = {
          id: `usr-${Date.now()}`,
          name: email.split('@')[0],
          email: email,
          role: email.includes('admin') ? 'admin' : email.includes('doc') ? 'doctor' : 'patient',
          phone: '+91 99999 99999',
          createdAt: new Date().toISOString()
        };
        mockDb.addDoc('users', user);
      }
    }

    currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('rc_current_user', JSON.stringify(user));
    }
    triggerAuthChange();
    return user;
  },

  signUp: async (
    email: string,
    _password?: string,
    name?: string,
    role: 'patient' | 'doctor' = 'patient',
    phone?: string,
    village?: string,
    district?: string,
    state?: string,
    latitude?: number,
    longitude?: number
  ): Promise<User> => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name || email.split('@')[0],
      email: email,
      role,
      phone: phone || '+91 99999 99999',
      village,
      district,
      state: state || 'Maharashtra',
      latitude,
      longitude,
      createdAt: new Date().toISOString()
    };

    mockDb.addDoc('users', newUser);

    if (role === 'doctor') {
      const newDoc: Doctor = {
        id: newUser.id,
        name: newUser.name,
        specialty: 'General Medicine',
        qualifications: 'MBBS',
        experience: 1,
        hospitalId: 'hosp-1',
        city: district || 'Pune',
        state: state || 'Maharashtra',
        consultationFee: 300,
        teleconsultationAvailable: true,
        verificationStatus: 'pending',
        availabilityStatus: 'available',
        profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
        areasOfSpecialization: ['General Consultation']
      };
      mockDb.addDoc('doctors', newDoc);
    }

    currentUser = newUser;
    if (typeof window !== 'undefined') {
      localStorage.setItem('rc_current_user', JSON.stringify(newUser));
    }
    triggerAuthChange();
    return newUser;
  },

  signOut: async (): Promise<void> => {
    currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rc_current_user');
    }
    triggerAuthChange();
  },

  updateProfile: async (updates: Partial<User>): Promise<User> => {
    if (!currentUser) throw new Error('No user logged in');
    const updated = { ...currentUser, ...updates };
    mockDb.updateDoc<User>('users', currentUser.id, updates);
    currentUser = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem('rc_current_user', JSON.stringify(updated));
    }
    triggerAuthChange();
    return updated;
  },

  getCurrentUser: (): User | null => currentUser
};

// Mock Storage simulation (base64 data URL)
export const mockStorage = {
  uploadFile: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
