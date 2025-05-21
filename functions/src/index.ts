
import * as admin from "firebase-admin";
// import * as functions from "firebase-functions/v2"; // Commented out if not used

// Initialize Firebase Admin SDK if not already initialized
// Ensure this is called only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// All auth-related functions are commented out as per user request.

// Example: Get user record by UID (Illustrative, not directly used in current admin setup)
/*
export const getUserRecord = functions.https.onCall(async (request) => {
  const uid = request.data.uid;

  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a uid."
    );
  }

  try {
    const userRecord = await admin.auth().getUser(uid);
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      disabled: userRecord.disabled,
      customClaims: userRecord.customClaims,
    };
  } catch (error) {
    console.error("Error fetching user record:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch user record"
    );
  }
});
*/

// Example: Disable or enable user account (Illustrative)
/*
export const setUserDisabledStatus = functions.https.onCall(
  async (request) => {
    const { uid, disabled } = request.data;

    if (!uid || disabled === undefined) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with uid and disabled status."
      );
    }
    // TODO: Add check to ensure only admins can call this function
    try {
      await admin.auth().updateUser(uid, { disabled });
      return { message: `User ${uid} disabled status set to ${disabled}` };
    } catch (error) {
      console.error("Error updating user disabled status:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update user disabled status"
      );
    }
  }
);
*/

// Example: Update user profile (Illustrative)
/*
export const updateUserProfile = functions.https.onCall(
  async (request) => {
    const { uid, displayName, email } = request.data;

    if (!uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with uid."
      );
    }
    // TODO: Add check
    try {
      const updatedUser = await admin.auth().updateUser(uid, {
        displayName,
        email,
      });
      return {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
      };
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update user profile"
      );
    }
  }
);
*/

/**
 * Sets a custom claim { isAdmin: true } for a user.
 * This function should be secured to only allow existing admins to call it.
 * For initial setup, you might call this manually or from a trusted environment.
 */
/*
export const setAdminClaim = functions.https.onCall(async (request) => {
  const email = request.data.email;
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with an "email" argument.'
    );
  }

  // IMPORTANT: In a production app, you MUST secure this function.
  // For example, check if the caller is already an admin:
  // if (request.auth?.token?.isAdmin !== true) {
  //   throw new functions.https.HttpsError(
  //     'permission-denied',
  //     'Only an admin can set admin claims.'
  //   );
  // }

  try {
    const user = await admin.auth().getUserByEmail(email);
    if (user.customClaims && (user.customClaims as any).isAdmin) {
      return { message: `User ${email} is already an admin.` };
    }
    await admin.auth().setCustomUserClaims(user.uid, { isAdmin: true });
    return { message: `Successfully made ${email} an admin.` };
  } catch (error) {
    console.error('Error setting admin claim:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set admin claim.');
  }
});
*/

// Placeholder for any future non-auth related functions
// export const myNonAuthFunction = functions.https.onRequest((req, res) => { ... });
