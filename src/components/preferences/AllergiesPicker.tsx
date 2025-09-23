// src/components/preferences/AllergiesPicker.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Intolerance } from '@/types/dietary';

interface AllergiesPickerProps {
  selectedAllergies: Intolerance[];
  onToggleAllergy: (intolerance: Intolerance) => void;
}

const ALLERGY_OPTIONS: { value: Intolerance; label: string; description: string }[] = [
  { value: "dairy", label: "Dairy", description: "Milk, cheese, yogurt" },
  { value: "egg", label: "Egg", description: "Eggs and egg products" },
  { value: "gluten", label: "Gluten", description: "Wheat, barley, rye" },
  { value: "grain", label: "Grain", description: "All grains including rice" },
  { value: "peanut", label: "Peanut", description: "Peanuts and peanut oil" },
  { value: "seafood", label: "Seafood", description: "Fish and shellfish" },
  { value: "sesame", label: "Sesame", description: "Sesame seeds and oil" },
  { value: "shellfish", label: "Shellfish", description: "Shrimp, crab, lobster" },
  { value: "soy", label: "Soy", description: "Soybeans and soy products" },
  { value: "sulfite", label: "Sulfite", description: "Sulfur dioxide preservatives" },
  { value: "tree nut", label: "Tree Nuts", description: "Almonds, walnuts, etc." },
  { value: "wheat", label: "Wheat", description: "Wheat flour and products" },
];

export const AllergiesPicker: React.FC<AllergiesPickerProps> = ({
  selectedAllergies,
  onToggleAllergy
}) => {
  const isSelected = (allergy: Intolerance) => selectedAllergies.includes(allergy);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Allergies & Intolerances</Text>
      <Text style={styles.subtitle}>
        Select any allergies or intolerances (these are strictly enforced)
      </Text>

      <View style={styles.chipsContainer}>
        {ALLERGY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.chip,
              isSelected(option.value) && styles.selectedChip
            ]}
            onPress={() => onToggleAllergy(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected(option.value) }}
            accessibilityLabel={`${option.label}. ${option.description}. ${
              isSelected(option.value) ? 'Selected' : 'Not selected'
            }`}
            accessibilityHint="Tap to toggle allergy selection"
          >
            <Text style={[
              styles.chipText,
              isSelected(option.value) && styles.selectedChipText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedAllergies.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Selected allergies ({selectedAllergies.length}):
          </Text>
          <Text style={styles.selectedText}>
            {selectedAllergies.map(allergy =>
              ALLERGY_OPTIONS.find(opt => opt.value === allergy)?.label
            ).join(', ')}
          </Text>
          <Text style={styles.warningText}>
            ⚠️ These will be strictly enforced and cannot be overridden
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
    marginBottom: 16,
    lineHeight: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedChip: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedChipText: {
    color: '#EF4444',
  },
  selectedContainer: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B91C1C',
    marginBottom: 4,
  },
  selectedText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 8,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '500',
  },
});