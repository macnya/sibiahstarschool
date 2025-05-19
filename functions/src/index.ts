
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from 'firebase-admin';
// import {onRequest} from "firebase-functions/v2/https"; // Unused import
// import * as logger from "firebase-functions/logger"; // Unused import, logger calls replaced by console.error

admin.initializeApp();

export const listUsers = async (request: any, response: any) => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    response.status(200).json(listUsersResult.users);
  } catch (error) {
    console.error("Error listing users:", error); 
    response.status(500).send("Error listing users.");
  }
}; // Added missing closing brace

export const deleteUser = async (request: any, response: any) => {
  const uid = request.body.uid;

  try {
    await admin.auth().deleteUser(uid);
    response.status(200).send(`Successfully deleted user ${uid}`);
  } catch (error) {
    console.error("Error deleting user:", error); 
    response.status(500).send("Error deleting user.");
  }
}; // Added missing closing brace

export const getUser = async (request: any, response: any) => {
  const uid = request.body.uid;

  try {
    const userRecord = await admin.auth().getUser(uid);
    response.status(200).json(userRecord);
  } catch (error) {
    console.error("Error fetching user:", error); 
    response.status(500).send("Error fetching user.");
  }
}; // Added missing closing brace

// Note: The Firebase Functions Quickstart for TypeScript uses onRequest,
// but these example functions are structured more like callable functions or basic HTTP requests.
// If these are intended to be actual HTTP-triggered functions deployable via Firebase,
// they should be wrapped with `onRequest`. For now, to fix the build, I'm assuming direct export
// for potential use with Express or similar, or that `onRequest` was a leftover import.

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
