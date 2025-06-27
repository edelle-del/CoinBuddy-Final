import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const generateCustomToken = functions.https.onCall(
  async (request, context) => { // 'request' is of type CallableRequest<T>
    const { uid } = request.data as { uid: string }; // Access data from 'request.data' and cast it

    if (!uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing 'uid' parameter."
      );
    }

    try {
      const token = await admin.auth().createCustomToken(uid);
      return { token };
    } catch (error) {
      console.error("Token creation error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Token generation failed"
      );
    }
  }
);