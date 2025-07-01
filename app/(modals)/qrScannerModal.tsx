import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from "expo-router";
import { getFunctions, httpsCallable } from "firebase/functions";
import { signInWithCustomToken } from "firebase/auth";
import * as ImagePicker from 'expo-image-picker';
import ScreenWrapper from "@/components/ScreenWrapper";
import Header from "@/components/Header";
import { colors } from "@/constants/theme";
import * as Icons from "phosphor-react-native";
import { auth } from "@/config/firebase"; // Import your configured Firebase auth

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

  const processQRData = async (data: string) => {
    try {
      const url = new URL(data);
      const uid = url.searchParams.get("uid");

      if (!uid) throw new Error("Invalid QR code: UID missing");

      const functions = getFunctions(); // Remove app parameter to use default
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

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    await processQRData(data);
  };

  const handleImageUpload = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload QR codes!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        try {
          // Method 1: Try expo-camera's scanFromURLAsync
          const scanResults = await Camera.scanFromURLAsync(imageUri, ['qr']);
          
          if (scanResults && scanResults.length > 0) {
            await processQRData(scanResults[0].data);
          } else {
            Alert.alert("No QR Code", "No QR code found in the selected image.");
          }
        } catch (cameraError) {
          console.log("Camera scan failed, trying alternative method:", cameraError);
          
          // Method 2: Fallback to third-party library approach
          await handleImageWithLibrary(imageUri);
        }
      }
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Error", "Failed to process the image. Please try again.");
    }
  };

  const handleImageWithLibrary = async (imageUri: string) => {
    try {
      // Using jsQR library approach
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convert to base64 for processing
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Create an image element to get image data
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          
          // This would work in a web environment with jsQR
          // For React Native, we need a different approach
          Alert.alert("Processing", "Image processing not fully implemented yet. Please use camera scanning.");
        };
        img.src = base64;
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Library processing failed:", error);
      Alert.alert("Processing Failed", "Could not process the QR code from the image. Please try using the camera instead.");
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
        
        {/* Upload button */}
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

        {/* Instruction text */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>Scan the QR code</Text>
          <Text style={styles.subInstruction}>
            or tap the image icon to upload from gallery
          </Text>
        </View>
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
});