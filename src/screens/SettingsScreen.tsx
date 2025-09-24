// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../stores/user-store';
import { useMicronutrientsStore } from '../stores/micronutrients-store';
import SentryTestButton from '../components/atoms/SentryTestButton';

type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';

interface UserProfile {
  name: string;
  age: string;
  weight: string;
  height: string;
  activityLevel: ActivityLevel;
  macroGoals: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateProfile, setGoals } = useUserStore();
  const { getOrderedDisplayList } = useMicronutrientsStore();

  // Unit system state
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
    user?.preferred_units || 'metric'
  );

  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    weight: user?.weight?.toString() || '',
    height: user?.height?.toString() || '',
    activityLevel: 'moderately_active',
    macroGoals: {
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    },
  });

  // Convert weight display based on unit system
  const getWeightDisplay = () => {
    if (unitSystem === 'imperial') {
      const weightKg = parseFloat(profile.weight) || 0;
      const weightLbs = Math.round(weightKg * 2.20462);
      return weightLbs.toString();
    }
    return profile.weight;
  };

  // Convert height display based on unit system
  const getHeightDisplay = () => {
    if (unitSystem === 'imperial') {
      const heightCm = parseFloat(profile.height) || 0;
      const totalInches = Math.round(heightCm / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}'${inches}"`;
    }
    return profile.height;
  };

  // Handle weight input change with unit conversion
  const handleWeightChange = (text: string) => {
    if (unitSystem === 'imperial') {
      const weightLbs = parseFloat(text) || 0;
      const weightKg = Math.round((weightLbs / 2.20462) * 10) / 10;
      setProfile(prev => ({ ...prev, weight: weightKg.toString() }));
    } else {
      setProfile(prev => ({ ...prev, weight: text }));
    }
  };

  // Handle height input change with unit conversion
  const handleHeightChange = (text: string) => {
    if (unitSystem === 'imperial') {
      // Parse feet'inches" format
      const match = text.match(/(\d+)'(\d+)"/);
      if (match) {
        const feet = parseInt(match[1]);
        const inches = parseInt(match[2]);
        const totalInches = feet * 12 + inches;
        const heightCm = Math.round(totalInches * 2.54);
        setProfile(prev => ({ ...prev, height: heightCm.toString() }));
      }
    } else {
      setProfile(prev => ({ ...prev, height: text }));
    }
  };

  const [isManualMacros, setIsManualMacros] = useState(false);

  const activityLevels: Array<{ key: ActivityLevel; label: string; description: string }> = [
    { key: 'sedentary', label: 'Sedentary', description: 'Little/no exercise' },
    { key: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { key: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { key: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
    { key: 'extra_active', label: 'Extra Active', description: 'Very hard exercise & physical job' },
  ];

  const calculateMacros = () => {
    const weight = parseFloat(profile.weight);
    const height = parseFloat(profile.height);
    const age = parseInt(profile.age);

    if (!weight || !height || !age) {
      Alert.alert('Missing Information', 'Please fill in your age, weight, and height to calculate macros.');
      return;
    }

    // Calculate BMR using Mifflin-St Jeor Equation (assuming male for simplicity)
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5;

    // Activity multipliers
    const activityMultipliers: Record<ActivityLevel, number> = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };

    const tdee = bmr * activityMultipliers[profile.activityLevel];
    const calories = Math.round(tdee);

    // Standard macro split: 30% protein, 40% carbs, 30% fat
    const protein = Math.round((calories * 0.3) / 4); // 4 cal per gram
    const carbs = Math.round((calories * 0.4) / 4); // 4 cal per gram
    const fat = Math.round((calories * 0.3) / 9); // 9 cal per gram

    setProfile(prev => ({
      ...prev,
      macroGoals: {
        calories: calories.toString(),
        protein: protein.toString(),
        carbs: carbs.toString(),
        fat: fat.toString(),
      },
    }));

    Alert.alert(
      'Macros Calculated',
      `Based on your profile:\nCalories: ${calories}\nProtein: ${protein}g\nCarbs: ${carbs}g\nFat: ${fat}g`,
    );
  };

  const handleSave = () => {
    // Validate required fields
    if (!profile.name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }

    // Update user profile including unit preference
    const updatedUser = {
      name: profile.name.trim(),
      age: parseInt(profile.age) || undefined,
      weight: parseFloat(profile.weight) || undefined,
      height: parseFloat(profile.height) || undefined,
      preferred_units: unitSystem,
    };

    updateProfile(updatedUser);

    // Update goals if they are set
    const calories = parseInt(profile.macroGoals.calories);
    const protein = parseInt(profile.macroGoals.protein);
    const carbs = parseInt(profile.macroGoals.carbs);
    const fat = parseInt(profile.macroGoals.fat);

    if (calories && protein && carbs && fat) {
      setGoals({
        daily_calorie_goal: calories,
        protein_goal: protein,
        carb_goal: carbs,
        fat_goal: fat,
      });
    }

    Alert.alert('Success', 'Your profile has been saved successfully!');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Profile',
      'Are you sure you want to reset all your profile data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setProfile({
              name: '',
              age: '',
              weight: '',
              height: '',
              activityLevel: 'moderately_active',
              macroGoals: {
                calories: '',
                protein: '',
                carbs: '',
                fat: '',
              },
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings & Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Unit System Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unit System</Text>
          <View style={styles.unitToggleContainer}>
            <TouchableOpacity
              style={[
                styles.unitToggle,
                unitSystem === 'metric' && styles.unitToggleActive,
              ]}
              onPress={() => setUnitSystem('metric')}
            >
              <Text
                style={[
                  styles.unitToggleText,
                  unitSystem === 'metric' && styles.unitToggleTextActive,
                ]}
              >
                Metric (kg, cm)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitToggle,
                unitSystem === 'imperial' && styles.unitToggleActive,
              ]}
              onPress={() => setUnitSystem('imperial')}
            >
              <Text
                style={[
                  styles.unitToggleText,
                  unitSystem === 'imperial' && styles.unitToggleTextActive,
                ]}
              >
                Imperial (lbs, ft/in)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={profile.name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                value={profile.age}
                onChangeText={(text) => setProfile(prev => ({ ...prev, age: text }))}
                placeholder="25"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.inputLabel}>
                Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
              </Text>
              <TextInput
                style={styles.textInput}
                value={getWeightDisplay()}
                onChangeText={handleWeightChange}
                placeholder={unitSystem === 'imperial' ? '154' : '70'}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Height ({unitSystem === 'imperial' ? 'ft\'in"' : 'cm'})
            </Text>
            <TextInput
              style={styles.textInput}
              value={getHeightDisplay()}
              onChangeText={handleHeightChange}
              placeholder={unitSystem === 'imperial' ? '5\'9"' : '175'}
              placeholderTextColor="#9CA3AF"
              keyboardType={unitSystem === 'imperial' ? 'default' : 'numeric'}
            />
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          {activityLevels.map((level) => (
            <TouchableOpacity
              key={level.key}
              style={[
                styles.activityOption,
                profile.activityLevel === level.key && styles.activityOptionSelected,
              ]}
              onPress={() => setProfile(prev => ({ ...prev, activityLevel: level.key }))}
            >
              <View style={styles.activityInfo}>
                <Text
                  style={[
                    styles.activityLabel,
                    profile.activityLevel === level.key && styles.activityLabelSelected,
                  ]}
                >
                  {level.label}
                </Text>
                <Text
                  style={[
                    styles.activityDescription,
                    profile.activityLevel === level.key && styles.activityDescriptionSelected,
                  ]}
                >
                  {level.description}
                </Text>
              </View>
              {profile.activityLevel === level.key && (
                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Macro Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Macro Goals</Text>
            <TouchableOpacity
              style={styles.calculateButton}
              onPress={calculateMacros}
            >
              <Ionicons name="calculator" size={16} color="#4F46E5" />
              <Text style={styles.calculateButtonText}>Calculate</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsManualMacros(!isManualMacros)}
          >
            <Text style={styles.toggleLabel}>Manual macro editing</Text>
            <View style={[styles.toggle, isManualMacros && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isManualMacros && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>

          <View style={styles.macroGrid}>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput
                style={[styles.textInput, !isManualMacros && styles.textInputDisabled]}
                value={profile.macroGoals.calories}
                onChangeText={(text) => setProfile(prev => ({
                  ...prev,
                  macroGoals: { ...prev.macroGoals, calories: text }
                }))}
                placeholder="2000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={isManualMacros}
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={[styles.textInput, !isManualMacros && styles.textInputDisabled]}
                value={profile.macroGoals.protein}
                onChangeText={(text) => setProfile(prev => ({
                  ...prev,
                  macroGoals: { ...prev.macroGoals, protein: text }
                }))}
                placeholder="150"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={isManualMacros}
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <TextInput
                style={[styles.textInput, !isManualMacros && styles.textInputDisabled]}
                value={profile.macroGoals.carbs}
                onChangeText={(text) => setProfile(prev => ({
                  ...prev,
                  macroGoals: { ...prev.macroGoals, carbs: text }
                }))}
                placeholder="200"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={isManualMacros}
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Fat (g)</Text>
              <TextInput
                style={[styles.textInput, !isManualMacros && styles.textInputDisabled]}
                value={profile.macroGoals.fat}
                onChangeText={(text) => setProfile(prev => ({
                  ...prev,
                  macroGoals: { ...prev.macroGoals, fat: text }
                }))}
                placeholder="67"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={isManualMacros}
              />
            </View>
          </View>
        </View>

        {/* Micronutrients Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Micronutrients</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('MicronutrientSelection' as never)}
            >
              <Ionicons name="create" size={16} color="#4F46E5" />
              <Text style={styles.editButtonText}>Customize</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.micronutrientsList}>
            {getOrderedDisplayList().slice(0, 6).map((micronutrient) => (
              <View key={micronutrient.id} style={styles.micronutrientItem}>
                <View style={styles.micronutrientInfo}>
                  <Text style={styles.micronutrientName}>{micronutrient.name}</Text>
                  <Text style={styles.micronutrientUnit}>({micronutrient.unit})</Text>
                </View>
                {micronutrient.minimizeFlag && (
                  <View style={styles.minimizeIndicator}>
                    <Ionicons name="arrow-down" size={12} color="#EF4444" />
                  </View>
                )}
              </View>
            ))}
            {getOrderedDisplayList().length > 6 && (
              <Text style={styles.moreIndicator}>
                +{getOrderedDisplayList().length - 6} more...
              </Text>
            )}
            {getOrderedDisplayList().length === 0 && (
              <Text style={styles.emptyMicronutrients}>
                No micronutrients selected. Tap "Customize" to choose which nutrients to track.
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={20} color="#EF4444" />
            <Text style={styles.resetButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>

        {/* Development Tools */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development Tools</Text>
            <SentryTestButton />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calculateButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  textInputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  activityOptionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F0F4FF',
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  activityLabelSelected: {
    color: '#4F46E5',
  },
  activityDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityDescriptionSelected: {
    color: '#4F46E5',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#111827',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#4F46E5',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroInput: {
    flex: 1,
    minWidth: '45%',
  },
  actionSection: {
    marginVertical: 20,
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  micronutrientsList: {
    gap: 8,
  },
  micronutrientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  micronutrientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  micronutrientName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  // Unit toggle styles
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  unitToggle: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitToggleActive: {
    backgroundColor: '#4F46E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  unitToggleTextActive: {
    color: '#FFFFFF',
  },
  micronutrientUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  minimizeIndicator: {
    backgroundColor: '#FEF2F2',
    padding: 4,
    borderRadius: 4,
  },
  moreIndicator: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyMicronutrients: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;