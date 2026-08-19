/* ============================================================
   FIREBASE SETUP
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com
   2. Create a free project (Spark plan — $0)
   3. Add a "Web app" inside the project
   4. Copy the config object it gives you and paste the values
      below, replacing the placeholders.
   5. In the Firebase console, enable:
       - Authentication → Sign-in method → Email/Password
       - Firestore Database → Create database (start in
         "production mode" is fine — rules are set below)
   6. In Firestore → Rules, paste this and click Publish:

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /users/{userId}/data/{docId} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
          }
        }
      }

   That's it — this keeps your data private to your own account,
   and free tier limits are far more than one person will use.

   Until you fill this in, the app runs in "local only" mode —
   fully usable on one device, it just won't sync between devices.
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyCgX6rgml4Ph7BVj1Qbh1szyuARZUBUpK8",
    authDomain: "tracker-app-3a0b5.firebaseapp.com",
    projectId: "tracker-app-3a0b5",
    storageBucket: "tracker-app-3a0b5.firebasestorage.app",
    messagingSenderId: "1003570725486",
    appId: "1:1003570725486:web:6c5d494a0b0076139f5c7f",
    measurementId: "G-Q807M6QMSY"
  };

// Don't touch below — used to detect whether you've filled in real keys yet.
const FIREBASE_CONFIGURED = firebaseConfig.apiKey !== "YOUR_API_KEY";
