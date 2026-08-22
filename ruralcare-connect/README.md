# RuralCare Connect

> **TAGLINE:** "Specialized Healthcare, Beyond Distance."
> **PROJECT TYPE:** Rural Specialist Telemedicine Platform (Hackathon Prototype)

RuralCare Connect is a full-stack telemedicine platform designed to help patients in rural and underserved areas access qualified medical specialists. When specialized healthcare is not locally available, patients can discover verified doctors, share reports securely, consult remotely, and coordinate continuous care via follow-ups or physical hospital referrals.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS (Mobile-First, high contrast layout)
- **Backend:** Firebase (Authentication, Cloud Firestore, Cloud Storage)
- **Icons:** Lucide React

---

## 🔑 Demo Login Credentials
For rapid evaluation, the application runs automatically in **Mock Mode (LocalStorage Fallback)** if Firebase environment variables are not configured. You can use *any* password to sign in:

| Role | Username / Email | Password | Fictional Persona Details |
| :--- | :--- | :--- | :--- |
| **Patient** | `ramesh@demo.com` | *Any text* | Ramesh Sawant, Kasba Village, Satara |
| **Doctor** | `doc-1@demo.com` | *Any text* | Dr. Priya Sharma, Oncologist, Mumbai |
| **Admin** | `admin@demo.com` | *Any text* | Platform Operations Administrator |

---

## ⚡ How to Run Locally

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Install Dependencies
Navigate to the project directory and install the required npm packages:
```bash
npm install
```

### 3. Start Development Server
Launch the local Vite server:
```bash
npm run dev
```
Open the output URL (typically `http://localhost:5173`) in your browser.

---

## ⚙️ Environment Variables (`.env`)
To connect the application to a live Firebase instance, rename `.env.example` to `.env` in the root folder and paste your keys:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*Note: If these variables are set to `placeholder` or empty, the app automatically runs in Mock Mode using LocalStorage.*

---

## 📂 Firestore Collections Schema

The database is structured around the following 11 collections:

1. **`users`**: Master profiles for Patients, Doctors, and Admins.
2. **`doctors`**: Detailed clinical records, specialty, fees, and verification statuses.
3. **`hospitals`**: Fictional medical institution locations and affiliated specialties.
4. **`appointments`**: Booked consultation transactions with IDs formatted as `RC-APT-2026-XXXX`.
5. **`availability`**: Active scheduling calendar blocks set by doctors.
6. **`consultations`**: Clinical diagnosis notes, prescriptions, and referral instructions written by doctors.
7. **`medicalReports`**: Metadata and secure upload URLs for patient scans.
8. **`referrals`**: Direct referral letters for physical clinical visits.
9. **`notifications`**: In-app notifications triggering reminders.
10. **`feedback`**: Fictional patient reviews (1-5 stars) and ratings.

---

## 🛡️ Firebase Security Rules

### 1. Firestore Rules (`firestore.rules`)
Ensures HIPAA-mock compliance:
- Patients can only read/write their own profiles and upload their own medical reports.
- Doctors and Admins are permitted to read reports for active consultations.
- Only Admins have write access to update doctor verification statuses (`verificationStatus`) or register hospitals.

### 2. Storage Rules (`storage.rules`)
- Restricts document uploads strictly to the folder matching the patient's authenticated UID: `/medical_reports/{patientId}/{fileName}`.
- Prevents public read access. Only authenticated owners and medical personnel can retrieve document download URLs.

---

## ⚠️ Important Notices & Prototype Limitations

1. **Non-Emergency Notice:** The landing screen and booking dialogs clearly display warnings. The platform is not an emergency response service.
2. **Fictional Data Disclaimer:** All doctors, clinics, ratings, and records are 100% fictional.
3. **Prototype Consultation Room:** The video/audio consultation room uses a styled WebRTC streaming simulation with fully functional microphone muting, camera blanking, live clinical note-taking, and referral routing.
4. **Offline Mode:** File uploads in Mock Mode read files as Base64 Data URLs and store them locally inside the browser. Live Mode uploads directly to Firebase Storage.
