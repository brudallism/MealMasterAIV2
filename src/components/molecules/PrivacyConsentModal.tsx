// src/components/molecules/PrivacyConsentModal.tsx
// Privacy consent modal for GDPR/CCPA compliance and user data transparency

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { logger } from '../../services/logging';
import { PrivacyConsents } from '../../stores/user-store';

interface PrivacyConsentModalProps {
  visible: boolean;
  onAccept: (consents: PrivacyConsents) => void;
  onDecline: () => void;
  isFirstTime?: boolean; // If true, shows as required consent. If false, shows as settings
}

const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({
  visible,
  onAccept,
  onDecline,
  isFirstTime = true
}) => {
  const [consents, setConsents] = useState<PrivacyConsents>({
    dataCollection: true,  // Required for app functionality - auto-enabled
    analytics: false,      // Optional
    crashReporting: true,  // Default to true (helps improve app)
    aiProcessing: true,    // Required for AI features - auto-enabled
    marketing: false,      // Always optional
    consentDate: Date.now(),
    version: '1.0'
  });

  const handleConsentToggle = (key: keyof PrivacyConsents) => {
    // Don't allow toggling non-boolean fields
    if (key === 'consentDate' || key === 'version') return;

    logger.debug('Privacy consent toggled', 'PrivacyConsentModal', {
      consentType: key,
      newValue: !consents[key]
    });

    setConsents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAccept = () => {
    // Validate required consents
    if (!consents.dataCollection) {
      Alert.alert(
        'Data Collection Required',
        'Basic data collection is required for MealMasterAI to function (storing your meals, calculating nutrition, etc.). This data stays private and secure.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!consents.aiProcessing) {
      Alert.alert(
        'AI Processing Required',
        'AI processing is required for food recognition, macro calculations, and personalized recommendations. Your data is processed securely and never shared.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Create final consent object with current timestamp
    const finalConsents: PrivacyConsents = {
      ...consents,
      consentDate: Date.now(),
      version: '1.0'
    };

    logger.info('Privacy consents accepted', 'PrivacyConsentModal', {
      consents: finalConsents,
      isFirstTime,
      timestamp: finalConsents.consentDate
    });

    onAccept(finalConsents);
  };

  const handleDecline = () => {
    if (isFirstTime) {
      Alert.alert(
        'Cannot Use App',
        'MealMasterAI requires basic data processing to function. Without these permissions, the app cannot track your nutrition or provide personalized recommendations.',
        [
          { text: 'Review Consents', style: 'default' },
          {
            text: 'Exit App',
            style: 'destructive',
            onPress: onDecline
          }
        ]
      );
    } else {
      onDecline();
    }
  };

  const openPrivacyPolicy = () => {
    // For now, we'll create a simple privacy policy.
    // In production, this should link to your actual hosted privacy policy
    logger.info('Privacy policy link clicked', 'PrivacyConsentModal');

    Alert.alert(
      'Privacy Policy',
      'MealMasterAI is committed to protecting your privacy. We only collect data necessary to provide nutrition tracking and AI-powered food recognition. Your personal data is never sold or shared with third parties.\n\nFor questions, contact: privacy@mealmasterai.com',
      [
        { text: 'OK' },
        {
          text: 'Email Us',
          onPress: () => Linking.openURL('mailto:privacy@mealmasterai.com?subject=Privacy Policy Question')
        }
      ]
    );
  };

  const ConsentToggle = ({
    title,
    description,
    consentKey,
    required = false,
    isEnabled
  }: {
    title: string;
    description: string;
    consentKey: keyof PrivacyConsents;
    required?: boolean;
    isEnabled: boolean;
  }) => (
    <TouchableOpacity
      style={styles.consentItem}
      onPress={() => !required && handleConsentToggle(consentKey)}
      disabled={required}
    >
      <View style={styles.consentHeader}>
        <Text style={[styles.consentTitle, required && styles.requiredText]}>
          {title} {required && '*'}
        </Text>
        <View style={[
          styles.toggle,
          (isEnabled || required) && styles.toggleActive,
          required && styles.toggleRequired
        ]}>
          <Ionicons
            name={(isEnabled || required) ? "checkmark" : "close"}
            size={16}
            color={required ? colors.background.tertiary : (isEnabled ? colors.background.tertiary : colors.gray[400])}
          />
        </View>
      </View>
      <Text style={styles.consentDescription}>
        {description}
        {required && " (Required for app functionality)"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDecline}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary[600]} />
            <Text style={styles.headerTitle}>Privacy & Data</Text>
          </View>
          {!isFirstTime && (
            <TouchableOpacity onPress={onDecline} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isFirstTime && (
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome to MealMasterAI!</Text>
              <Text style={styles.welcomeText}>
                We're committed to transparency about how your data is used. Please review and customize your privacy preferences below.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Processing Permissions</Text>
            <Text style={styles.sectionSubtitle}>
              Control how MealMasterAI processes your information
            </Text>

            <ConsentToggle
              title="Basic Data Collection"
              description="Store your meals, nutrition data, and preferences locally and securely. Required for core app functionality."
              consentKey="dataCollection"
              required={true}
              isEnabled={consents.dataCollection}
            />

            <ConsentToggle
              title="AI Food Processing"
              description="Process food descriptions and images through AI to provide nutrition calculations and meal suggestions."
              consentKey="aiProcessing"
              required={true}
              isEnabled={consents.aiProcessing}
            />

            <ConsentToggle
              title="Anonymous Analytics"
              description="Help improve MealMasterAI by sharing anonymous usage patterns (no personal data shared)."
              consentKey="analytics"
              isEnabled={consents.analytics}
            />

            <ConsentToggle
              title="Crash Reporting"
              description="Automatically report app crashes to help us fix bugs and improve stability."
              consentKey="crashReporting"
              isEnabled={consents.crashReporting}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Data Rights</Text>
            <View style={styles.rightsContainer}>
              <View style={styles.rightItem}>
                <Ionicons name="eye" size={20} color={colors.primary[600]} />
                <Text style={styles.rightText}>View all data we store about you</Text>
              </View>
              <View style={styles.rightItem}>
                <Ionicons name="download" size={20} color={colors.primary[600]} />
                <Text style={styles.rightText}>Export your data at any time</Text>
              </View>
              <View style={styles.rightItem}>
                <Ionicons name="trash" size={20} color={colors.primary[600]} />
                <Text style={styles.rightText}>Delete your account and all data</Text>
              </View>
              <View style={styles.rightItem}>
                <Ionicons name="settings" size={20} color={colors.primary[600]} />
                <Text style={styles.rightText}>Change these preferences anytime in Settings</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.privacyPolicyButton} onPress={openPrivacyPolicy}>
            <Ionicons name="document-text" size={20} color={colors.primary[600]} />
            <Text style={styles.privacyPolicyText}>Read Full Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          {isFirstTime ? (
            <>
              <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
                <Text style={styles.declineButtonText}>Cannot Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                <Text style={styles.acceptButtonText}>Accept & Continue</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.cancelButton} onPress={onDecline}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAccept}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    marginLeft: spacing.sm,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  welcomeSection: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  welcomeText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  consentItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  consentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    flex: 1,
  },
  requiredText: {
    color: colors.primary[600],
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.success[500],
  },
  toggleRequired: {
    backgroundColor: colors.primary[600],
  },
  consentDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  rightsContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rightText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginLeft: spacing.md,
    flex: 1,
  },
  privacyPolicyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.lg,
  },
  privacyPolicyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.primary[600],
    flex: 1,
    marginLeft: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.md,
  },
  declineButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.gray[600],
  },
  acceptButton: {
    flex: 2,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.background.tertiary,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.gray[600],
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.background.tertiary,
  },
});

export default PrivacyConsentModal;