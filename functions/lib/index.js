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
exports.updateUserProfile = exports.setUserDisabledStatus = exports.getUserRecord = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v2"));
admin.initializeApp();
// Example: Get user record by UID
exports.getUserRecord = functions.https.onCall(async (request, response) => {
    const data = request.data;
    const uid = data.uid;
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a uid.");
    }
    try {
        const userRecord = await admin.auth().getUser(uid);
        return userRecord;
    }
    catch (error) {
        console.error("Error fetching user record:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch user record", error);
    }
}); // Corrected: Added closing parenthesis and semicolon
// Example: Disable or enable user account
exports.setUserDisabledStatus = functions.https.onCall(async (request, response) => {
    const data = request.data;
    const { uid, disabled } = data;
    if (!uid || disabled === undefined) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with uid and disabled status.");
    }
    try {
        await admin.auth().updateUser(uid, { disabled });
        return { message: `User ${uid} disabled status set to ${disabled}` };
    }
    catch (error) {
        console.error("Error updating user disabled status:", error);
        throw new functions.https.HttpsError("internal", "Failed to update user disabled status", error);
    }
}); // Corrected: Added closing parenthesis and semicolon
// Example: Update user profile
exports.updateUserProfile = functions.https.onCall(async (request, response) => {
    const data = request.data;
    const { uid, displayName, email } = data;
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with uid.");
    }
    try {
        const updatedUser = await admin.auth().updateUser(uid, {
            displayName,
            email,
        });
        return updatedUser;
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        throw new functions.https.HttpsError("internal", "Failed to update user profile", error);
    }
}); // Corrected: Added closing parenthesis and semicolon
// Example Cloud Functions (commented out as they are not used yet)
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
//# sourceMappingURL=index.js.map