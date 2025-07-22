import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';

const PrivacyModal = () => {
  const router = useRouter();
  const [isAccepted, setIsAccepted] = useState(false);

  const handleClose = () => {
    router.back();
  };

  const handleAccept = () => {
    // Handle privacy policy acceptance here
    setIsAccepted(true);
    
    // You might want to:
    // - Save acceptance status to AsyncStorage or your preferred storage
    // - Update user preferences in your backend
    console.log('Privacy policy accepted');
    
    // Optional: Navigate back after a delay to show the "Accepted" state
    // setTimeout(() => {
    //   router.back();
    // }, 2000);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icons.X size={24} color={colors.neutral800} weight="bold" />
          </TouchableOpacity>
          <Typo size={18} fontWeight="600" color={colors.neutral800}>
            Privacy Policy
          </Typo>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Typo size={16} fontWeight="600" color={colors.neutral800} style={styles.sectionTitle}>
              Information We Collect
            </Typo>
            <Typo size={14} color={colors.neutral600} style={styles.sectionText}>
              We collect information you provide directly to us, such as when you create an account, update your profile, or contact us for support.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={16} fontWeight="600" color={colors.neutral800} style={styles.sectionTitle}>
              How We Use Your Information
            </Typo>
            <Typo size={14} color={colors.neutral600} style={styles.sectionText}>
              We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={16} fontWeight="600" color={colors.neutral800} style={styles.sectionTitle}>
              Information Sharing
            </Typo>
            <Typo size={14} color={colors.neutral600} style={styles.sectionText}>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={16} fontWeight="600" color={colors.neutral800} style={styles.sectionTitle}>
              Data Security
            </Typo>
            <Typo size={14} color={colors.neutral600} style={styles.sectionText}>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={16} fontWeight="600" color={colors.neutral800} style={styles.sectionTitle}>
              Your Rights
            </Typo>
            <Typo size={14} color={colors.neutral600} style={styles.sectionText}>
              You have the right to access, update, or delete your personal information. You can also opt out of certain communications from us.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={16} fontWeight="600" color={colors.neutral800} style={styles.sectionTitle}>
              Contact Us
            </Typo>
            <Typo size={14} color={colors.neutral600} style={styles.sectionText}>
              If you have any questions about this Privacy Policy, please contact us at coinbuddy@gmail.com.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo size={12} color={colors.neutral500} style={styles.lastUpdated}>
              Last updated: July 2025
            </Typo>
          </View>
        </ScrollView>

        {/* Accept Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.acceptButton,
              isAccepted && styles.acceptedButton
            ]} 
            onPress={handleAccept}
            disabled={isAccepted}
          >
            <View style={styles.buttonContent}>
              {isAccepted && (
                <Icons.Check size={20} color={colors.white} weight="bold" style={styles.checkIcon} />
              )}
              <Typo size={16} fontWeight="600" color={colors.white}>
                {isAccepted ? 'Accepted' : 'Accept Privacy Policy'}
              </Typo>
            </View>
            
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default PrivacyModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  closeButton: {
    padding: spacingX._5,
  },
  placeholder: {
    width: 34, // Same width as close button to center the title
  },
  content: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  section: {
    marginTop: spacingY._20,
  },
  sectionTitle: {
    marginBottom: spacingY._7,
  },
  sectionText: {
    lineHeight: 20,
  },
  lastUpdated: {
    textAlign: 'center',
    marginTop: spacingY._10,
    marginBottom: spacingY._20,
  },
  buttonContainer: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    backgroundColor: colors.white,
  },
  acceptButton: {
    backgroundColor: colors.primary, // Adjust to your primary color
    paddingVertical: spacingY._15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptedButton: {
    backgroundColor: colors.neutral500, // Green color for accepted state
    // You can use a different color like colors.neutral600 for a disabled look
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: spacingX._7,
  },
});