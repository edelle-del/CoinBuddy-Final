import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useRef, useState } from "react";
import ScreenWrapper from "../../components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import BackButton from "@/components/BackButton";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { scale, verticalScale } from "@/utils/styling";
import { colors, spacingX, spacingY } from "@/constants/theme";
import Typo from "@/components/Typo";
import * as Icons from "phosphor-react-native";
import { useAuth } from "@/contexts/authContext";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { firestore } from "@/firebase";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode.react";

const Login = () => {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const onSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("Login", "please fill all the fields!");
      return;
    }
    setLoading(true);
    const res = await login(emailRef.current, passwordRef.current);
    setLoading(false);
    if (!res.success) {
      Alert.alert("Login", res.msg);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  async function generateQRToken() {
    const token = uuidv4(); // unique token
    const ref = doc(collection(firestore, "qrTokens"), token);

    await setDoc(ref, {
      uid: null,
      createdAt: Timestamp.now(),
      scannedAt: null,
    });

    return token;
  }

  return (
    <ScreenWrapper>
      <StatusBar style="light" />
      <View style={styles.container}>
        <BackButton iconSize={28} />
        {/* welcome */}
        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={"800"} color={colors.neutral900}>
            Hey,
          </Typo>
          <Typo size={30} fontWeight={"800"} color={colors.neutral900}>
            Welcome Back
          </Typo>
        </View>

        {/* form */}
        <View style={styles.form}>
          <Typo size={16} color={colors.neutral900}>
            Login now to track all your expenses
          </Typo>
          <Input
            icon={
              <Icons.At
                size={verticalScale(26)}
                color={colors.neutral900}
                weight="fill"
              />
            }
            placeholder="Enter your email"
            onChangeText={(value) => (emailRef.current = value)}
          />
          
          {/* Custom password input with toggle */}
          <View style={styles.passwordWrapper}>
            <Input
              icon={
                <Icons.Lock
                  size={verticalScale(26)}
                  color={colors.neutral900}
                  weight="fill"
                />
              }
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              onChangeText={(value) => (passwordRef.current = value)}
            />
            <Pressable
              onPress={togglePasswordVisibility}
              style={styles.eyeIconButton}
            >
              {showPassword ? (
                <Icons.Eye
                  size={verticalScale(22)}
                  color={colors.neutral700}
                  weight="fill"
                />
              ) : (
                <Icons.EyeSlash
                  size={verticalScale(22)}
                  color={colors.neutral700}
                  weight="fill"
                />
              )}
            </Pressable>
          </View>
          
          <Typo size={14} color={colors.primary} style={{ alignSelf: "flex-end" }}>
            Forgot Password?
          </Typo>
          
          {/* button */}
          <Button loading={loading} onPress={onSubmit}>
            <Typo fontWeight={"700"} color={colors.white} size={21}>
              Login
            </Typo>
          </Button>
        </View>
        
        


        {/* footer */}
        <View style={styles.footer}>
          <Typo size={15} color={colors.neutral900}>Dont't have an account?</Typo>
          <Pressable onPress={() => router.push("/(auth)/register" as any)}>
            <Typo size={15} fontWeight={"700"} color={colors.primary}>
              Sign up
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    color: colors.text,
  },
  form: {
    gap: spacingY._20,
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeIconButton: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    textAlign: "center",
    color: colors.text,
    fontSize: verticalScale(15),
  },
});
