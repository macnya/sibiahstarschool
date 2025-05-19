/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from 'firebase-admin';
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

export const listUsers = onRequest(async (request, response) => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    response.status(200).json(listUsersResult.users);
  } catch (error) {
    logger.error("Error listing users:", error);
    response.status(500).send("Error listing users.");
  }
});

export const deleteUser = onRequest(async (request, response) => {
  const uid = request.body.uid;

  try {
    await admin.auth().deleteUser(uid);
    response.status(200).send(`Successfully deleted user ${uid}`);
  } catch (error) {
    logger.error("Error deleting user:", error);
    response.status(500).send("Error deleting user.");
  }
});

export const getUser = onRequest(async (request, response) => {
  const uid = request.body.uid;

  try {
    const userRecord = await admin.auth().getUser(uid);
    response.status(200).json(userRecord);
  } catch (error) {
    logger.error("Error fetching user:", error);
    response.status(500).send("Error fetching user.");
  }
});
// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
