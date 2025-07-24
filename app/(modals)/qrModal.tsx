import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/authContext";
import QRCode from "react-native-qrcode-svg";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { colors } from "@/constants/theme";

export default function QRModal() {
  const { user } = useAuth();
  const [tokenUrl, setTokenUrl] = useState<string | null>(null);

  useEffect(() => {
    const generateToken = async () => {
      if (!user) return;

      const tokenRef = await addDoc(collection(firestore, "qrTokens"), {
        uid: user.uid, // Fixed: Use the actual user ID instead of null
        createdAt: serverTimestamp(),
        scannedAt: null,
      });

      const url = `https://coinbuddy.com/qr-login?token=${tokenRef.id}`;
      setTokenUrl(url);
    };

    generateToken();
  }, [user]);

  if (!tokenUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Generating QR Code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan this QR code to view a profile</Text>
      <QRCode value={tokenUrl} size={250} />
      <Text style={styles.subtitle}>
        Scan with another device to authenticate
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: colors.neutral500,
  },
  title: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
  },
  subtitle: {
    marginTop: 16,
    fontSize: 14,
    color: colors.neutral500,
    textAlign: "center",
  },
});