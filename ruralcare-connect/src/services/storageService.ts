import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isMockMode } from './firebase';
import { mockStorage } from './mockDb';

export const storageService = {
  uploadReport: async (patientId: string, file: File): Promise<string> => {
    if (isMockMode) {
      return mockStorage.uploadFile(file);
    }

    if (!storage) throw new Error("Firebase Storage not initialized");

    // Path structure: medical_reports/{patientId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `medical_reports/${patientId}/${timestamp}_${cleanFileName}`;
    const storageRef = ref(storage, filePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  }
};
