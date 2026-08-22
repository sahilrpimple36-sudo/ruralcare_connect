import React, { createContext, useContext, useState } from 'react';
import { SupportedLanguage } from '../types';

export interface Translations {
  // Navigation & Branding
  brandName: string;
  brandTagline: string;
  home: string;
  dashboard: string;
  findSpecialist: string;
  healthAssessment: string;
  appointments: string;
  medicalReports: string;
  consultations: string;
  referrals: string;
  myReferrals: string;
  followUp: string;
  followUpCare: string;
  notifications: string;
  profile: string;
  logout: string;
  login: string;
  register: string;
  signInOrRegister: string;
  welcome: string;

  // Actions & Buttons
  bookConsultation: string;
  bookSlot: string;
  startVideoCall: string;
  startAudioCall: string;
  chat: string;
  submit: string;
  cancel: string;
  save: string;
  viewDetails: string;
  startAssessment: string;
  findSpecialistsFor: string;
  acceptReferral: string;
  requestHospitalAppointment: string;
  markCompleted: string;
  scheduleFollowUp: string;
  uploadReport: string;
  clearFilters: string;
  resetAll: string;
  joinRoom: string;
  retakeAssessment: string;
  getRecommendation: string;
  openReports: string;
  openChat: string;
  startConsultation: string;

  // Domain terms
  hospital: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
  priority: string;
  highPriority: string;
  normalPriority: string;
  urgentPriority: string;
  city: string;
  district: string;
  state: string;
  experience: string;
  fee: string;
  years: string;
  allSpecialties: string;
  allHospitals: string;
  verifiedSpecialist: string;
  verificationPending: string;

  // Statuses
  statusRequested: string;
  statusConfirmed: string;
  statusCompleted: string;
  statusCancelled: string;
  statusCreated: string;
  statusViewed: string;
  statusAccepted: string;
  statusAppointmentRequested: string;
  statusUpcoming: string;

  // Disclaimers & Emergency Notice
  emergencyWarning: string;
  emergencyTitle: string;
  emergencyAction: string;
  assessmentDisclaimer: string;
  disclaimerTitle: string;
  ruleBasedNotice: string;

  // Digital Triage / Health Assessment Page
  triageTitle: string;
  triageSubtitle: string;
  triageBadge: string;
  questionConcern: string;
  questionConcernSub: string;
  questionDuration: string;
  questionPreviousConsult: string;
  questionReport: string;
  reportUploadOptional: string;
  reportUploadNotice: string;
  suggestedSpecialty: string;
  triageResultExplanation: string;
  triageHeroTitle: string;
  triageHeroSubtitle: string;
  yes: string;
  no: string;
  symptomDuration: string;
  priorConsultation: string;
  attachedReport: string;

  // Patient Dashboard Sections
  patientHubTitle: string;
  patientHubSubtitle: string;
  upcomingAppointments: string;
  upcomingAppointmentsSub: string;
  noAppointments: string;
  noReferrals: string;
  noFollowUps: string;
  noReports: string;
  referralProgress: string;
  clinicalReason: string;
  referredBy: string;
  createdOn: string;
  doctorGuidance: string;
  consultationRecordSheet: string;
  doctorObservations: string;
  prescriptionsGuidance: string;
  rateConsultation: string;
  rateSubtitle: string;

  // Doctor Dashboard Sections
  docDashboardTitle: string;
  todaysConsultations: string;
  pendingRequests: string;
  followUpPatients: string;
  referralRequests: string;
  profileSettings: string;
  noTodayConsultations: string;
  noPendingRequests: string;
  noFollowUpRecords: string;
  noDoctorReferrals: string;
  doctorStatus: string;
  statusAvailable: string;
  statusBusy: string;
  statusOffline: string;

  // Landing Page Sections
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  findSpecialistCta: string;
  triageCta: string;
  statsPatients: string;
  statsDoctors: string;
  statsHospitals: string;
  statsVillages: string;
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  coreFeaturesTitle: string;
  coreFeaturesSubtitle: string;

  // Specialist Search Page
  searchDirectoryTitle: string;
  searchDirectorySubtitle: string;
  filterHeading: string;
  cityDistrictPlaceholder: string;
  statePlaceholder: string;
  showingDoctorsCount: string;
  noDoctorsFoundTitle: string;
  noDoctorsFoundDesc: string;
  recommendedForSpecialtyPill: string;
  consultationMode: string;
  selectSlot: string;

  // Auth Page
  signInTitle: string;
  registerTitle: string;
  fullNameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  roleLabel: string;
  villageDistrictLabel: string;
  iAmPatient: string;
  iAmDoctor: string;
  demoNotice: string;
  quickFill: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    brandName: 'RuralCare Connect',
    brandTagline: 'Specialized Healthcare, Beyond Distance.',
    home: 'Home',
    dashboard: 'Dashboard',
    findSpecialist: 'Find Specialist',
    healthAssessment: 'Health Assessment',
    appointments: 'Appointments',
    medicalReports: 'Medical Reports',
    consultations: 'Consultations',
    referrals: 'Referrals',
    myReferrals: 'My Referrals',
    followUp: 'Follow-up',
    followUpCare: 'Follow-up Care',
    notifications: 'Notifications',
    profile: 'Profile',
    logout: 'Sign Out',
    login: 'Sign In',
    register: 'Register',
    signInOrRegister: 'Sign In / Register',
    welcome: 'Welcome',

    bookConsultation: 'Book Consultation',
    bookSlot: 'Book Slot',
    startVideoCall: 'Start Video Call',
    startAudioCall: 'Start Audio Call',
    chat: 'Chat',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    viewDetails: 'View Details',
    startAssessment: 'Start Assessment',
    findSpecialistsFor: 'Find Specialists',
    acceptReferral: 'Accept Referral',
    requestHospitalAppointment: 'Request Hospital Appointment',
    markCompleted: 'Mark Visit Completed',
    scheduleFollowUp: 'Schedule Follow-up',
    uploadReport: 'Upload Report',
    clearFilters: 'Clear Filters',
    resetAll: 'Reset All',
    joinRoom: 'Join Room',
    retakeAssessment: 'Retake Assessment',
    getRecommendation: 'Get Specialty Recommendation',
    openReports: 'View Reports',
    openChat: 'Open Chat',
    startConsultation: 'Start Consultation',

    hospital: 'Hospital',
    doctor: 'Doctor',
    specialty: 'Specialty',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    priority: 'Priority',
    highPriority: 'High Priority',
    normalPriority: 'Normal Priority',
    urgentPriority: 'Priority',
    city: 'City',
    district: 'District',
    state: 'State',
    experience: 'Experience',
    fee: 'Fee',
    years: 'Years',
    allSpecialties: 'All Specialties',
    allHospitals: 'All Partner Hospitals',
    verifiedSpecialist: 'Verified Specialist',
    verificationPending: 'Verification Pending',

    statusRequested: 'Requested',
    statusConfirmed: 'Confirmed',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    statusCreated: 'Created',
    statusViewed: 'Viewed',
    statusAccepted: 'Accepted',
    statusAppointmentRequested: 'Appointment Requested',
    statusUpcoming: 'Upcoming',

    emergencyWarning:
      'Emergency? Do not wait for a teleconsultation. Immediately contact your nearest emergency healthcare facility or emergency services (Dial 108).',
    emergencyTitle: 'Emergency Notice',
    emergencyAction: 'Call 108 Ambulance',
    assessmentDisclaimer:
      'Important: This assessment provides a preliminary specialty suggestion only. It is not a medical diagnosis and should not replace professional medical advice.',
    disclaimerTitle: 'Medical Disclaimer',
    ruleBasedNotice: 'Rule-based triage recommendation • Confidential',

    triageTitle: 'Find the Right Specialist',
    triageSubtitle: 'Answer a few basic questions to help identify the appropriate medical specialty.',
    triageBadge: 'Digital Health Assessment',
    questionConcern: 'What is your main health concern?',
    questionConcernSub: 'Select the primary area of your health concern:',
    questionDuration: 'How long have you experienced this concern?',
    questionPreviousConsult: 'Have you previously consulted a doctor for this concern?',
    questionReport: 'Do you have a medical report related to this concern?',
    reportUploadOptional: 'Optional: Upload Scanned Report / Prescription File (PDF or Image)',
    reportUploadNotice: 'Note: The system does not automatically interpret reports. It will be shared securely with the specialist doctor you choose.',
    suggestedSpecialty: 'Suggested Specialty',
    triageResultExplanation: 'Based on your selected concern, consulting a qualified medical specialist is recommended.',
    triageHeroTitle: 'Unsure which specialist doctor you need?',
    triageHeroSubtitle: 'Answer 4 basic health questions in our Digital Health Assessment to identify the right specialty (Cardiology, Oncology, Orthopedics, etc.) before booking.',
    yes: 'Yes',
    no: 'No',
    symptomDuration: 'Symptom Duration',
    priorConsultation: 'Prior Consultation',
    attachedReport: 'Medical Report',

    patientHubTitle: 'Patient Care & Health Hub',
    patientHubSubtitle: 'Manage teleconsultations, track hospital referral letters, review doctor prescriptions, and perform digital health assessments.',
    upcomingAppointments: 'Upcoming Appointments',
    upcomingAppointmentsSub: 'Your scheduled specialist teleconsultations',
    noAppointments: 'No appointments scheduled yet.',
    noReferrals: 'No hospital referrals found.',
    noFollowUps: 'No scheduled follow-up care.',
    noReports: 'No medical reports uploaded yet.',
    referralProgress: 'Referral Progress',
    clinicalReason: 'Clinical Reason for Transfer',
    referredBy: 'Referred by',
    createdOn: 'Created',
    doctorGuidance: 'Doctor Guidance Note',
    consultationRecordSheet: 'Prescription & Clinical Sheet',
    doctorObservations: 'Doctor Clinical Observations',
    prescriptionsGuidance: 'Prescriptions & Medical Guidance',
    rateConsultation: 'Rate Your Teleconsultation',
    rateSubtitle: 'Share your feedback to help us maintain quality rural specialist care.',

    docDashboardTitle: 'Doctor Clinical Workspace',
    todaysConsultations: 'Today\'s Consultations',
    pendingRequests: 'Pending Requests',
    followUpPatients: 'Follow-up Patients',
    referralRequests: 'Referral Requests',
    profileSettings: 'Profile Settings',
    noTodayConsultations: 'No confirmed consultations for today.',
    noPendingRequests: 'No pending appointment requests.',
    noFollowUpRecords: 'No follow-up records found matching this filter.',
    noDoctorReferrals: 'No hospital referrals created yet.',
    doctorStatus: 'Availability Status',
    statusAvailable: 'Available',
    statusBusy: 'Busy',
    statusOffline: 'Offline',

    heroTitle: 'Specialized Healthcare,',
    heroHighlight: 'Beyond Distance.',
    heroSubtitle: 'Bridging the rural-urban specialist healthcare divide with direct teleconsultations, hospital referrals, diagnostic sharing, and digital triage.',
    findSpecialistCta: 'Find Verified Specialist',
    triageCta: 'Take Health Assessment',
    statsPatients: 'Patients Supported',
    statsDoctors: 'Verified Specialists',
    statsHospitals: 'Partner Hospitals',
    statsVillages: 'Villages Connected',
    howItWorksTitle: 'How RuralCare Connect Works',
    howItWorksSubtitle: 'A complete continuity-of-care journey from symptom assessment to hospital transfer.',
    step1Title: '1. Identify Specialty',
    step1Desc: 'Take our Digital Health Assessment to identify the right medical specialty without waiting.',
    step2Title: '2. Book Verified Doctor',
    step2Desc: 'Search top oncologists, cardiologists, and specialists across Maharashtra by city or district.',
    step3Title: '3. Consult via Video/Audio',
    step3Desc: 'Connect on low-bandwidth WebRTC video or audio with real-time chat and document sharing.',
    step4Title: '4. Follow-up & Hospital Referral',
    step4Desc: 'Receive digital prescriptions, priority follow-ups, and formal hospital referral letters.',
    coreFeaturesTitle: 'Designed for Rural Communities',
    coreFeaturesSubtitle: 'High reliability, low-bandwidth resilience, and zero complicated hardware.',

    searchDirectoryTitle: 'Verified Specialist Directory',
    searchDirectorySubtitle: 'Filter verified medical specialists across Maharashtra & partner hospitals for secure audio/video teleconsultations.',
    filterHeading: 'Specialist Discovery Filters',
    cityDistrictPlaceholder: 'Type City or District (e.g. Pune, Satara)',
    statePlaceholder: 'Type State (e.g. Maharashtra)',
    showingDoctorsCount: 'Showing verified specialists',
    noDoctorsFoundTitle: 'No specialists matched your filter criteria',
    noDoctorsFoundDesc: 'Try clearing city or specialty filters to see all available medical specialists.',
    recommendedForSpecialtyPill: 'Recommended based on your Health Assessment',
    consultationMode: 'Consultation Mode',
    selectSlot: 'Select an available slot',

    signInTitle: 'Sign In to RuralCare Connect',
    registerTitle: 'Create Patient or Doctor Account',
    fullNameLabel: 'Full Name',
    emailLabel: 'Email Address',
    phoneLabel: 'Mobile Phone Number',
    roleLabel: 'Account Role',
    villageDistrictLabel: 'Village & District',
    iAmPatient: 'Patient (Seeking Care)',
    iAmDoctor: 'Doctor (Medical Specialist)',
    demoNotice: 'Demo Mode: Use quick login credentials to explore instantly.',
    quickFill: 'Quick Fill Demo Credentials'
  },

  hi: {
    brandName: 'रूरलकेयर कनेक्ट',
    brandTagline: 'दूरी से परे, विशेषज्ञ स्वास्थ्य सेवा।',
    home: 'होम',
    dashboard: 'डैशबोर्ड',
    findSpecialist: 'विशेषज्ञ खोजें',
    healthAssessment: 'स्वास्थ्य मूल्यांकन',
    appointments: 'अपॉइंटमेंट्स',
    medicalReports: 'मेडिकल रिपोर्ट्स',
    consultations: 'परामर्श',
    referrals: 'रेफरल',
    myReferrals: 'मेरे रेफरल',
    followUp: 'फॉलो-अप',
    followUpCare: 'फॉलो-अप देखभाल',
    notifications: 'सूचनाएं',
    profile: 'प्रोफ़ाइल',
    logout: 'लॉग आउट',
    login: 'लॉग इन',
    register: 'पंजीकरण',
    signInOrRegister: 'लॉग इन / पंजीकरण',
    welcome: 'स्वागत है',

    bookConsultation: 'परामर्श बुक करें',
    bookSlot: 'स्लॉट बुक करें',
    startVideoCall: 'वीडियो कॉल शुरू करें',
    startAudioCall: 'ऑडियो कॉल शुरू करें',
    chat: 'चैट',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    viewDetails: 'विवरण देखें',
    startAssessment: 'मूल्यांकन शुरू करें',
    findSpecialistsFor: 'विशेषज्ञ खोजें',
    acceptReferral: 'रेफरल स्वीकार करें',
    requestHospitalAppointment: 'अस्पताल अपॉइंटमेंट का अनुरोध करें',
    markCompleted: 'विजिट पूर्ण चिह्नित करें',
    scheduleFollowUp: 'फॉलो-अप निर्धारित करें',
    uploadReport: 'रिपोर्ट अपलोड करें',
    clearFilters: 'फ़िल्टर हटाएं',
    resetAll: 'रीसेट करें',
    joinRoom: 'रूम में शामिल हों',
    retakeAssessment: 'पुनः मूल्यांकन करें',
    getRecommendation: 'विशेषज्ञता सुझाव प्राप्त करें',
    openReports: 'रिपोर्ट देखें',
    openChat: 'चैट खोलें',
    startConsultation: 'परामर्श शुरू करें',

    hospital: 'अस्पताल',
    doctor: 'डॉक्टर',
    specialty: 'विशेषज्ञता',
    date: 'दिनांक',
    time: 'समय',
    status: 'स्थिति',
    priority: 'प्राथमिकता',
    highPriority: 'उच्च प्राथमिकता',
    normalPriority: 'सामान्य प्राथमिकता',
    urgentPriority: 'प्राथमिकता',
    city: 'शहर',
    district: 'ज़िला',
    state: 'राज्य',
    experience: 'अनुभव',
    fee: 'शुल्क',
    years: 'वर्ष',
    allSpecialties: 'सभी विशेषज्ञताएं',
    allHospitals: 'सभी संबद्ध अस्पताल',
    verifiedSpecialist: 'सत्यापित विशेषज्ञ',
    verificationPending: 'सत्यापन लंबित',

    statusRequested: 'अनुरोधित',
    statusConfirmed: 'पुष्टीकृत',
    statusCompleted: 'पूर्ण',
    statusCancelled: 'रद्द',
    statusCreated: 'निर्मित',
    statusViewed: 'देखा गया',
    statusAccepted: 'स्वीकृत',
    statusAppointmentRequested: 'अपॉइंटमेंट अनुरोधित',
    statusUpcoming: 'आगामी',

    emergencyWarning:
      'आपातकाल? टेलीकंसल्टेशन का इंतजार न करें। तुरंत अपने नजदीकी आपातकालीन स्वास्थ्य केंद्र या 108 एम्बुलेंस से संपर्क करें।',
    emergencyTitle: 'आपातकालीन सूचना',
    emergencyAction: '108 एम्बुलेंस डायल करें',
    assessmentDisclaimer:
      'महत्वपूर्ण: यह मूल्यांकन केवल एक प्रारंभिक विशेषज्ञ सुझाव प्रदान करता है। यह कोई चिकित्सीय निदान नहीं है और पेशेवर सलाह का स्थान नहीं लेता है।',
    disclaimerTitle: 'चिकित्सीय अस्वीकरण',
    ruleBasedNotice: 'नियम-आधारित सुझाव • पूरी तरह गोपनीय',

    triageTitle: 'सही विशेषज्ञ खोजें',
    triageSubtitle: 'उचित चिकित्सा विशेषज्ञता की पहचान करने के लिए कुछ बुनियादी सवालों के जवाब दें।',
    triageBadge: 'डिजिटल स्वास्थ्य मूल्यांकन',
    questionConcern: 'आपकी मुख्य स्वास्थ्य चिंता क्या है?',
    questionConcernSub: 'अपनी प्राथमिक स्वास्थ्य समस्या का चयन करें:',
    questionDuration: 'आप इस समस्या का कब से अनुभव कर रहे हैं?',
    questionPreviousConsult: 'क्या आपने पहले इस समस्या के लिए किसी डॉक्टर से परामर्श किया है?',
    questionReport: 'क्या आपके पास इस समस्या से संबंधित कोई मेडिकल रिपोर्ट है?',
    reportUploadOptional: 'वैकल्पिक: स्कैन की गई रिपोर्ट या पर्ची अपलोड करें (PDF या Image)',
    reportUploadNotice: 'नोट: सिस्टम स्वचालित रूप से रिपोर्ट की व्याख्या नहीं करता है। इसे आपके डॉक्टर के साथ सुरक्षित रूप से साझा किया जाएगा।',
    suggestedSpecialty: 'सुझाई गई विशेषज्ञता',
    triageResultExplanation: 'आपकी चुनी गई समस्या के आधार पर, संबंधित योग्य चिकित्सा विशेषज्ञ से परामर्श करने की सलाह दी जाती है।',
    triageHeroTitle: 'निश्चित नहीं हैं कि आपको किस विशेषज्ञ डॉक्टर की आवश्यकता है?',
    triageHeroSubtitle: 'बुक करने से पहले सही विशेषज्ञता (हृदय रोग, कैंसर, हड्डी रोग, आदि) की पहचान करने के लिए डिजिटल स्वास्थ्य मूल्यांकन करें।',
    yes: 'हाँ',
    no: 'नहीं',
    symptomDuration: 'लक्षण अवधि',
    priorConsultation: 'पूर्व परामर्श',
    attachedReport: 'मेडिकल रिपोर्ट',

    patientHubTitle: 'मरीज़ देखभाल एवं स्वास्थ्य केंद्र',
    patientHubSubtitle: 'टेलीपरामर्श प्रबंधित करें, अस्पताल रेफरल ट्रैक करें, डॉक्टर की पर्चियां देखें और स्वास्थ्य मूल्यांकन करें।',
    upcomingAppointments: 'आगामी अपॉइंटमेंट्स',
    upcomingAppointmentsSub: 'आपके निर्धारित विशेषज्ञ टेलीपरामर्श',
    noAppointments: 'अभी कोई अपॉइंटमेंट निर्धारित नहीं है।',
    noReferrals: 'कोई अस्पताल रेफरल नहीं मिला।',
    noFollowUps: 'कोई अनुसूचित फॉलो-अप नहीं है।',
    noReports: 'कोई मेडिकल रिपोर्ट अपलोड नहीं की गई है।',
    referralProgress: 'रेफरल प्रगति',
    clinicalReason: 'स्थानांतरण का चिकित्सीय कारण',
    referredBy: 'रेफर करने वाले डॉक्टर',
    createdOn: 'निर्मित दिनांक',
    doctorGuidance: 'डॉक्टर मार्गदर्शन नोट',
    consultationRecordSheet: 'पर्ची एवं नैदानिक पत्रक',
    doctorObservations: 'डॉक्टर नैदानिक अवलोकन',
    prescriptionsGuidance: 'दवाइयां एवं स्वास्थ्य सलाह',
    rateConsultation: 'अपने परामर्श का मूल्यांकन करें',
    rateSubtitle: 'ग्रामीण स्वास्थ्य सेवा को बेहतर बनाने के लिए अपनी प्रतिक्रिया साझा करें।',

    docDashboardTitle: 'डॉक्टर क्लिनिकल डैशबोर्ड',
    todaysConsultations: 'आज के परामर्श',
    pendingRequests: 'लंबित अनुरोध',
    followUpPatients: 'फॉलो-अप मरीज़',
    referralRequests: 'रेफरल अनुरोध',
    profileSettings: 'प्रोफ़ाइल सेटिंग्स',
    noTodayConsultations: 'आज के लिए कोई पुष्टीकृत परामर्श नहीं है।',
    noPendingRequests: 'कोई लंबित अपॉइंटमेंट अनुरोध नहीं है।',
    noFollowUpRecords: 'इस फ़िल्टर से मेल खाने वाले कोई फॉलो-अप रिकॉर्ड नहीं मिले।',
    noDoctorReferrals: 'अभी कोई अस्पताल रेफरल नहीं बनाया गया है।',
    doctorStatus: 'उपलब्धता स्थिति',
    statusAvailable: 'उपलब्ध',
    statusBusy: 'व्यस्त',
    statusOffline: 'ऑफ़लाइन',

    heroTitle: 'दूरी से परे,',
    heroHighlight: 'विशेषज्ञ स्वास्थ्य सेवा।',
    heroSubtitle: 'सीधे टेलीकंसल्टेशन, अस्पताल रेफरल, रिपोर्ट साझाकरण और डिजिटल स्क्रीनिंग के साथ ग्रामीण और शहरी विशेषज्ञ देखभाल के अंतर को मिटाना।',
    findSpecialistCta: 'सत्यापित विशेषज्ञ खोजें',
    triageCta: 'स्वास्थ्य मूल्यांकन करें',
    statsPatients: 'लाभान्वित मरीज़',
    statsDoctors: 'सत्यापित विशेषज्ञ',
    statsHospitals: 'संबद्ध अस्पताल',
    statsVillages: 'जुड़े हुए गांव',
    howItWorksTitle: 'रूरलकेयर कनेक्ट कैसे काम करता है',
    howItWorksSubtitle: 'लक्षण मूल्यांकन से लेकर अस्पताल रेफरल तक की संपूर्ण स्वास्थ्य यात्रा।',
    step1Title: '1. विशेषज्ञता पहचानें',
    step1Desc: 'बिना इंतजार किए सही चिकित्सा विशेषज्ञता जानने के लिए डिजिटल स्वास्थ्य मूल्यांकन लें।',
    step2Title: '2. सत्यापित डॉक्टर बुक करें',
    step2Desc: 'महाराष्ट्र भर के शीर्ष कैंसर रोग, हृदय रोग और अन्य विशेषज्ञों को शहर या जिले के अनुसार खोजें।',
    step3Title: '3. वीडियो/ऑडियो से परामर्श करें',
    step3Desc: 'कम इंटरनेट स्पीड पर भी रीयल-टाइम चैट और रिपोर्ट शेयरिंग के साथ सुरक्षित रूप से जुड़ें।',
    step4Title: '4. फॉलो-अप एवं अस्पताल रेफरल',
    step4Desc: 'डिजिटल पर्चियां, प्राथमिकता फॉलो-अप और बड़े अस्पतालों के लिए औपचारिक रेफरल पत्र प्राप्त करें।',
    coreFeaturesTitle: 'ग्रामीण समुदायों के लिए विशेष रूप से निर्मित',
    coreFeaturesSubtitle: 'उच्च विश्वसनीयता, कम इंटरनेट पर काम करने की क्षमता और उपयोग में बेहद आसान।',

    searchDirectoryTitle: 'सत्यापित विशेषज्ञ निर्देशिका',
    searchDirectorySubtitle: 'सुरक्षित ऑडियो/वीडियो परामर्श के लिए महाराष्ट्र और संबद्ध अस्पतालों के विशेषज्ञों को फ़िल्टर करें।',
    filterHeading: 'विशेषज्ञ खोज फ़िल्टर',
    cityDistrictPlaceholder: 'शहर या ज़िला लिखें (जैसे पुणे, सातारा)',
    statePlaceholder: 'राज्य लिखें (जैसे महाराष्ट्र)',
    showingDoctorsCount: 'उपलब्ध सत्यापित विशेषज्ञ',
    noDoctorsFoundTitle: 'आपकी फ़िल्टर शर्तों से कोई विशेषज्ञ नहीं मिला',
    noDoctorsFoundDesc: 'सभी उपलब्ध विशेषज्ञों को देखने के लिए शहर या विशेषज्ञता फ़िल्टर रीसेट करें।',
    recommendedForSpecialtyPill: 'आपके स्वास्थ्य मूल्यांकन के आधार पर सुझाई गई विशेषज्ञता',
    consultationMode: 'परामर्श माध्यम',
    selectSlot: 'उपलब्ध समय स्लॉट चुनें',

    signInTitle: 'रूरलकेयर कनेक्ट में लॉग इन करें',
    registerTitle: 'मरीज़ या डॉक्टर खाता बनाएं',
    fullNameLabel: 'पूरा नाम',
    emailLabel: 'ईमेल पता',
    phoneLabel: 'मोबाइल नंबर',
    roleLabel: 'खाता प्रकार',
    villageDistrictLabel: 'गांव एवं ज़िला',
    iAmPatient: 'मरीज़ (उपचार चाहने वाले)',
    iAmDoctor: 'डॉक्टर (चिकित्सा विशेषज्ञ)',
    demoNotice: 'डेमो मोड: तुरंत देखने के लिए दिए गए क्रेडेंशियल्स का उपयोग करें।',
    quickFill: 'डेमो क्रेडेंशियल्स भरें'
  },

  mr: {
    brandName: 'रूरलकेअर कनेक्ट',
    brandTagline: 'अंतरापलीकडे, तज्ज्ञ आरोग्यसेवा.',
    home: 'मुख्यपृष्ठ',
    dashboard: 'डॅशबोर्ड',
    findSpecialist: 'तज्ज्ञ डॉक्टर शोधा',
    healthAssessment: 'आरोग्य तपासणी',
    appointments: 'अपॉइंटमेंट्स',
    medicalReports: 'वैद्यकीय अहवाल',
    consultations: 'सल्लामसलत',
    referrals: 'रेफरल्स',
    myReferrals: 'माझे रेफरल्स',
    followUp: 'फॉलो-अप',
    followUpCare: 'फॉलो-अप काळजी',
    notifications: 'सूचना',
    profile: 'प्रोफाइल',
    logout: 'बाहेर पडा',
    login: 'लॉगिन',
    register: 'नोंदणी',
    signInOrRegister: 'लॉगिन / नोंदणी',
    welcome: 'स्वागत आहे',

    bookConsultation: 'सल्लामसलत बुक करा',
    bookSlot: 'वेळ बुक करा',
    startVideoCall: 'व्हिडिओ कॉल सुरू करा',
    startAudioCall: 'ऑडिओ कॉल सुरू करा',
    chat: 'चॅट',
    submit: 'सादर करा',
    cancel: 'रद्द करा',
    save: 'जतन करा',
    viewDetails: 'तपशील पहा',
    startAssessment: 'तपासणी सुरू करा',
    findSpecialistsFor: 'तज्ज्ञ शोधा',
    acceptReferral: 'रेफरल स्वीकारा',
    requestHospitalAppointment: 'रुग्णालय अपॉइंटमेंट विनंती करा',
    markCompleted: 'भेट पूर्ण झाली',
    scheduleFollowUp: 'फॉलो-अप निश्चित करा',
    uploadReport: 'अहवाल अपलोड करा',
    clearFilters: 'फिल्टर हटवा',
    resetAll: 'रीसेट करा',
    joinRoom: 'रूममध्ये सामील व्हा',
    retakeAssessment: 'पुन्हा तपासणी करा',
    getRecommendation: 'तज्ज्ञता शिफारस मिळवा',
    openReports: 'अहवाल पहा',
    openChat: 'चॅट उघडा',
    startConsultation: 'सल्लामसलत सुरू करा',

    hospital: 'रुग्णालय',
    doctor: 'डॉक्टर',
    specialty: 'तज्ज्ञता',
    date: 'दिनांक',
    time: 'वेळ',
    status: 'स्थिती',
    priority: 'प्राधान्य',
    highPriority: 'उच्च प्राधान्य',
    normalPriority: 'सामान्य प्राधान्य',
    urgentPriority: 'प्राधान्य',
    city: 'शहर',
    district: 'जिल्हा',
    state: 'राज्य',
    experience: 'अनुभव',
    fee: 'शुल्क',
    years: 'वर्षे',
    allSpecialties: 'सर्व तज्ज्ञता',
    allHospitals: 'सर्व संलग्न रुग्णालये',
    verifiedSpecialist: 'प्रमाणित तज्ज्ञ',
    verificationPending: 'पडताळणी प्रलंबित',

    statusRequested: 'विनंती केली',
    statusConfirmed: 'निश्चित',
    statusCompleted: 'पूर्ण',
    statusCancelled: 'रद्द',
    statusCreated: 'तयार केले',
    statusViewed: 'पाहिले',
    statusAccepted: 'स्वीकारले',
    statusAppointmentRequested: 'अपॉइंटमेंट विनंती केली',
    statusUpcoming: 'आगामी',

    emergencyWarning:
      'तातडीची वैद्यकीय मदत? ऑनलाइन सल्ल्याची वाट पाहू नका. त्वरित जवळच्या रुग्णालयाशी किंवा 108 रुग्णवाहिका सेवेशी संपर्क साधा.',
    emergencyTitle: 'तातडीची सूचना',
    emergencyAction: '108 रुग्णवाहिका बोलवा',
    assessmentDisclaimer:
      'महत्त्वाचे: हे मूल्यांकन केवळ प्राथमिक तज्ज्ञ डॉक्टर सुचवते. हे कोणतेही वैद्यकीय निदान नाही आणि डॉक्टरांच्या सल्ल्याचा पर्याय नाही.',
    disclaimerTitle: 'वैद्यकीय अस्वीकरण',
    ruleBasedNotice: 'नियम-आधारित शिफारस • पूर्णपणे गोपनीय',

    triageTitle: 'योग्य तज्ज्ञ डॉक्टर शोधा',
    triageSubtitle: 'योग्य वैद्यकीय तज्ज्ञता ओळखण्यासाठी काही मूलभूत प्रश्नांची उत्तरे द्या.',
    triageBadge: 'डिजिटल आरोग्य तपासणी',
    questionConcern: 'आपली मुख्य आरोग्य समस्या कोणती आहे?',
    questionConcernSub: 'आपल्या प्राथमिक आरोग्य समस्येची निवड करा:',
    questionDuration: 'आपणास ही समस्या किती दिवसांपासून जाणवत आहे?',
    questionPreviousConsult: 'या समस्येसाठी आपण यापूर्वी डॉक्टरांचा सल्ला घेतला आहे का?',
    questionReport: 'आपल्याकडे या समस्येशी संबंधित वैद्यकीय अहवाल आहे का?',
    reportUploadOptional: 'ऐच्छिक: स्कॅन केलेला अहवाल किंवा प्रिस्क्रिप्शन फाइल अपलोड करा (PDF किंवा Image)',
    reportUploadNotice: 'टीप: सिस्टीम आपोआप अहवालाचा अर्थ लावत नाही. तो आपण निवडलेल्या तज्ज्ञ डॉक्टरांशी सुरक्षितपणे शेअर केला जाईल.',
    suggestedSpecialty: 'सुचवलेली तज्ज्ञता',
    triageResultExplanation: 'आपण निवडलेल्या समस्येनुसार, संबंधित पात्र वैद्यकीय तज्ज्ञांचा सल्ला घेण्याची शिफारस केली जाते.',
    triageHeroTitle: 'कोणत्या तज्ज्ञ डॉक्टरांचा सल्ला घ्यावा याबाबत संभ्रमात आहात?',
    triageHeroSubtitle: 'अपॉइंटमेंट घेण्यापूर्वी योग्य तज्ज्ञता (हृदयरोग, कर्करोग, अस्थिरोग, इत्यादी) ओळखण्यासाठी डिजिटल आरोग्य तपासणी करा.',
    yes: 'होय',
    no: 'नाही',
    symptomDuration: 'लक्षण कालावधी',
    priorConsultation: 'मागील सल्लामसलत',
    attachedReport: 'वैद्यकीय अहवाल',

    patientHubTitle: 'रुग्ण काळजी व आरोग्य केंद्र',
    patientHubSubtitle: 'ऑनलाइन सल्लामसलत व्यवस्थापित करा, रुग्णालय रेफरल ट्रॅक करा, डॉक्टरांची औषधपत्रके पहा आणि आरोग्य तपासणी करा.',
    upcomingAppointments: 'आगामी अपॉइंटमेंट्स',
    upcomingAppointmentsSub: 'आपल्या नियोजित तज्ज्ञ ऑनलाइन सल्लामसलती',
    noAppointments: 'अद्याप कोणतीही अपॉइंटमेंट निश्चित नाही.',
    noReferrals: 'कोणतेही रुग्णालय रेफरल आढळले नाही.',
    noFollowUps: 'कोणतीही नियोजित फॉलो-अप काळजी नाही.',
    noReports: 'कोणताही वैद्यकीय अहवाल अपलोड केलेला नाही.',
    referralProgress: 'रेफरल प्रगती',
    clinicalReason: 'रुग्णालयात पाठवण्याचे वैद्यकीय कारण',
    referredBy: 'रेफर करणारे डॉक्टर',
    createdOn: 'तयार दिनांक',
    doctorGuidance: 'डॉक्टरांचे मार्गदर्शन टीप',
    consultationRecordSheet: 'औषधपत्रक व वैद्यकीय नोंद',
    doctorObservations: 'डॉक्टरांचे क्लिनिकल निरीक्षण',
    prescriptionsGuidance: 'औषधे व आरोग्य सल्ला',
    rateConsultation: 'सल्लामसलतीचे मूल्यांकन करा',
    rateSubtitle: 'ग्रामीण आरोग्यसेवा अधिक सक्षम करण्यासाठी आपला अभिप्राय नोंदवा.',

    docDashboardTitle: 'डॉक्टर क्लिनिकल डॅशबोर्ड',
    todaysConsultations: 'आजच्या सल्लामसलती',
    pendingRequests: 'प्रलंबित विनंत्या',
    followUpPatients: 'फॉलो-अप रुग्ण',
    referralRequests: 'रेफरल विनंत्या',
    profileSettings: 'प्रोफाइल सेटिंग्ज',
    noTodayConsultations: 'आजसाठी कोणतीही निश्चित सल्लामसलत नाही.',
    noPendingRequests: 'कोणतीही प्रलंबित अपॉइंटमेंट विनंती नाही.',
    noFollowUpRecords: 'या फिल्टरशी जुळणारे कोणतेही फॉलो-अप रेकॉर्ड आढळले नाहीत.',
    noDoctorReferrals: 'अद्याप कोणतेही रुग्णालय रेफरल तयार केलेले नाही.',
    doctorStatus: 'उपलब्धता स्थिती',
    statusAvailable: 'उपलब्ध',
    statusBusy: 'व्यस्त',
    statusOffline: 'ऑफलाइन',

    heroTitle: 'अंतरापलीकडे,',
    heroHighlight: 'तज्ज्ञ आरोग्यसेवा.',
    heroSubtitle: 'थेट ऑनलाइन सल्लामसलत, रुग्णालय रेफरल्स, अहवाल देवाणघेवाण आणि डिजिटल तपासणीद्वारे ग्रामीण आणि शहरी आरोग्यसेवेतील अंतर दूर करणे.',
    findSpecialistCta: 'प्रमाणित तज्ज्ञ शोधा',
    triageCta: 'आरोग्य तपासणी करा',
    statsPatients: 'उपचार घेतलेले रुग्ण',
    statsDoctors: 'प्रमाणित तज्ज्ञ डॉक्टर',
    statsHospitals: 'संलग्न रुग्णालये',
    statsVillages: 'जोडलेली खेडी',
    howItWorksTitle: 'रूरलकेअर कनेक्ट कसे कार्य करते',
    howItWorksSubtitle: 'लक्षण तपासणीपासून ते रुग्णालय रेफरलपर्यंतचा अखंड आरोग्य प्रवास.',
    step1Title: '१. तज्ज्ञता ओळखा',
    step1Desc: 'कोणत्याही प्रतीक्षेशिवाय योग्य वैद्यकीय तज्ज्ञता ओळखण्यासाठी डिजिटल आरोग्य तपासणी करा.',
    step2Title: '२. प्रमाणित डॉक्टर बुक करा',
    step2Desc: 'महाराष्ट्रभरातील नामवंत कर्करोग, हृदयरोग आणि इतर तज्ज्ञांना शहर किंवा जिल्ह्यानुसार शोधा.',
    step3Title: '३. व्हिडिओ/ऑडिओ सल्ला घ्या',
    step3Desc: 'कमी इंटरनेट स्पीडवरही थेट चॅट आणि अहवाल शेअरिंगसह सुरक्षितपणे संपर्क साधा.',
    step4Title: '४. फॉलो-अप व रुग्णालय रेफरल',
    step4Desc: 'डिजिटल औषधपत्रके, प्राधान्य फॉलो-अप आणि मोठ्या रुग्णालयांसाठी अधिकृत रेफरल पत्रे मिळवा.',
    coreFeaturesTitle: 'ग्रामीण भागासाठी विशेष निर्मिती',
    coreFeaturesSubtitle: 'अत्यंत विश्वासार्ह, कमी इंटरनेटवर चालणारी आणि वापरण्यास अतिशय सोपी.',

    searchDirectoryTitle: 'प्रमाणित तज्ज्ञ निर्देशिका',
    searchDirectorySubtitle: 'सुरक्षित ऑडिओ/व्हिडिओ सल्ल्यासाठी महाराष्ट्र आणि संलग्न रुग्णालयांमधील तज्ज्ञांना फिल्टर करा.',
    filterHeading: 'तज्ज्ञ शोध फिल्टर्स',
    cityDistrictPlaceholder: 'शहर किंवा जिल्हा लिहा (उदा. पुणे, सातारा)',
    statePlaceholder: 'राज्य लिहा (उदा. महाराष्ट्र)',
    showingDoctorsCount: 'उपलब्ध प्रमाणित तज्ज्ञ डॉक्टर',
    noDoctorsFoundTitle: 'आपल्या अटींनुसार तज्ज्ञ आढळले नाहीत',
    noDoctorsFoundDesc: 'सर्व उपलब्ध तज्ज्ञ डॉक्टर पाहण्यासाठी शहर किंवा तज्ज्ञता फिल्टर रीसेट करा.',
    recommendedForSpecialtyPill: 'आपल्या आरोग्य तपासणीनुसार सुचवलेले तज्ज्ञ',
    consultationMode: 'सल्लामसलत प्रकार',
    selectSlot: 'उपलब्ध वेळ निवडा',

    signInTitle: 'रूरलकेअर कनेक्टमध्ये लॉगिन करा',
    registerTitle: 'रुग्ण किंवा डॉक्टर खाते तयार करा',
    fullNameLabel: 'पूर्ण नाव',
    emailLabel: 'ईमेल पत्ता',
    phoneLabel: 'मोबाईल क्रमांक',
    roleLabel: 'खात्याचा प्रकार',
    villageDistrictLabel: 'गाव आणि जिल्हा',
    iAmPatient: 'रुग्ण (उपचार हवे असलेले)',
    iAmDoctor: 'डॉक्टर (वैद्यकीय तज्ज्ञ)',
    demoNotice: 'डेमो मोड: त्वरित पाहण्यासाठी दिलेल्या खात्यांचा वापर करा.',
    quickFill: 'डेमो माहिती भरा'
  }
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rc_language') as SupportedLanguage;
      if (saved === 'en' || saved === 'hi' || saved === 'mr') {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rc_language', lang);
    }
  };

  const value = {
    language,
    setLanguage,
    t: translations[language] || translations.en
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
