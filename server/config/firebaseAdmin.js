import admin from "firebase-admin";
import path from "path";

// Service Account JSON ka path
const serviceAccount = path.resolve("./config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;