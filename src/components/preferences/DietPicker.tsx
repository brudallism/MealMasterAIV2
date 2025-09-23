// src/components/preferences/DietPicker.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { DietType } from '@/types/dietary';

interface DietPickerProps {
  selectedDiet: DietType;
  onDietChange: (diet: DietType) => void;
}

const DIET_OPTIONS: { value: DietType; label: string; description: string }[] = [
  { value: "none", label: "No specific diet", description: "No dietary restrictions" },
  { value: "vegan", label: "Vegan", description: "No animal products" },
  { value: "vegetarian", label: "Vegetarian", description: "No meat or fish" },
  { value: "pescatarian", label: "Pescatarian", description: "Fish allowed, no other meat" },
  { value: "ketogenic", label: "Ketogenic", description: "Very low carb, high fat" },
  { value: "paleo", label: "Paleo", description: "Whole foods, no processed foods" },
  { value: "primal", label: "Primal", description: "Similar to paleo, some dairy allowed" },
  { value: "low-fodmap", label: "Low FODMAP", description: "For digestive sensitivities" },
  { value: "whole30", label: "Whole30", description: "30-day elimination diet" },
];

export const DietPicker: React.FC<DietPickerProps> = ({ selectedDiet, onDietChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diet</Text>
      <Text style={styles.subtitle}>Select your preferred diet type</Text>

      <ScrollView style={styles.optionsContainer}>
        {DIET_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selectedDiet === option.value && styles.selectedOption
            ]}
            onPress={() => onDietChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedDiet === option.value }}
            accessibilityLabel={`${option.label}. ${option.description}`}
          >
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionLabel,
                selectedDiet === option.value && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.optionDescription,
                selectedDiet === option.value && styles.selectedOptionDescription
              ]}>
                {option.description}
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              selectedDiet === option.value && styles.selectedRadio
            ]}>
              {selectedDiet === option.value && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  },
  optionsContainer: {
    maxHeight: 300,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedOptionText: {
    color: '#6366F1',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  selectedOptionDescription: {
    color: '#4F46E5',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: '#6366F1',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },
});