
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v2";

admin.initializeApp();

// Example: Get user record by UID
export const getUserRecord = functions.https.onCall(async (request, response) => {
  const data = request.data as { uid: string };
  const uid = data.uid;

  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a uid."
    );
  }

  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error("Error fetching user record:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch user record",
      error
    );
  }
}); // Corrected: Added closing parenthesis and semicolon

// Example: Disable or enable user account
export const setUserDisabledStatus = functions.https.onCall(
  async (request, response) => {
    const data = request.data as { uid: string; disabled: boolean };
    const { uid, disabled } = data;

    if (!uid || disabled === undefined) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with uid and disabled status."
      );
    }

    try {
      await admin.auth().updateUser(uid, { disabled });
      return { message: `User ${uid} disabled status set to ${disabled}` };
    } catch (error) {
      console.error("Error updating user disabled status:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update user disabled status",
        error
      );
    }
  }
); // Corrected: Added closing parenthesis and semicolon

// Example: Update user profile
export const updateUserProfile = functions.https.onCall(
  async (request, response) => {
    const data = request.data as {
      uid: string;
      displayName?: string;
      email?: string;
    };
    const { uid, displayName, email } = data;

    if (!uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with uid."
      );
    }

    try {
      const updatedUser = await admin.auth().updateUser(uid, {
        displayName,
        email,
      });
      return updatedUser;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update user profile",
        error
      );
    }
  }
); // Corrected: Added closing parenthesis and semicolon

// Example Cloud Functions (commented out as they are not used yet)
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
