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

export const authenticateWithQRToken = functions.https.onCall(
  async (request, context) => {
    const { token } = request.data as { token: string };

    if (!token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing 'token' parameter."
      );
    }

    try {
      // Get the token document from Firestore
      const tokenDoc = await admin.firestore()
        .collection('qrTokens')
        .doc(token)
        .get();

      if (!tokenDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found", 
          "Invalid or expired token"
        );
      }

      const tokenData = tokenDoc.data();

      if (!tokenData) {
        throw new functions.https.HttpsError(
          "internal", 
          "Token data is invalid"
        );
      }

      // Check if token has expired (if you added expiration)
      if (tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
        throw new functions.https.HttpsError(
          "deadline-exceeded", 
          "Token has expired"
        );
      }

      // Check if token has already been used
      if (tokenData.scannedAt) {
        throw new functions.https.HttpsError(
          "already-exists", 
          "Token has already been used"
        );
      }

      if (!tokenData.uid) {
        throw new functions.https.HttpsError(
          "failed-precondition", 
          "Token has no associated user"
        );
      }

      // Generate custom token for the user
      const customToken = await admin.auth().createCustomToken(tokenData.uid);

      // Mark token as used
      await admin.firestore()
        .collection('qrTokens')
        .doc(token)
        .update({
          scannedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      return { customToken };

    } catch (error) {
      console.error('QR authentication error:', error);
      
      // Re-throw Firebase errors
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      // Wrap other errors
      throw new functions.https.HttpsError(
        "internal", 
        "Authentication failed"
      );
    }
  }
);