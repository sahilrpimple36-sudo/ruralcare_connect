import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db, isMockMode } from './firebase';
import { mockDb } from './mockDb';
import {
  User,
  Doctor,
  Hospital,
  Appointment,
  AppointmentStatus,
  Availability,
  Consultation,
  MedicalReport,
  Notification,
  Feedback,
  Referral,
  ReferralStatus,
  HealthAssessment,
  FollowUpPriority,
  NotificationType
} from '../types';

export const dbService = {
  // HOSPITALS
  getHospitals: async (): Promise<Hospital[]> => {
    if (isMockMode) {
      return mockDb.getCollection<Hospital>('hospitals');
    }
    const q = query(collection(db, 'hospitals'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Hospital));
  },

  getHospital: async (id: string): Promise<Hospital | undefined> => {
    if (isMockMode) {
      return mockDb.getDoc<Hospital>('hospitals', id);
    }
    const snap = await getDoc(doc(db, 'hospitals', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Hospital) : undefined;
  },

  addHospital: async (hospitalData: Omit<Hospital, 'id'>): Promise<Hospital> => {
    if (isMockMode) {
      return mockDb.addDoc<Hospital>('hospitals', hospitalData);
    }
    const docRef = await addDoc(collection(db, 'hospitals'), hospitalData);
    return { id: docRef.id, ...hospitalData } as Hospital;
  },

  // DOCTORS
  getDoctors: async (filters?: {
    specialty?: string;
    state?: string;
    district?: string;
    city?: string;
    hospitalId?: string;
    teleconsultationAvailable?: boolean;
  }): Promise<Doctor[]> => {
    if (isMockMode) {
      let docs = mockDb.getCollection<Doctor>('doctors').filter(d => d.verificationStatus === 'verified');
      if (filters) {
        if (filters.specialty) docs = docs.filter(d => d.specialty === filters.specialty);
        if (filters.state) docs = docs.filter(d => d.state.toLowerCase() === filters.state?.toLowerCase());
        if (filters.city) docs = docs.filter(d => d.city.toLowerCase().includes(filters.city?.toLowerCase() || ''));
        if (filters.hospitalId) docs = docs.filter(d => d.hospitalId === filters.hospitalId);
        if (filters.teleconsultationAvailable !== undefined) {
          docs = docs.filter(d => d.teleconsultationAvailable === filters.teleconsultationAvailable);
        }
      }
      return docs;
    }

    let q = query(collection(db, 'doctors'), where('verificationStatus', '==', 'verified'));
    if (filters) {
      if (filters.specialty) q = query(q, where('specialty', '==', filters.specialty));
      if (filters.state) q = query(q, where('state', '==', filters.state));
      if (filters.hospitalId) q = query(q, where('hospitalId', '==', filters.hospitalId));
      if (filters.teleconsultationAvailable !== undefined) {
        q = query(q, where('teleconsultationAvailable', '==', filters.teleconsultationAvailable));
      }
    }

    const snapshot = await getDocs(q);
    let doctors = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
    
    if (filters?.city) {
      doctors = doctors.filter(d => d.city.toLowerCase().includes(filters.city?.toLowerCase() || ''));
    }
    return doctors;
  },

  getAllDoctorsForAdmin: async (): Promise<Doctor[]> => {
    if (isMockMode) {
      return mockDb.getCollection<Doctor>('doctors');
    }
    const q = query(collection(db, 'doctors'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
  },

  getDoctorProfile: async (id: string): Promise<Doctor | undefined> => {
    if (isMockMode) {
      return mockDb.getDoc<Doctor>('doctors', id);
    }
    const snap = await getDoc(doc(db, 'doctors', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Doctor) : undefined;
  },

  updateDoctorProfile: async (id: string, updates: Partial<Doctor>): Promise<void> => {
    if (isMockMode) {
      mockDb.updateDoc<Doctor>('doctors', id, updates);
      return;
    }
    await updateDoc(doc(db, 'doctors', id), updates);
  },

  verifyDoctor: async (id: string, status: 'verified' | 'rejected'): Promise<void> => {
    if (isMockMode) {
      mockDb.updateDoc<Doctor>('doctors', id, { verificationStatus: status });
      return;
    }
    await updateDoc(doc(db, 'doctors', id), { verificationStatus: status });
  },

  // AVAILABILITY
  getDoctorAvailability: async (doctorId: string, date: string): Promise<Availability | undefined> => {
    if (isMockMode) {
      const avail = mockDb.getCollection<Availability>('availability');
      return avail.find(a => a.doctorId === doctorId && a.date === date);
    }
    const q = query(
      collection(db, 'availability'),
      where('doctorId', '==', doctorId),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Availability;
  },

  setDoctorAvailability: async (doctorId: string, date: string, slots: string[]): Promise<Availability> => {
    const existing = await dbService.getDoctorAvailability(doctorId, date);
    if (isMockMode) {
      if (existing) {
        mockDb.updateDoc<Availability>('availability', existing.id, { slots });
        return { ...existing, slots };
      }
      return mockDb.addDoc<Availability>('availability', { doctorId, date, slots });
    }

    if (existing) {
      await updateDoc(doc(db, 'availability', existing.id), { slots });
      return { ...existing, slots };
    }
    const docRef = await addDoc(collection(db, 'availability'), { doctorId, date, slots });
    return { id: docRef.id, doctorId, date, slots };
  },

  // APPOINTMENTS
  bookAppointment: async (appointmentData: {
    patientId: string;
    doctorId: string;
    hospitalId: string;
    specialty: string;
    date: string;
    time: string;
    consultationType: 'video' | 'audio';
  }): Promise<Appointment> => {
    const existingDoctorApts = await dbService.getAppointments(appointmentData.doctorId, 'doctor');
    const hasConflict = existingDoctorApts.some(
      a => a.date === appointmentData.date && a.time === appointmentData.time && a.status !== 'cancelled'
    );

    if (hasConflict) {
      throw new Error("This doctor is already booked for this specific date and time slot.");
    }

    const newAppointment: Omit<Appointment, 'id'> = {
      ...appointmentData,
      status: 'requested',
      createdAt: new Date().toISOString()
    };

    if (isMockMode) {
      const created = mockDb.addDoc<Appointment>('appointments', newAppointment);

      // Trigger In-App Notification for Doctor
      const patient = mockDb.getDoc<User>('users', appointmentData.patientId);
      await dbService.addNotification(
        appointmentData.doctorId,
        `New appointment request from ${patient?.name || 'a patient'} for ${appointmentData.date} at ${appointmentData.time}.`,
        'appointment_requested'
      );

      // Trigger In-App Notification for Patient
      await dbService.addNotification(
        appointmentData.patientId,
        `Your appointment with ${appointmentData.specialty} specialist has been requested.`,
        'appointment_requested'
      );

      return created;
    }

    const docRef = await addDoc(collection(db, 'appointments'), newAppointment);
    const createdAppointment = { id: docRef.id, ...newAppointment } as Appointment;

    await dbService.addNotification(
      appointmentData.doctorId,
      `New appointment request for ${appointmentData.date} at ${appointmentData.time}.`,
      'appointment_requested'
    );

    await dbService.addNotification(
      appointmentData.patientId,
      `Your appointment request has been submitted.`,
      'appointment_requested'
    );

    return createdAppointment;
  },

  getAppointments: async (userId: string, role: 'patient' | 'doctor' | 'admin'): Promise<Appointment[]> => {
    if (isMockMode) {
      const all = mockDb.getCollection<Appointment>('appointments');
      if (role === 'patient') return all.filter(a => a.patientId === userId);
      if (role === 'doctor') return all.filter(a => a.doctorId === userId);
      return all;
    }

    let q;
    if (role === 'patient') {
      q = query(collection(db, 'appointments'), where('patientId', '==', userId), orderBy('createdAt', 'desc'));
    } else if (role === 'doctor') {
      q = query(collection(db, 'appointments'), where('doctorId', '==', userId), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
  },

  updateAppointmentStatus: async (appointmentId: string, status: AppointmentStatus): Promise<void> => {
    if (isMockMode) {
      mockDb.updateDoc<Appointment>('appointments', appointmentId, { status });
      
      const apt = mockDb.getDoc<Appointment>('appointments', appointmentId);
      if (apt) {
        let msg = `Your appointment ${appointmentId} has been updated to ${status}.`;
        let type: NotificationType = 'appointment_confirmed';

        if (status === 'confirmed') {
          msg = `Your appointment ${appointmentId} with ${apt.specialty} specialist has been CONFIRMED.`;
          type = 'appointment_confirmed';
        } else if (status === 'cancelled') {
          msg = `Your appointment ${appointmentId} has been CANCELLED.`;
          type = 'appointment_cancelled';
        } else if (status === 'completed') {
          msg = `Your appointment ${appointmentId} has been COMPLETED. You can now view recommendations.`;
          type = 'consultation_completed';
        }

        await dbService.addNotification(apt.patientId, msg, type);

        if (status === 'cancelled') {
          await dbService.addNotification(apt.doctorId, `Appointment ${appointmentId} has been cancelled.`, 'appointment_cancelled');
        }
      }
      return;
    }

    const docRef = doc(db, 'appointments', appointmentId);
    await updateDoc(docRef, { status });

    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const apt = snap.data() as Appointment;
      let msg = `Your appointment ${appointmentId} has been updated to ${status}.`;
      let type: NotificationType = 'appointment_confirmed';

      if (status === 'confirmed') {
        msg = `Your appointment ${appointmentId} has been CONFIRMED.`;
        type = 'appointment_confirmed';
      } else if (status === 'cancelled') {
        msg = `Your appointment ${appointmentId} has been CANCELLED.`;
        type = 'appointment_cancelled';
      } else if (status === 'completed') {
        msg = `Your appointment ${appointmentId} has been COMPLETED.`;
        type = 'consultation_completed';
      }

      await dbService.addNotification(apt.patientId, msg, type);

      if (status === 'cancelled') {
        await dbService.addNotification(apt.doctorId, `Appointment ${appointmentId} has been cancelled.`, 'appointment_cancelled');
      }
    }
  },

  // CONSULTATIONS & FOLLOW-UPS
  getConsultation: async (appointmentId: string): Promise<Consultation | undefined> => {
    if (isMockMode) {
      return mockDb.getDoc<Consultation>('consultations', appointmentId);
    }
    const snap = await getDoc(doc(db, 'consultations', appointmentId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Consultation) : undefined;
  },

  completeConsultation: async (
    appointmentId: string,
    consultationData: {
      patientId: string;
      doctorId: string;
      notes: string;
      recommendations: string;
      followUpRequired?: boolean;
      followUpDate?: string;
      followUpPriority?: FollowUpPriority;
      followUpNote?: string;
      physicalReferral?: {
        hospitalId: string;
        hospitalName: string;
        specialty: string;
        location: string;
        reason: string;
        contactInfo: string;
      };
    }
  ): Promise<Consultation> => {
    const consultation: Consultation = {
      id: appointmentId,
      appointmentId,
      ...consultationData,
      completedAt: new Date().toISOString()
    };

    if (isMockMode) {
      mockDb.setDoc<Consultation>('consultations', appointmentId, consultation);
      mockDb.updateDoc<Appointment>('appointments', appointmentId, { status: 'completed' });

      // Follow-up Notifications
      if (consultationData.followUpRequired && consultationData.followUpDate) {
        const priorityText = consultationData.followUpPriority === 'high' ? ' [HIGH PRIORITY]' : '';
        const notifType: NotificationType = consultationData.followUpPriority === 'high' ? 'priority_followup' : 'followup_scheduled';
        await dbService.addNotification(
          consultationData.patientId,
          `Dr. Specialist has scheduled a${priorityText} follow-up consultation for ${consultationData.followUpDate}. Note: "${consultationData.followUpNote || 'Follow-up'}"`,
          notifType
        );
      }

      // Referral Entry Creation
      if (consultationData.physicalReferral) {
        const patient = mockDb.getDoc<User>('users', consultationData.patientId);
        const doctor = mockDb.getDoc<Doctor>('doctors', consultationData.doctorId);

        const refData: Omit<Referral, 'id'> = {
          patientId: consultationData.patientId,
          patientName: patient?.name || 'Patient',
          doctorId: consultationData.doctorId,
          doctorName: doctor?.name || 'Doctor',
          appointmentId: appointmentId,
          hospitalId: consultationData.physicalReferral.hospitalId,
          hospitalName: consultationData.physicalReferral.hospitalName,
          specialty: consultationData.physicalReferral.specialty,
          reason: consultationData.physicalReferral.reason,
          status: 'created',
          createdAt: new Date().toISOString()
        };
        mockDb.addDoc('referrals', refData);

        await dbService.addNotification(
          consultationData.patientId,
          `Hospital referral created for physical care transfer to ${consultationData.physicalReferral.hospitalName}.`,
          'referral_created'
        );
      }

      await dbService.addNotification(
        consultationData.patientId,
        `Your consultation record for appointment ${appointmentId} is ready.`,
        'consultation_completed'
      );

      return consultation;
    }

    // Live update
    await setDoc(doc(db, 'consultations', appointmentId), consultation);
    await updateDoc(doc(db, 'appointments', appointmentId), { status: 'completed' });

    if (consultationData.followUpRequired && consultationData.followUpDate) {
      const priorityText = consultationData.followUpPriority === 'high' ? ' [HIGH PRIORITY]' : '';
      const notifType: NotificationType = consultationData.followUpPriority === 'high' ? 'priority_followup' : 'followup_scheduled';
      await dbService.addNotification(
        consultationData.patientId,
        `Dr. Specialist has scheduled a${priorityText} follow-up consultation for ${consultationData.followUpDate}.`,
        notifType
      );
    }

    if (consultationData.physicalReferral) {
      const refData = {
        patientId: consultationData.patientId,
        doctorId: consultationData.doctorId,
        appointmentId: appointmentId,
        hospitalId: consultationData.physicalReferral.hospitalId,
        hospitalName: consultationData.physicalReferral.hospitalName,
        specialty: consultationData.physicalReferral.specialty,
        reason: consultationData.physicalReferral.reason,
        status: 'created' as ReferralStatus,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'referrals'), refData);

      await dbService.addNotification(
        consultationData.patientId,
        `Hospital referral created for physical visit at ${consultationData.physicalReferral.hospitalName}.`,
        'referral_created'
      );
    }

    await dbService.addNotification(
      consultationData.patientId,
      `Your consultation record for ${appointmentId} is complete.`,
      'consultation_completed'
    );

    return consultation;
  },

  // FOLLOW-UPS RETRIEVAL
  getFollowUps: async (
    userId: string,
    role: 'patient' | 'doctor' | 'admin',
    priorityFilter?: FollowUpPriority
  ): Promise<{
    id: string;
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    specialty: string;
    followUpDate: string;
    followUpPriority: FollowUpPriority;
    followUpNote: string;
    status: 'upcoming' | 'completed';
    createdAt: string;
  }[]> => {
    let consultations: Consultation[] = [];

    if (isMockMode) {
      consultations = mockDb.getCollection<Consultation>('consultations').filter(c => c.followUpDate);
      if (role === 'patient') {
        consultations = consultations.filter(c => c.patientId === userId);
      } else if (role === 'doctor') {
        consultations = consultations.filter(c => c.doctorId === userId);
      }
    } else {
      let q = query(collection(db, 'consultations'), where('followUpDate', '!=', ''));
      if (role === 'patient') {
        q = query(collection(db, 'consultations'), where('patientId', '==', userId));
      } else if (role === 'doctor') {
        q = query(collection(db, 'consultations'), where('doctorId', '==', userId));
      }
      const snap = await getDocs(q);
      consultations = snap.docs.map(d => ({ id: d.id, ...d.data() } as Consultation)).filter(c => c.followUpDate);
    }

    if (priorityFilter) {
      consultations = consultations.filter(c => (c.followUpPriority || 'normal') === priorityFilter);
    }

    // Resolve doctor and patient details
    const doctors = isMockMode ? mockDb.getCollection<Doctor>('doctors') : await dbService.getDoctors();
    const users = isMockMode ? mockDb.getCollection<User>('users') : [];

    return consultations.map(c => {
      const docMatch = doctors.find(d => d.id === c.doctorId);
      const userMatch = users.find(u => u.id === c.patientId);
      const isPast = c.followUpDate ? new Date(c.followUpDate) < new Date() : false;

      return {
        id: c.id,
        appointmentId: c.appointmentId,
        patientId: c.patientId,
        patientName: userMatch?.name || `Patient (${c.patientId.slice(0, 6)})`,
        doctorId: c.doctorId,
        doctorName: docMatch?.name || 'Dr. Specialist',
        specialty: docMatch?.specialty || 'General Medicine',
        followUpDate: c.followUpDate || '',
        followUpPriority: c.followUpPriority || 'normal',
        followUpNote: c.followUpNote || c.recommendations || 'Regular clinical review',
        status: (isPast ? 'completed' : 'upcoming') as 'completed' | 'upcoming',
        createdAt: c.completedAt
      };
    }).sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime());
  },

  // MEDICAL REPORTS
  getMedicalReports: async (patientId: string): Promise<MedicalReport[]> => {
    if (isMockMode) {
      return mockDb.getCollection<MedicalReport>('medicalReports').filter(r => r.patientId === patientId);
    }
    const q = query(
      collection(db, 'medicalReports'),
      where('patientId', '==', patientId),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MedicalReport));
  },

  addMedicalReportMetadata: async (report: Omit<MedicalReport, 'id' | 'uploadedAt'>): Promise<MedicalReport> => {
    const reportData = {
      ...report,
      uploadedAt: new Date().toISOString()
    };

    if (isMockMode) {
      return mockDb.addDoc<MedicalReport>('medicalReports', reportData);
    }

    const docRef = await addDoc(collection(db, 'medicalReports'), reportData);
    return { id: docRef.id, ...reportData } as MedicalReport;
  },

  // REFERRALS & REFERRAL TRACKING LIFECYCLE
  getReferrals: async (patientId?: string): Promise<Referral[]> => {
    if (isMockMode) {
      const all = mockDb.getCollection<Referral>('referrals');
      if (patientId) return all.filter(r => r.patientId === patientId);
      return all;
    }
    let q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'));
    if (patientId) {
      q = query(collection(db, 'referrals'), where('patientId', '==', patientId), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Referral));
  },

  getDoctorReferrals: async (doctorId: string): Promise<Referral[]> => {
    if (isMockMode) {
      return mockDb.getCollection<Referral>('referrals').filter(r => r.doctorId === doctorId);
    }
    const q = query(collection(db, 'referrals'), where('doctorId', '==', doctorId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Referral));
  },

  createReferral: async (referralData: Omit<Referral, 'id' | 'createdAt' | 'status'>): Promise<Referral> => {
    const newRef: Omit<Referral, 'id'> = {
      ...referralData,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    if (isMockMode) {
      const created = mockDb.addDoc<Referral>('referrals', newRef);
      await dbService.addNotification(
        referralData.patientId,
        `Hospital referral created for physical consultation at ${referralData.hospitalName || 'care facility'}.`,
        'referral_created'
      );
      return created;
    }

    const docRef = await addDoc(collection(db, 'referrals'), newRef);
    await dbService.addNotification(
      referralData.patientId,
      `Hospital referral created for physical consultation.`,
      'referral_created'
    );
    return { id: docRef.id, ...newRef } as Referral;
  },

  updateReferralStatus: async (referralId: string, status: ReferralStatus): Promise<void> => {
    const timestamp = new Date().toISOString();
    const updates: Partial<Referral> = { status };

    if (status === 'viewed') updates.viewedAt = timestamp;
    if (status === 'accepted') updates.acceptedAt = timestamp;
    if (status === 'appointment_requested') updates.appointmentRequestedAt = timestamp;
    if (status === 'completed') updates.completedAt = timestamp;

    if (isMockMode) {
      mockDb.updateDoc<Referral>('referrals', referralId, updates);
      const ref = mockDb.getDoc<Referral>('referrals', referralId);
      if (ref) {
        await dbService.addNotification(
          ref.patientId,
          `Your hospital referral status has been updated to: ${status.replace('_', ' ').toUpperCase()}.`,
          'referral_updated'
        );
        if (status === 'appointment_requested' || status === 'accepted') {
          await dbService.addNotification(
            ref.doctorId,
            `Patient has accepted and requested hospital appointment for referral #${referralId}.`,
            'referral_updated'
          );
        }
      }
      return;
    }

    const refDoc = doc(db, 'referrals', referralId);
    await updateDoc(refDoc, updates);
  },

  // DIGITAL TRIAGE / HEALTH ASSESSMENTS
  saveHealthAssessment: async (
    assessmentData: Omit<HealthAssessment, 'id' | 'createdAt'>
  ): Promise<HealthAssessment> => {
    const newAssessment: Omit<HealthAssessment, 'id'> = {
      ...assessmentData,
      createdAt: new Date().toISOString()
    };

    if (isMockMode) {
      return mockDb.addDoc<HealthAssessment>('healthAssessments', newAssessment);
    }

    const docRef = await addDoc(collection(db, 'healthAssessments'), newAssessment);
    return { id: docRef.id, ...newAssessment } as HealthAssessment;
  },

  getHealthAssessments: async (patientId: string): Promise<HealthAssessment[]> => {
    if (isMockMode) {
      return mockDb
        .getCollection<HealthAssessment>('healthAssessments')
        .filter(a => a.patientId === patientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const q = query(
      collection(db, 'healthAssessments'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HealthAssessment));
  },

  // NOTIFICATIONS
  getNotifications: async (userId: string): Promise<Notification[]> => {
    if (isMockMode) {
      return mockDb
        .getCollection<Notification>('notifications')
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
  },

  addNotification: async (userId: string, message: string, type: NotificationType | string): Promise<void> => {
    const notif = {
      userId,
      message,
      type: type as NotificationType,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (isMockMode) {
      mockDb.addDoc<Notification>('notifications', notif);
      return;
    }
    await addDoc(collection(db, 'notifications'), notif);
  },

  markNotificationRead: async (notifId: string): Promise<void> => {
    if (isMockMode) {
      mockDb.updateDoc<Notification>('notifications', notifId, { read: true });
      return;
    }
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  },

  // FEEDBACK
  addFeedback: async (feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> => {
    const feedbackData = {
      ...feedback,
      createdAt: new Date().toISOString()
    };
    if (isMockMode) {
      return mockDb.addDoc<Feedback>('feedback', feedbackData);
    }
    const docRef = await addDoc(collection(db, 'feedback'), feedbackData);
    return { id: docRef.id, ...feedbackData } as Feedback;
  },

  getFeedbackForDoctor: async (doctorId: string): Promise<Feedback[]> => {
    if (isMockMode) {
      return mockDb.getCollection<Feedback>('feedback').filter(f => f.doctorId === doctorId);
    }
    const q = query(collection(db, 'feedback'), where('doctorId', '==', doctorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
  },

  // ADMIN DASHBOARD STATISTICS
  getPlatformStats: async (): Promise<{
    totalPatients: number;
    totalDoctors: number;
    verifiedDoctors: number;
    totalHospitals: number;
    totalAppointments: number;
    completedConsultations: number;
    pendingAppointments: number;
    totalFollowUps: number;
    highPriorityFollowUps: number;
    activeReferrals: number;
    completedReferrals: number;
  }> => {
    if (isMockMode) {
      const users = mockDb.getCollection<User>('users');
      const docs = mockDb.getCollection<Doctor>('doctors');
      const hosps = mockDb.getCollection<Hospital>('hospitals');
      const apts = mockDb.getCollection<Appointment>('appointments');
      const consults = mockDb.getCollection<Consultation>('consultations');
      const refs = mockDb.getCollection<Referral>('referrals');

      const totalPatients = users.filter(u => u.role === 'patient').length;
      const totalDoctors = docs.length;
      const verifiedDoctors = docs.filter(d => d.verificationStatus === 'verified').length;
      const totalHospitals = hosps.length;
      const totalAppointments = apts.length;
      const completedConsultations = apts.filter(a => a.status === 'completed').length;
      const pendingAppointments = apts.filter(a => a.status === 'requested').length;

      const followUps = consults.filter(c => c.followUpDate);
      const totalFollowUps = followUps.length;
      const highPriorityFollowUps = followUps.filter(c => c.followUpPriority === 'high').length;
      const activeReferrals = refs.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length;
      const completedReferrals = refs.filter(r => r.status === 'completed').length;

      return {
        totalPatients,
        totalDoctors,
        verifiedDoctors,
        totalHospitals,
        totalAppointments,
        completedConsultations,
        pendingAppointments,
        totalFollowUps,
        highPriorityFollowUps,
        activeReferrals,
        completedReferrals
      };
    }

    const patientsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'patient')));
    const doctorsSnap = await getDocs(collection(db, 'doctors'));
    const verifiedDocsSnap = await getDocs(query(collection(db, 'doctors'), where('verificationStatus', '==', 'verified')));
    const hospitalsSnap = await getDocs(collection(db, 'hospitals'));
    const appointmentsSnap = await getDocs(collection(db, 'appointments'));
    const completedSnap = await getDocs(query(collection(db, 'appointments'), where('status', '==', 'completed')));
    const pendingSnap = await getDocs(query(collection(db, 'appointments'), where('status', '==', 'requested')));
    const referralsSnap = await getDocs(collection(db, 'referrals'));

    let totalFollowUps = 0;
    let highPriorityFollowUps = 0;
    try {
      const consultSnap = await getDocs(collection(db, 'consultations'));
      const consults = consultSnap.docs.map(d => d.data() as Consultation);
      const fList = consults.filter(c => c.followUpDate);
      totalFollowUps = fList.length;
      highPriorityFollowUps = fList.filter(c => c.followUpPriority === 'high').length;
    } catch (e) {}

    const refs = referralsSnap.docs.map(d => d.data() as Referral);
    const activeReferrals = refs.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length;
    const completedReferrals = refs.filter(r => r.status === 'completed').length;

    return {
      totalPatients: patientsSnap.size,
      totalDoctors: doctorsSnap.size,
      verifiedDoctors: verifiedDocsSnap.size,
      totalHospitals: hospitalsSnap.size,
      totalAppointments: appointmentsSnap.size,
      completedConsultations: completedSnap.size,
      pendingAppointments: pendingSnap.size,
      totalFollowUps,
      highPriorityFollowUps,
      activeReferrals,
      completedReferrals
    };
  },

  // USERS MANAGEMENT FOR ADMIN
  getPatientsForAdmin: async (): Promise<User[]> => {
    if (isMockMode) {
      return mockDb.getCollection<User>('users').filter(u => u.role === 'patient');
    }
    const q = query(collection(db, 'users'), where('role', '==', 'patient'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
  }
};
