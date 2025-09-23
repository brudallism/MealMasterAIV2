// src/components/preferences/TimeConstraints.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimeConstraintsProps {
  maxReadyTime?: number;
  maxIngredients?: number;
  onSetMaxReadyTime: (minutes: number | undefined) => void;
  onSetMaxIngredients: (count: number | undefined) => void;
}

const TIME_OPTIONS = [
  { value: undefined, label: 'No limit', description: 'Any cooking time' },
  { value: 15, label: '15 minutes', description: 'Quick meals' },
  { value: 30, label: '30 minutes', description: 'Fast cooking' },
  { value: 45, label: '45 minutes', description: 'Moderate time' },
  { value: 60, label: '1 hour', description: 'Standard cooking' },
  { value: 90, label: '1.5 hours', description: 'Longer preparation' },
  { value: 120, label: '2 hours', description: 'Extended cooking' },
];

const INGREDIENT_OPTIONS = [
  { value: undefined, label: 'No limit', description: 'Any complexity' },
  { value: 5, label: '5 ingredients', description: 'Very simple' },
  { value: 8, label: '8 ingredients', description: 'Simple recipes' },
  { value: 12, label: '12 ingredients', description: 'Moderate complexity' },
  { value: 15, label: '15 ingredients', description: 'More complex' },
  { value: 20, label: '20 ingredients', description: 'Complex recipes' },
];

export const TimeConstraints: React.FC<TimeConstraintsProps> = ({
  maxReadyTime,
  maxIngredients,
  onSetMaxReadyTime,
  onSetMaxIngredients
}) => {
  const formatTimeDisplay = (minutes?: number) => {
    if (!minutes) return 'No time limit';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatIngredientsDisplay = (count?: number) => {
    if (!count) return 'No ingredient limit';
    return `${count} ingredients max`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Time & Complexity Constraints</Text>
      <Text style={styles.subtitle}>
        Set limits on cooking time and recipe complexity
      </Text>

      {/* Max Ready Time Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color="#6366F1" />
          <Text style={styles.sectionTitle}>Maximum Cooking Time</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          How much time do you want to spend cooking?
        </Text>

        <View style={styles.currentSelection}>
          <Text style={styles.currentLabel}>Current setting:</Text>
          <Text style={styles.currentValue}>
            {formatTimeDisplay(maxReadyTime)}
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {TIME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value || 'unlimited'}
              style={[
                styles.optionButton,
                maxReadyTime === option.value && styles.selectedOption
              ]}
              onPress={() => onSetMaxReadyTime(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: maxReadyTime === option.value }}
              accessibilityLabel={`Set maximum cooking time to ${option.label}. ${option.description}`}
            >
              <Text style={[
                styles.optionLabel,
                maxReadyTime === option.value && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.optionDescription,
                maxReadyTime === option.value && styles.selectedOptionDescription
              ]}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Max Ingredients Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Maximum Ingredients</Text>
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalText}>Optional</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          Prefer simpler recipes with fewer ingredients?
        </Text>

        <View style={styles.currentSelection}>
          <Text style={styles.currentLabel}>Current setting:</Text>
          <Text style={styles.currentValue}>
            {formatIngredientsDisplay(maxIngredients)}
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {INGREDIENT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value || 'unlimited'}
              style={[
                styles.optionButton,
                maxIngredients === option.value && styles.selectedIngredientsOption
              ]}
              onPress={() => onSetMaxIngredients(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: maxIngredients === option.value }}
              accessibilityLabel={`Set maximum ingredients to ${option.label}. ${option.description}`}
            >
              <Text style={[
                styles.optionLabel,
                maxIngredients === option.value && styles.selectedIngredientsOptionText
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.optionDescription,
                maxIngredients === option.value && styles.selectedIngredientsOptionDescription
              ]}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary */}
      {(maxReadyTime || maxIngredients) && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Active Constraints:</Text>
          <View style={styles.summaryItems}>
            {maxReadyTime && (
              <View style={styles.summaryItem}>
                <Ionicons name="time" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>
                  Recipes ready in {formatTimeDisplay(maxReadyTime).toLowerCase()}
                </Text>
              </View>
            )}
            {maxIngredients && (
              <View style={styles.summaryItem}>
                <Ionicons name="list" size={16} color="#10B981" />
                <Text style={styles.summaryText}>
                  Using {maxIngredients} ingredients or fewer
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.summaryNote}>
            💡 These constraints help find recipes that fit your schedule and complexity preferences
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  optionalBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  optionalText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 28,
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 28,
  },
  currentLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  currentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  selectedIngredientsOption: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  selectedOptionText: {
    color: '#6366F1',
  },
  selectedIngredientsOptionText: {
    color: '#10B981',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedOptionDescription: {
    color: '#4F46E5',
  },
  selectedIngredientsOptionDescription: {
    color: '#059669',
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryItems: {
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  summaryNote: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});