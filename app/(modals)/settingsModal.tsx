"use client";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { colors, spacingX, spacingY } from "@/constants/theme";
import ModalWrapper from "@/components/ModalWrapper";
import Header from "@/components/Header";
import Typo from "@/components/Typo";
import { useAuth } from "@/contexts/authContext";
import { NotificationPreferences } from "@/types";
import Button from "@/components/Button";
import { scale, verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native";
import { useRouter } from "expo-router";
import BackButton from "@/components/BackButton";
import { createBackup, restoreBackup } from "@/services/backupService";

const SettingsModal = () => {
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailAlerts: false,
    appPushNotifications: true,
  });
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const router = useRouter();

  const { user, updateNotificationPreferences, updateUserData, refreshData } = useAuth();

  useEffect(() => {
    // Initialize with user's current preferences if available
    if (user?.notificationPreferences) {
      setNotificationPrefs(user.notificationPreferences);
    }
  }, [user]);

  const toggleEmailAlerts = () => {
    setNotificationPrefs({
      ...notificationPrefs,
      emailAlerts: !notificationPrefs.emailAlerts,
    });
  };

  const toggleAppNotifications = () => {
    setNotificationPrefs({
      ...notificationPrefs,
      appPushNotifications: !notificationPrefs.appPushNotifications,
    });
  };

  const onSubmit = async () => {
    setLoading(true);

    const res = await updateNotificationPreferences(notificationPrefs);
    setLoading(false);
    
    if (res.success) {
      Alert.alert("Success", "Notification preferences updated successfully");
      router.back();
    } else {
      Alert.alert("Error", res.msg || "Failed to update notification preferences");
    }
  };

  const handleBackup = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "You must be logged in to backup your data");
      return;
    }

    Alert.alert(
      "Create Backup",
      "This will create a backup file of all your data. You'll need to save this file to restore your data later.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Create Backup", 
          onPress: async () => {
            setBackupLoading(true);
            const result = await createBackup(user?.uid);
            setBackupLoading(false);

            if (result.success) {
              Alert.alert("Backup Successful", result.msg);
            } else {
              Alert.alert("Backup Failed", result.msg || "An unknown error occurred.");
            }
          }
        }
      ]
    );
  };

  const handleRestore = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "You must be logged in to restore data");
      return;
    }

    Alert.alert(
      "Restore Data",
      "This will overwrite your current data with the backup. You'll need to select a .json backup file. Are you sure you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            setRestoreLoading(true);
            const result = await restoreBackup(user?.uid);
            setRestoreLoading(false);

            if (result.success) {
              Alert.alert("Success", "Data restored successfully");
              // Refresh user data and transactions
              if (user?.uid) {
                await updateUserData(user.uid);
                refreshData(); // Trigger the refresh
              }
            } else {
              Alert.alert("Error", result.msg || "Failed to restore data");
            }
          }
        }
      ]
    );
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={"Settings"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        {/* form */}
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.sectionTitle}>
            <Typo size={20} fontWeight="700" color={colors.neutral800}>
              Notification Settings
            </Typo>
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Typo size={18} fontWeight="600" color={colors.neutral800}>
                Email Alerts
              </Typo>
              <Typo size={14} color={colors.neutral500}>
                Receive important alerts via email
              </Typo>
            </View>
            <Switch
              trackColor={{ false: colors.neutral300, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.neutral300}
              onValueChange={toggleEmailAlerts}
              value={notificationPrefs.emailAlerts}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View>
              <Typo size={18} fontWeight="600" color={colors.neutral800}>
                App Push Notifications
              </Typo>
              <Typo size={14} color={colors.neutral500}>
                Receive notifications directly on your device
              </Typo>
            </View>
            <Switch
              trackColor={{ false: colors.neutral300, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.neutral300}
              onValueChange={toggleAppNotifications}
              value={notificationPrefs.appPushNotifications}
            />
          </View>

          <View style={styles.sectionTitle}>
            <Typo size={20} fontWeight="700" color={colors.neutral800}>
              Data Management
            </Typo>
          </View>

          <View style={styles.dataManagementContainer}>
            <View style={styles.dataButtonContainer}>
              <Button 
                onPress={handleBackup} 
                style={styles.dataButton} 
                loading={backupLoading}
              >
                <Icons.DownloadSimple size={24} color={colors.white} />
                <Typo color={colors.white} fontWeight={"600"} size={16}>
                  Backup Data
                </Typo>
              </Button>
              <Typo size={14} color={colors.neutral500} style={styles.buttonDescription}>
                Download your data as a file
              </Typo>
            </View>
            
            <View style={styles.dataButtonContainer}>
              <Button 
                onPress={handleRestore} 
                style={{
                  ...styles.dataButton, 
                  backgroundColor: colors.rose
                }}
                loading={restoreLoading}
              >
                <Icons.UploadSimple size={24} color={colors.white} />
                <Typo color={colors.white} fontWeight={"600"} size={16}>
                  Restore Data
                </Typo>
              </Button>
              <Typo size={14} color={colors.neutral500} style={styles.buttonDescription}>
                Restore from .json backup file
              </Typo>
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            <Icons.Info size={20} color={colors.neutral600} />
            <Typo size={14} color={colors.neutral600} style={styles.infoText}>
              Note: When restoring data, select a .json backup file from your files. The file picker may show all files - make sure to select a CoinBuddy backup file.
            </Typo>
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button onPress={onSubmit} style={{ flex: 1 }} loading={loading}>
          <Typo color={colors.white} fontWeight={"700"} size={18}>
            Save Settings
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default SettingsModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._20,
    marginTop: spacingY._15,
    paddingBottom: spacingY._20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  sectionTitle: {
    marginTop: spacingY._10,
    marginBottom: spacingY._5,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
    paddingBottom: spacingY._10,
  },
  dataManagementContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacingY._10,
  },
  dataButtonContainer: {
    width: "48%",
  },
  dataButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: spacingY._12,
  },
  buttonDescription: {
    textAlign: "center",
    marginTop: spacingY._5,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral100,
    padding: spacingY._10,
    borderRadius: 8,
    marginTop: spacingY._10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    marginLeft: scale(8),
  },
}); 