import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, isMockMode } from './firebase';
import { mockDb } from './mockDb';
import {
  SEED_USERS,
  SEED_DOCTORS,
  SEED_HOSPITALS,
  SEED_APPOINTMENTS,
  SEED_CONSULTATIONS
} from './seedData';

const COLLECTIONS = [
  'users',
  'doctors',
  'hospitals',
  'appointments',
  'consultations',
  'medicalReports',
  'referrals',
  'conversations',
  'messages',
  'callHistory',
  'feedback',
  'notifications'
];

export const migrationService = {
  // Export entire local database as a downloadable JSON file
  exportLocalDataAsJSON: () => {
    const exportData: { [collection: string]: any[] } = {};

    COLLECTIONS.forEach(col => {
      const data = mockDb.getCollection(col);
      exportData[col] = data;
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ruralcare-database-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Transfer all local data from localStorage directly to Cloud Firestore
  transferLocalDataToCloudFirebase: async (
    onProgress?: (msg: string, percent: number) => void
  ): Promise<{ success: boolean; totalUploaded: number; details: string }> => {
    if (!db) {
      throw new Error(
        'Cloud Firebase is not connected. Please add your real Firebase API keys to your .env file first.'
      );
    }

    let totalDocs = 0;
    const summary: string[] = [];

    for (let i = 0; i < COLLECTIONS.length; i++) {
      const colName = COLLECTIONS[i];
      let items = mockDb.getCollection<any>(colName);

      // If local collection is empty, use seed data fallback for initial setup
      if (items.length === 0) {
        if (colName === 'users') items = SEED_USERS;
        if (colName === 'doctors') items = SEED_DOCTORS;
        if (colName === 'hospitals') items = SEED_HOSPITALS;
        if (colName === 'appointments') items = SEED_APPOINTMENTS;
        if (colName === 'consultations') items = SEED_CONSULTATIONS;
      }

      if (items.length > 0) {
        onProgress?.(
          `Uploading collection "${colName}" (${items.length} records)...`,
          Math.round(((i + 1) / COLLECTIONS.length) * 100)
        );

        for (const item of items) {
          if (item && item.id) {
            const docRef = doc(db, colName, String(item.id));
            await setDoc(docRef, item, { merge: true });
            totalDocs++;
          }
        }
        summary.push(`${colName}: ${items.length} records`);
      }
    }

    return {
      success: true,
      totalUploaded: totalDocs,
      details: summary.join(', ')
    };
  }
};
