// src/components/preferences/ExcludeChips.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COMMON_EXCLUDES_20 } from '@/services/preferences/presets';

interface ExcludeChipsProps {
  excludedIngredients: string[];
  onToggleExclude: (ingredient: string) => void;
}

export const ExcludeChips: React.FC<ExcludeChipsProps> = ({
  excludedIngredients,
  onToggleExclude
}) => {
  const isExcluded = (ingredient: string) =>
    excludedIngredients.includes(ingredient.toLowerCase());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Common Exclusions</Text>
      <Text style={styles.subtitle}>
        Tap ingredients you want to avoid (these can be overridden on a per-recipe basis)
      </Text>

      <View style={styles.chipsContainer}>
        {COMMON_EXCLUDES_20.map((ingredient) => (
          <TouchableOpacity
            key={ingredient}
            style={[
              styles.chip,
              isExcluded(ingredient) && styles.excludedChip
            ]}
            onPress={() => onToggleExclude(ingredient)}
            accessibilityRole="button"
            accessibilityState={{ selected: isExcluded(ingredient) }}
            accessibilityLabel={`${ingredient}. ${
              isExcluded(ingredient) ? 'Currently excluded' : 'Not excluded'
            }`}
            accessibilityHint="Tap to toggle ingredient exclusion"
          >
            <Text style={[
              styles.chipText,
              isExcluded(ingredient) && styles.excludedChipText
            ]}>
              {ingredient}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {excludedIngredients.filter(item =>
        COMMON_EXCLUDES_20.includes(item)
      ).length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Currently excluding ({excludedIngredients.filter(item =>
              COMMON_EXCLUDES_20.includes(item)
            ).length} common ingredients):
          </Text>
          <Text style={styles.selectedText}>
            {excludedIngredients
              .filter(item => COMMON_EXCLUDES_20.includes(item))
              .join(', ')}
          </Text>
          <Text style={styles.noteText}>
            💡 You can override these for individual recipes if needed
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
  excludedChip: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  excludedChipText: {
    color: '#D97706',
  },
  selectedContainer: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  selectedText: {
    fontSize: 14,
    color: '#B45309',
    marginBottom: 8,
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  noteText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
});