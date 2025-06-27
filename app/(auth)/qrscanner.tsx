import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useRouter } from "expo-router";
import { getFunctions, httpsCallable } from "firebase/functions";
import { signInWithCustomToken, getAuth } from "firebase/auth";

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    try {
      const url = new URL(data);
      const uid = url.searchParams.get("uid");

      if (!uid) throw new Error("Invalid QR code: UID missing");

      const functions = getFunctions();
      const generateCustomToken = httpsCallable(functions, "generateCustomToken");

      const response = await generateCustomToken({ uid });
      const { token } = response.data as { token: string };

      await signInWithCustomToken(auth, token);

      Alert.alert("Success", "You are now logged in.");
      router.back();
    } catch (error) {
      console.error("QR login failed:", error);
      Alert.alert("Error", "QR login failed.");
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.instruction}>Scan the QR code</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  instruction: {
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "#fff",
    padding: 16,
    textAlign: "center",
    fontSize: 16,
  },
});
