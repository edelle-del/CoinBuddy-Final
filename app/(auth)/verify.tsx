import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import Button from "@/components/Button";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/authContext";
import { colors, spacingX, spacingY } from "@/constants/theme";
import * as Icons from "phosphor-react-native";

const VerifyEmailScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const {
    checkEmailVerification,
    resendVerificationEmail,
    user,
    setUser,
    login,
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (user?.emailVerified) {
      router.replace({ pathname: "/(tabs)" } as any);
    }
  }, [user]);

  const handleCheckVerification = async () => {
    setLoading(true);
    const result = await checkEmailVerification();
    if (result.success && result.verified) {
      Alert.alert(
        "Success",
        "Your email has been verified! You will be redirected to the app."
      );
      // Manually update user state if needed, though onAuthStateChanged should handle it
      // Forcing a redirect.
      router.replace({ pathname: "/(tabs)" } as any);
    } else {
      Alert.alert(
        "Verification Failed",
        result.msg || "Your email is not verified yet. Please check your inbox or try resending the email."
      );
    }
    setLoading(false);
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    const result = await resendVerificationEmail();
    if (result.success) {
      Alert.alert(
        "Email Sent",
        "A new verification email has been sent to your address."
      );
    } else {
      Alert.alert("Error", result.msg || "Failed to resend verification email.");
    }
    setResendLoading(false);
  };

  return (
    <ScreenWrapper>
      <StatusBar style="light" />
      <View style={styles.container}>
        <BackButton />

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icons.Envelope
              size={80}
              color={colors.primary}
              weight="duotone"
            />
          </View>
          <Typo size={28} fontWeight="bold" style={styles.title}>
            Verify Your Email
          </Typo>
          <Typo size={16} style={styles.subtitle}>
            We've sent a verification link to{" "}
            <Typo fontWeight="bold">{email}</Typo>. Please check your inbox and
            follow the link to activate your account.
          </Typo>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            loading={loading}
            onPress={handleCheckVerification}
            style={{ backgroundColor: colors.primary }}
          >
            <Typo fontWeight="bold" color={colors.white} size={18}>
              I've Verified My Email
            </Typo>
          </Button>
          <Button
            loading={resendLoading}
            onPress={handleResendEmail}
            style={{
              backgroundColor: "transparent",
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Typo fontWeight="bold" color={colors.primary} size={18}>
              Resend Verification Link
            </Typo>
          </Button>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => router.replace({ pathname: "/(auth)/login" } as any)}>
            <Typo size={15} color={colors.neutral600}>
              Go back to{" "}
              <Typo size={15} fontWeight="bold" color={colors.primary}>
                Login
              </Typo>
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    justifyContent: "space-between",
    paddingVertical: spacingY._30,
  },
  header: {
    alignItems: "center",
    gap: spacingY._20,
    marginTop: -spacingY._30,
  },
  iconContainer: {
    padding: 20,
    borderRadius: 99,
    backgroundColor: "rgba(78, 115, 248, 0.1)",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: colors.neutral700,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: spacingY._15,
  },
  footer: {
    alignItems: "center",
  },
});

export default VerifyEmailScreen;
