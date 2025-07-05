import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from "expo-router";
import { getFunctions, httpsCallable } from "firebase/functions";
import * as ImagePicker from 'expo-image-picker';
import ScreenWrapper from "@/components/ScreenWrapper";
import Header from "@/components/Header";
import { colors } from "@/constants/theme";
import * as Icons from "phosphor-react-native";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { signInWithCustomToken } from "firebase/auth";
import { auth, firebase, firestore } from "@/config/firebase";

export default function QRScannerModal() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return "****";
    
    // Show only the last 4 digits, mask the rest
    if (accountNumber.length <= 4) {
      return "*".repeat(accountNumber.length);
    }
    
    const lastFour = accountNumber.slice(-4);
    const maskedPart = "*".repeat(accountNumber.length - 4);
    return maskedPart + lastFour;
  };

  const processQRData = async (data: string) => {
    try {
      const url = new URL(data);
      const token = url.searchParams.get("token");

      if (!token) throw new Error("Invalid QR code: Token missing");

      const tokenDocRef = doc(firestore, "qrTokens", token);
      const tokenDoc = await getDoc(tokenDocRef);

      if (!tokenDoc.exists()) throw new Error("Invalid or expired token");

      const tokenData = tokenDoc.data();

      if (tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date())
        throw new Error("Token has expired");

      if (tokenData.scannedAt) throw new Error("Token already used");

      if (!tokenData.uid) throw new Error("Token has no associated user");

      // 👉 FETCH USER PROFILE HERE
      const userRef = doc(firestore, "users", tokenData.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) throw new Error("User profile not found");

      const userProfile = userSnap.data();

      // ✅ Show only name and masked account number
      const maskedAccountNumber = maskAccountNumber(userProfile.accountNumber);
      Alert.alert("Profile Found", `Name: ${userProfile.name}\nAccount: ${maskedAccountNumber}`);

      // ✅ Mark token as used
      await updateDoc(tokenDocRef, {
        scannedAt: serverTimestamp(),
      });

      router.back();
    } catch (error: any) {
      console.error("QR scan failed:", error);
      Alert.alert("Error", error.message || "QR scan failed");
      setScanned(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    await processQRData(data);
  };

  const handleImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload QR codes!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        try {
          const scanResults = await Camera.scanFromURLAsync(imageUri, ['qr']);
          
          if (scanResults && scanResults.length > 0) {
            await processQRData(scanResults[0].data);
          } else {
            Alert.alert("No QR Code", "No QR code found in the selected image.");
          }
        } catch (cameraError) {
          console.log("Camera scan failed:", cameraError);
          Alert.alert("Scan Failed", "Could not scan QR code from the image. Please try using the camera instead.");
        }
      }
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Error", "Failed to process the image. Please try again.");
    }
  };

  if (hasPermission === null) {
    return (
      <ScreenWrapper>
        <Header title="Scan QR Code" />
        <View style={styles.centeredContainer}>
          <Text>Requesting camera permission...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (hasPermission === false) {
    return (
      <ScreenWrapper>
        <Header title="Scan QR Code" />
        <View style={styles.centeredContainer}>
          <Text>No access to camera</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header title="Scan QR Code" />
      <View style={styles.container}>
        <CameraView 
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'], 
          }}
          style={StyleSheet.absoluteFillObject}
        />
        
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleImageUpload}
        >
          <Icons.Image 
            size={24} 
            color={colors.white} 
            weight="fill" 
          />
        </TouchableOpacity>

        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>Scan the QR code</Text>
          <Text style={styles.subInstruction}>
            or tap the image icon to upload from gallery
          </Text>
        </View>

        {scanned && (
          <TouchableOpacity 
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanText}>Tap to scan again</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    padding: 15,
    zIndex: 1,
  },
  instructionContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
  },
  instruction: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  subInstruction: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rescanText: {
    color: '#fff',
    fontSize: 14,
  },
});