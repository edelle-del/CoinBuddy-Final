import {
  Alert,
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
import { verticalScale } from "@/utils/styling";
import { colors, spacingX, spacingY } from "@/constants/theme";
import Typo from "@/components/Typo";
import * as Icons from "phosphor-react-native";
import { useAuth } from "@/contexts/authContext";

const SignUp = () => {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const repeatPasswordRef = useRef("");
  const nameRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const { register } = useAuth();

  const onSubmit = async () => {
    if (!emailRef.current || !passwordRef.current || !nameRef.current || !repeatPasswordRef.current) {
      Alert.alert("Register", "Please fill all the fields!");
      return;
    }
    
    // Check if passwords match
    if (passwordRef.current !== repeatPasswordRef.current) {
      Alert.alert("Register", "Passwords do not match!");
      return;
    }
    
    // register api
    setLoading(true);
    const res = await register(
      emailRef.current,
      passwordRef.current,
      nameRef.current
    );
    setLoading(false);
    if (!res.success) {
      Alert.alert("Register", res.msg);
    } else {
      router.push({
        pathname: "/(auth)/verify",
        params: { email: emailRef.current },
      } as any);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const toggleShowRepeatPassword = () => {
    setShowRepeatPassword(prev => !prev);
  };

  return (
    <ScreenWrapper>
      <StatusBar style="light" />
      <View style={styles.container}>
        <BackButton iconSize={28}/>

        {/* welcome */}
        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={"800"} color={colors.neutral900}>
            Let's
          </Typo>
          <Typo size={30} fontWeight={"800"} color={colors.neutral900}>
            Get Started
          </Typo>
        </View>

        {/* form */}
        <View style={styles.form}>
          <Typo size={16} color={colors.neutral900}>
            Create an account to track your expenses
          </Typo>
          <Input
            icon={
              <Icons.User
                size={verticalScale(26)}
                color={colors.neutral900}
                weight="fill"
              />
            }
            placeholder="Enter your name"
            onChangeText={(value) => (nameRef.current = value)}
          />
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
          <View style={styles.passwordContainer}>
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
              style={styles.passwordInput}
            />
            <Pressable 
              style={styles.eyeIcon} 
              onPress={toggleShowPassword}
            >
              {showPassword ? (
                <Icons.Eye
                  size={verticalScale(24)}
                  color={colors.neutral900}
                  weight="fill"
                />
              ) : (
                <Icons.EyeSlash
                  size={verticalScale(24)}
                  color={colors.neutral900}
                  weight="fill"
                />
              )}
            </Pressable>
          </View>
          
          <View style={styles.passwordContainer}>
            <Input
              icon={
                <Icons.Lock
                  size={verticalScale(26)}
                  color={colors.neutral900}
                  weight="fill"
                />
              }
              placeholder="Confirm your password"
              secureTextEntry={!showRepeatPassword}
              onChangeText={(value) => (repeatPasswordRef.current = value)}
              style={styles.passwordInput}
            />
            <Pressable 
              style={styles.eyeIcon} 
              onPress={toggleShowRepeatPassword}
            >
              {showRepeatPassword ? (
                <Icons.Eye
                  size={verticalScale(24)}
                  color={colors.neutral900}
                  weight="fill"
                />
              ) : (
                <Icons.EyeSlash
                  size={verticalScale(24)}
                  color={colors.neutral900}
                  weight="fill"
                />
              )}
            </Pressable>
          </View>
          
          {/* button */}
          <Button loading={loading} onPress={onSubmit}>
            <Typo fontWeight={"700"} color={colors.white} size={21}>
              Sign Up
            </Typo>
          </Button>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Typo size={15} color={colors.neutral900}>Already have an account?</Typo>
          <Pressable onPress={() => router.navigate("/(auth)/login" as any)}>
            <Typo size={15} fontWeight={"700"} color={colors.primary}>
              Login
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default SignUp;

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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacingX._15,
    top: '50%',
    transform: [{ translateY: -verticalScale(12) }],
    zIndex: 1,
  },
  forgotPassword: {
    textAlign: "right",
    fontWeight: "500",
    color: colors.text,
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