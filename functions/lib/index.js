"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
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
exports.getUser = exports.deleteUser = exports.listUsers = void 0;
const admin = __importStar(require("firebase-admin"));
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
admin.initializeApp();
const listUsers = async (request, response) => {
    try {
        const listUsersResult = await admin.auth().listUsers();
        response.status(200).json(listUsersResult.users);
    }
    catch (error) {
        console.error("Error listing users:", error); // Using console.error as logger was removed
        response.status(500).send("Error listing users.");
    }
};
exports.listUsers = listUsers;
const deleteUser = async (request, response) => {
    const uid = request.body.uid;
    try {
        await admin.auth().deleteUser(uid);
        response.status(200).send(`Successfully deleted user ${uid}`);
    }
    catch (error) {
        console.error("Error deleting user:", error); // Using console.error
        response.status(500).send("Error deleting user.");
    }
};
exports.deleteUser = deleteUser;
const getUser = async (request, response) => {
    const uid = request.body.uid;
    try {
        const userRecord = await admin.auth().getUser(uid);
        response.status(200).json(userRecord);
    }
    catch (error) {
        console.error("Error fetching user:", error); // Using console.error
        response.status(500).send("Error fetching user.");
    }
};
exports.getUser = getUser;
// Note: The Firebase Functions Quickstart for TypeScript uses onRequest, 
// but these example functions are structured more like callable functions or basic HTTP requests.
// If these are intended to be actual HTTP-triggered functions deployable via Firebase, 
// they should be wrapped with `onRequest`. For now, to fix the build, I'm assuming direct export
// for potential use with Express or similar, or that `onRequest` was a leftover import.
// The `logger` calls have been replaced with `console.error`.
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
//# sourceMappingURL=index.js.map