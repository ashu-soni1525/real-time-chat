 
import admin from "firebase-admin";
// import serviceAccount from "./serviceAccountKey.json" with { type: "json" };
 
 
 
 
admin.initializeApp({
  // credential: admin.credential.cert(serviceAccount),
    credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
console.log("PROJECT ID:", process.env.FIREBASE_PROJECT_ID);
console.log("CLIENT EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("PRIVATE KEY EXISTS:", !!process.env.FIREBASE_PRIVATE_KEY);
 
export default admin;