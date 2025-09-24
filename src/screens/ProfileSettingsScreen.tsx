// src/screens/ProfileSettingsScreen.tsx
// User profile settings with micronutrient integration

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '@/stores/user-store';
import { useMicronutrientsStore } from '@/stores/micronutrients-store';
import Button from '@/components/atoms/Button';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';
import type { MicronutrientProfile, PrimaryGoal, Modifier } from '@/services/micros/engine';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Sex = 'male' | 'female' | 'other';

const ProfileSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    user,
    updateProfile,
    calculateMacros,
    setGoalType,
    needsMacroRecalculation,
    goals
  } = useUserStore();

  const {
    calculateMicronutrients,
    checkRecomputePolicy,
    ui: microUI
  } = useMicronutrientsStore();

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    age: user?.age?.toString() || '',
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
    sex: user?.sex || 'other' as Sex,
    activity_level: user?.activity_level || 'moderate' as ActivityLevel,
    goal_type: goals.goal_type || 'maintenance' as PrimaryGoal,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Activity level options
  const activityLevels: Array<{key: ActivityLevel; label: string; description: string}> = [
    { key: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { key: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { key: 'moderate', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { key: 'active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
    { key: 'very_active', label: 'Super Active', description: 'Very hard exercise, physical job' },
  ];

  // Goal type options
  const goalTypes: Array<{key: PrimaryGoal; label: string; description: string}> = [
    { key: 'weight_loss', label: 'Weight Loss', description: 'Lose weight gradually' },
    { key: 'maintenance', label: 'Maintenance', description: 'Maintain current weight' },
    { key: 'muscle_gain', label: 'Muscle Gain', description: 'Build muscle mass' },
    { key: 'body_recomposition', label: 'Body Recomposition', description: 'Lose fat, gain muscle' },
  ];

  // Sex options
  const sexOptions: Array<{key: Sex; label: string}> = [
    { key: 'male', label: 'Male' },
    { key: 'female', label: 'Female' },
    { key: 'other', label: 'Other' },
  ];

  const updateFormData = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const isFormValid = () => {
    const age = parseInt(formData.age);
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);

    return (
      formData.name.trim() &&
      formData.email.trim() &&
      age > 0 && age < 120 &&
      height > 0 && height < 300 &&
      weight > 0 && weight < 500 &&
      formData.sex &&
      formData.activity_level
    );
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      Alert.alert('Invalid Data', 'Please fill in all fields with valid values.');
      return;
    }

    setIsLoading(true);

    try {
      const age = parseInt(formData.age);
      const height = parseFloat(formData.height);
      const weight = parseFloat(formData.weight);

      // Check if profile changes affect calculations
      const profileChanged = (
        user?.age !== age ||
        user?.height !== height ||
        user?.weight !== weight ||
        user?.sex !== formData.sex ||
        user?.activity_level !== formData.activity_level
      );

      const goalChanged = goals.goal_type !== formData.goal_type;

      // Update user profile
      await updateProfile({
        name: formData.name,
        email: formData.email,
        age,
        height,
        weight,
        sex: formData.sex,
        activity_level: formData.activity_level,
      });

      // Update goal type if changed
      if (goalChanged) {
        await setGoalType(formData.goal_type);
      }

      // Recalculate micronutrients if needed
      if (profileChanged || goalChanged) {
        console.log('Profile/goal changed - checking micronutrient recalculation');

        // Create micronutrient profile
        const microProfile: MicronutrientProfile = {
          sex: formData.sex,
          age_years: age,
          height_cm: height,
          weight_kg: weight,
          life_stage: age >= 71 ? '71+' : age >= 51 ? '51-70' : age >= 31 ? '31-50' : '19-30',
          activity_level: formData.activity_level,
        };

        // Check if micronutrient recalculation is needed
        if (checkRecomputePolicy(microProfile, formData.goal_type)) {
          console.log('Triggering micronutrient recalculation');
          // For now, use basic modifiers - this could be expanded based on user preferences
          const modifiers: Modifier[] = [];

          await calculateMicronutrients(
            microProfile,
            goals.daily_calorie_goal || 2000,
            formData.goal_type,
            modifiers
          );
        }
      }

      Alert.alert(
        'Profile Updated',
        profileChanged || goalChanged
          ? 'Your profile has been updated and nutrition targets have been recalculated.'
          : 'Your profile has been updated.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              placeholder="Your name"
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              placeholder="your@email.com"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sex</Text>
            <Text style={styles.helperText}>Used for accurate nutrition calculations</Text>
            <View style={styles.optionsContainer}>
              {sexOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionButton,
                    formData.sex === option.key && styles.optionButtonActive,
                  ]}
                  onPress={() => updateFormData('sex', option.key)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.sex === option.key && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Physical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Information</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Age (years)</Text>
              <TextInput
                style={styles.input}
                value={formData.age}
                onChangeText={(text) => updateFormData('age', text)}
                placeholder="25"
                placeholderTextColor={colors.gray[400]}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={formData.height}
                onChangeText={(text) => updateFormData('height', text)}
                placeholder="170"
                placeholderTextColor={colors.gray[400]}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={formData.weight}
              onChangeText={(text) => updateFormData('weight', text)}
              placeholder="70"
              placeholderTextColor={colors.gray[400]}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Activity & Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity & Goals</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activity Level</Text>
            <Text style={styles.helperText}>How active are you?</Text>
            {activityLevels.map((level) => (
              <TouchableOpacity
                key={level.key}
                style={[
                  styles.activityOption,
                  formData.activity_level === level.key && styles.activityOptionActive,
                ]}
                onPress={() => updateFormData('activity_level', level.key)}
              >
                <View style={styles.activityContent}>
                  <Text
                    style={[
                      styles.activityLabel,
                      formData.activity_level === level.key && styles.activityLabelActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                  <Text
                    style={[
                      styles.activityDescription,
                      formData.activity_level === level.key && styles.activityDescriptionActive,
                    ]}
                  >
                    {level.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    formData.activity_level === level.key && styles.radioButtonActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primary Goal</Text>
            <Text style={styles.helperText}>What's your main fitness goal?</Text>
            {goalTypes.map((goal) => (
              <TouchableOpacity
                key={goal.key}
                style={[
                  styles.activityOption,
                  formData.goal_type === goal.key && styles.activityOptionActive,
                ]}
                onPress={() => updateFormData('goal_type', goal.key)}
              >
                <View style={styles.activityContent}>
                  <Text
                    style={[
                      styles.activityLabel,
                      formData.goal_type === goal.key && styles.activityLabelActive,
                    ]}
                  >
                    {goal.label}
                  </Text>
                  <Text
                    style={[
                      styles.activityDescription,
                      formData.goal_type === goal.key && styles.activityDescriptionActive,
                    ]}
                  >
                    {goal.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    formData.goal_type === goal.key && styles.radioButtonActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calculation Status */}
        {(needsMacroRecalculation() || microUI.isLoading) && (
          <View style={styles.statusSection}>
            <View style={styles.statusHeader}>
              <Ionicons name="refresh" size={16} color={colors.orange[500]} />
              <Text style={styles.statusTitle}>Calculation Status</Text>
            </View>
            <Text style={styles.statusText}>
              {microUI.isLoading
                ? 'Calculating personalized nutrition targets...'
                : 'Your nutrition targets will be recalculated when you save.'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={isLoading || microUI.isLoading}
          disabled={!isFormValid()}
          style={styles.saveButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray[600],
  },
  optionTextActive: {
    color: colors.primary,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  activityOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  activityLabelActive: {
    color: colors.primary,
  },
  activityDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
  },
  activityDescriptionActive: {
    color: colors.primary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginLeft: spacing.sm,
  },
  radioButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  statusSection: {
    backgroundColor: colors.orange[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.orange[500],
    marginBottom: spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.orange[800],
    marginLeft: spacing.xs,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    color: colors.orange[700],
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
});

export default ProfileSettingsScreen;