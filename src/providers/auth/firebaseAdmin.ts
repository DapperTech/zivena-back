import {
  App,
  applicationDefault,
  cert,
  getApps,
  initializeApp
} from "firebase-admin/app";
import { env } from "../../config/env";

let firebaseAdminApp: App | undefined;

export const getFirebaseAdminApp = (): App => {
  if (firebaseAdminApp) return firebaseAdminApp;

  const existing = getApps()[0];
  if (existing) {
    firebaseAdminApp = existing;
    return existing;
  }

  if (!env.firebaseProjectId) {
    throw new Error("FIREBASE_PROJECT_ID is required");
  }

  const credential =
    env.firebaseClientEmail && env.firebasePrivateKey
      ? cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey: env.firebasePrivateKey.replace(/\\n/g, "\n")
        })
      : applicationDefault();

  firebaseAdminApp = initializeApp({
    credential,
    projectId: env.firebaseProjectId
  });
  return firebaseAdminApp;
};
