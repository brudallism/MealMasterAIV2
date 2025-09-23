// src/screens/DietAllergiesScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/stores/user-store';
import { DietPicker } from '@/components/preferences/DietPicker';
import { AllergiesPicker } from '@/components/preferences/AllergiesPicker';
import { ExcludeChips } from '@/components/preferences/ExcludeChips';
import { CustomExcludeSearch } from '@/components/preferences/CustomExcludeSearch';
import { CuisinePicker } from '@/components/preferences/CuisinePicker';
import { DietType, Intolerance } from '@/types/dietary';

interface DietAllergiesScreenProps {
  navigation: any;
}

export const DietAllergiesScreen: React.FC<DietAllergiesScreenProps> = ({
  navigation
}) => {
  const {
    dietaryPreferences,
    setDiet,
    toggleAllergy,
    toggleExclude,
    addExclude,
    removeExclude,
    updateCuisines,
    resetDietaryPreferences
  } = useUserStore();

  const handleResetPreferences = () => {
    Alert.alert(
      'Reset All Preferences',
      'Are you sure you want to reset all dietary preferences to defaults? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetDietaryPreferences,
        },
      ]
    );
  };

  const hasAnyPreferences = () => {
    return (
      dietaryPreferences.diet !== 'none' ||
      dietaryPreferences.allergies.length > 0 ||
      dietaryPreferences.excludeIngredients.length > 0 ||
      dietaryPreferences.cuisines.include.length > 0 ||
      dietaryPreferences.cuisines.exclude.length > 0
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diet & Allergies</Text>
        {hasAnyPreferences() && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPreferences}
            accessibilityLabel="Reset all preferences"
          >
            <Ionicons name="refresh" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Personalize Your Recipe Search</Text>
          <Text style={styles.infoDescription}>
            Set your dietary preferences to get personalized recipe recommendations.
            Allergies are strictly enforced, while other preferences can be overridden per recipe.
          </Text>
        </View>

        {/* Diet Selection */}
        <DietPicker
          selectedDiet={dietaryPreferences.diet}
          onDietChange={(diet: DietType) => setDiet(diet)}
        />

        {/* Allergies & Intolerances */}
        <AllergiesPicker
          selectedAllergies={dietaryPreferences.allergies}
          onToggleAllergy={(intolerance: Intolerance) => toggleAllergy(intolerance)}
        />

        {/* Common Exclusions */}
        <ExcludeChips
          excludedIngredients={dietaryPreferences.excludeIngredients}
          onToggleExclude={(ingredient: string) => toggleExclude(ingredient)}
        />

        {/* Custom Exclusions */}
        <CustomExcludeSearch
          excludedIngredients={dietaryPreferences.excludeIngredients}
          onAddExclude={(ingredient: string) => addExclude(ingredient)}
          onRemoveExclude={(ingredient: string) => removeExclude(ingredient)}
        />

        {/* Cuisine Preferences */}
        <CuisinePicker
          includeCuisines={dietaryPreferences.cuisines.include}
          excludeCuisines={dietaryPreferences.cuisines.exclude}
          onUpdateCuisines={(include: string[], exclude: string[]) =>
            updateCuisines(include, exclude)
          }
        />

        {/* Summary Section */}
        {hasAnyPreferences() && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Your Preferences Summary</Text>

            {dietaryPreferences.diet !== 'none' && (
              <View style={styles.summaryItem}>
                <Ionicons name="leaf" size={16} color="#059669" />
                <Text style={styles.summaryText}>
                  Following {dietaryPreferences.diet} diet
                </Text>
              </View>
            )}

            {dietaryPreferences.allergies.length > 0 && (
              <View style={styles.summaryItem}>
                <Ionicons name="warning" size={16} color="#EF4444" />
                <Text style={styles.summaryText}>
                  {dietaryPreferences.allergies.length} allergy restrictions (strictly enforced)
                </Text>
              </View>
            )}

            {dietaryPreferences.excludeIngredients.length > 0 && (
              <View style={styles.summaryItem}>
                <Ionicons name="close-circle" size={16} color="#F59E0B" />
                <Text style={styles.summaryText}>
                  {dietaryPreferences.excludeIngredients.length} ingredient exclusions (can override per recipe)
                </Text>
              </View>
            )}

            {(dietaryPreferences.cuisines.include.length > 0 || dietaryPreferences.cuisines.exclude.length > 0) && (
              <View style={styles.summaryItem}>
                <Ionicons name="restaurant" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>
                  Cuisine preferences set ({dietaryPreferences.cuisines.include.length} included, {dietaryPreferences.cuisines.exclude.length} excluded)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>💡 How It Works</Text>
          <View style={styles.helpItems}>
            <Text style={styles.helpItem}>
              • <Text style={styles.helpBold}>Allergies</Text> are strictly enforced and cannot be overridden
            </Text>
            <Text style={styles.helpItem}>
              • <Text style={styles.helpBold}>Diet preferences</Text> automatically exclude incompatible ingredients
            </Text>
            <Text style={styles.helpItem}>
              • <Text style={styles.helpBold}>Exclusions</Text> can be overridden for individual recipes
            </Text>
            <Text style={styles.helpItem}>
              • <Text style={styles.helpBold}>Overridden recipes</Text> are automatically saved to favorites
            </Text>
            <Text style={styles.helpItem}>
              • <Text style={styles.helpBold}>Search relaxation</Text> kicks in if no results are found
            </Text>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Balance the back button
  },
  resetButton: {
    padding: 8,
    marginRight: -8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  summaryContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 8,
    flex: 1,
  },
  helpContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  helpItems: {
    gap: 8,
  },
  helpItem: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});