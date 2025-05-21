'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminClaim = exports.updateUserProfile = exports.setUserDisabledStatus = exports.getUserRecord = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v2"));
// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Example: Get user record by UID (Illustrative, not directly used in current admin setup)
exports.getUserRecord = functions.https.onCall(async (request) => {
    // const data = request.data as { uid: string }; // Using request.data for callable
    const uid = request.data.uid;
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a uid.");
    }
    try {
        const userRecord = await admin.auth().getUser(uid);
        return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            disabled: userRecord.disabled,
            customClaims: userRecord.customClaims,
            // Add other properties you want to return
        };
    }
    catch (error) {
        console.error("Error fetching user record:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch user record");
    }
});
// Example: Disable or enable user account (Illustrative)
exports.setUserDisabledStatus = functions.https.onCall(async (request) => {
    // const data = request.data as { uid: string; disabled: boolean };
    const { uid, disabled } = request.data;
    if (!uid || disabled === undefined) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with uid and disabled status.");
    }
    // TODO: Add check to ensure only admins can call this function
    // if (!request.auth?.token?.isAdmin) {
    //   throw new functions.https.HttpsError(
    //     "permission-denied",
    //     "Caller is not an administrator."
    //   );
    // }
    try {
        await admin.auth().updateUser(uid, { disabled });
        return { message: `User ${uid} disabled status set to ${disabled}` };
    }
    catch (error) {
        console.error("Error updating user disabled status:", error);
        throw new functions.https.HttpsError("internal", "Failed to update user disabled status");
    }
});
// Example: Update user profile (Illustrative)
exports.updateUserProfile = functions.https.onCall(async (request) => {
    // const data = request.data as {
    //   uid: string;
    //   displayName?: string;
    //   email?: string;
    // };
    const { uid, displayName, email } = request.data;
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with uid.");
    }
    // TODO: Add check to ensure only admins can call this function or user is updating their own profile
    // if (!request.auth?.token?.isAdmin && request.auth?.uid !== uid) {
    //   throw new functions.https.HttpsError(
    //     "permission-denied",
    //     "Caller is not authorized to perform this action."
    //   );
    // }
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
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        throw new functions.https.HttpsError("internal", "Failed to update user profile");
    }
});
/**
 * Sets a custom claim { isAdmin: true } for a user.
 * This function should be secured to only allow existing admins to call it.
 * For initial setup, you might call this manually or from a trusted environment.
 */
exports.setAdminClaim = functions.https.onCall(async (request) => {
    // IMPORTANT: In a production app, you MUST secure this function.
    // For example, check if the caller is already an admin:
    // if (request.auth?.token?.isAdmin !== true) {
    //   throw new functions.https.HttpsError(
    //     'permission-denied',
    //     'Only an admin can set admin claims.'
    //   );
    // }
    const email = request.data.email;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an "email" argument.');
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        if (user.customClaims && user.customClaims.isAdmin) {
            return { message: `User ${email} is already an admin.` };
        }
        await admin.auth().setCustomUserClaims(user.uid, { isAdmin: true });
        return { message: `Successfully made ${email} an admin.` };
    }
    catch (error) {
        console.error('Error setting admin claim:', error);
        throw new functions.https.HttpsError('internal', 'Failed to set admin claim.');
    }
});
//# sourceMappingURL=index.js.map