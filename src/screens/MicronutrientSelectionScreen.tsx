// src/screens/MicronutrientSelectionScreen.tsx
// Screen 1 of 2: Micronutrient category selection with presets and individual toggles

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useMicronutrientsStore, getAllMicronutrients, getAvailablePresets } from '@/stores/micronutrients-store';

// Simple theme object for consistency
const theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#4F46E5',
    border: '#E5E7EB',
    warning: '#F59E0B',
  }
};

export default function MicronutrientSelectionScreen() {
  const navigation = useNavigation();
  const {
    selectedIds,
    toggleSelect,
    applyPreset,
    getOrderedDisplayList,
    ui,
  } = useMicronutrientsStore();

  // Get all available data
  const allMicronutrients = getAllMicronutrients();
  const availablePresets = getAvailablePresets();

  // Local state for dropdown expand/collapse
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Helper to check if a preset is currently active (all its items are selected)
  const isPresetActive = (presetKey: string): boolean => {
    const presetIds = availablePresets[presetKey] || [];
    return presetIds.every(id => selectedIds.includes(id));
  };

  // Helper to get nutrients by category for dropdown sections
  const getNutrientsByCategory = (category: string) => {
    return allMicronutrients.filter(nutrient => nutrient.category === category);
  };

  // Handle preset toggle
  const handlePresetToggle = (presetKey: string, enabled: boolean) => {
    const presetIds = availablePresets[presetKey] || [];

    // Check if adding this preset would exceed 24-item limit
    if (enabled) {
      const newIds = presetIds.filter(id => !selectedIds.includes(id));
      if (selectedIds.length + newIds.length > 24) {
        Alert.alert(
          'Selection Limit',
          `Adding "${presetKey}" would exceed the 24 micronutrient limit. Please remove some selections first.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Apply to store
    applyPreset(presetKey, enabled);
  };

  // Handle individual nutrient toggle
  const handleNutrientToggle = (nutrientId: number) => {
    const isSelected = selectedIds.includes(nutrientId);

    // Check 24-item limit when adding
    if (!isSelected && selectedIds.length >= 24) {
      Alert.alert(
        'Selection Limit',
        'You can select a maximum of 24 micronutrients. Please remove some selections first.',
        [{ text: 'OK' }]
      );
      return;
    }

    toggleSelect(nutrientId);
  };

  // Handle section expand/collapse
  const toggleSection = (sectionKey: string) => {
    const newExpandedSections = new Set(expandedSections);
    if (expandedSections.has(sectionKey)) {
      newExpandedSections.delete(sectionKey);
    } else {
      newExpandedSections.add(sectionKey);
    }
    setExpandedSections(newExpandedSections);
  };

  // Get current selection count for display
  const selectionCount = selectedIds.length;
  const maxSelections = 24;

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Micronutrients</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Selection Counter */}
      <View style={styles.selectionCounter}>
        <Text style={styles.counterText}>
          {selectionCount}/{maxSelections} selected
        </Text>
        {selectionCount > 20 && (
          <Text style={styles.warningText}>
            ⚠️ Approaching limit
          </Text>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Selections Preview */}
        {selectionCount > 0 && (
          <View style={styles.currentSelectionsSection}>
            <Text style={styles.sectionTitle}>Current Selections ({selectionCount})</Text>
            <View style={styles.currentSelectionsGrid}>
              {getOrderedDisplayList().map((nutrient) => (
                <View key={nutrient.id} style={styles.selectedNutrientChip}>
                  <Text style={styles.selectedNutrientText}>
                    {nutrient.minimizeFlag && '⚠️ '}{nutrient.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleNutrientToggle(nutrient.id)}
                    style={styles.removeChipButton}
                  >
                    <Ionicons name="close" size={16} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Health Presets Section */}
        <View style={styles.presetsSection}>
          <Text style={styles.sectionTitle}>Health Focus Presets</Text>
          <Text style={styles.sectionSubtitle}>
            Quick selection based on health goals
          </Text>

          {Object.keys(availablePresets).map((presetKey) => {
            const isActive = isPresetActive(presetKey);
            const presetIds = availablePresets[presetKey];
            return (
              <View key={presetKey} style={styles.presetRow}>
                <View style={styles.presetInfo}>
                  <Text style={styles.presetName}>{presetKey}</Text>
                  <Text style={styles.presetDescription}>
                    {presetIds.length} micronutrients
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={(enabled) => handlePresetToggle(presetKey, enabled)}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary + '80',
                  }}
                  thumbColor={isActive ? theme.colors.primary : theme.colors.surface}
                />
              </View>
            );
          })}
        </View>

        {/* Individual Selection Sections */}
        <View style={styles.individualSection}>
          <Text style={styles.sectionTitle}>Individual Selection</Text>
          <Text style={styles.sectionSubtitle}>
            Choose specific micronutrients by category
          </Text>

          {/* Vitamins Section */}
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => toggleSection('vitamins')}
          >
            <Text style={styles.categoryTitle}>Vitamins</Text>
            <Ionicons
              name={expandedSections.has('vitamins') ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          {expandedSections.has('vitamins') && (
            <View style={styles.categoryContent}>
              {getNutrientsByCategory('vitamin').map((nutrient) => (
                <TouchableOpacity
                  key={nutrient.id}
                  style={styles.nutrientRow}
                  onPress={() => handleNutrientToggle(nutrient.id)}
                >
                  <View style={styles.nutrientInfo}>
                    <Text style={styles.nutrientName}>
                      {nutrient.minimizeFlag && '⚠️ '}{nutrient.name}
                    </Text>
                    <Text style={styles.nutrientUnit}>({nutrient.unit})</Text>
                  </View>
                  <View style={styles.checkbox}>
                    {selectedIds.includes(nutrient.id) && (
                      <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Minerals Section */}
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => toggleSection('minerals')}
          >
            <Text style={styles.categoryTitle}>Minerals</Text>
            <Ionicons
              name={expandedSections.has('minerals') ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          {expandedSections.has('minerals') && (
            <View style={styles.categoryContent}>
              {getNutrientsByCategory('mineral').map((nutrient) => (
                <TouchableOpacity
                  key={nutrient.id}
                  style={styles.nutrientRow}
                  onPress={() => handleNutrientToggle(nutrient.id)}
                >
                  <View style={styles.nutrientInfo}>
                    <Text style={styles.nutrientName}>
                      {nutrient.minimizeFlag && '⚠️ '}{nutrient.name}
                    </Text>
                    <Text style={styles.nutrientUnit}>({nutrient.unit})</Text>
                  </View>
                  <View style={styles.checkbox}>
                    {selectedIds.includes(nutrient.id) && (
                      <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Macro Others Section */}
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => toggleSection('macro_other')}
          >
            <Text style={styles.categoryTitle}>Fats & Special</Text>
            <Ionicons
              name={expandedSections.has('macro_other') ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          {expandedSections.has('macro_other') && (
            <View style={styles.categoryContent}>
              {getNutrientsByCategory('macro_other').map((nutrient) => (
                <TouchableOpacity
                  key={nutrient.id}
                  style={styles.nutrientRow}
                  onPress={() => handleNutrientToggle(nutrient.id)}
                >
                  <View style={styles.nutrientInfo}>
                    <Text style={styles.nutrientName}>
                      {nutrient.minimizeFlag && '⚠️ '}{nutrient.name}
                    </Text>
                    <Text style={styles.nutrientUnit}>({nutrient.unit})</Text>
                  </View>
                  <View style={styles.checkbox}>
                    {selectedIds.includes(nutrient.id) && (
                      <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Special Nutrients Section */}
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => toggleSection('special')}
          >
            <Text style={styles.categoryTitle}>Special Nutrients</Text>
            <Ionicons
              name={expandedSections.has('special') ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          {expandedSections.has('special') && (
            <View style={styles.categoryContent}>
              {getNutrientsByCategory('special').map((nutrient) => (
                <TouchableOpacity
                  key={nutrient.id}
                  style={styles.nutrientRow}
                  onPress={() => handleNutrientToggle(nutrient.id)}
                >
                  <View style={styles.nutrientInfo}>
                    <Text style={styles.nutrientName}>
                      {nutrient.minimizeFlag && '⚠️ '}{nutrient.name}
                    </Text>
                    <Text style={styles.nutrientUnit}>({nutrient.unit})</Text>
                  </View>
                  <View style={styles.checkbox}>
                    {selectedIds.includes(nutrient.id) && (
                      <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            selectionCount === 0 && styles.saveButtonDisabled,
          ]}
          onPress={() => navigation.goBack()}
          disabled={selectionCount === 0}
        >
          <Text style={[
            styles.saveButtonText,
            selectionCount === 0 && styles.saveButtonTextDisabled,
          ]}>
            Save Selection ({selectionCount})
          </Text>
          <Ionicons
            name="checkmark"
            size={20}
            color={selectionCount === 0 ? theme.colors.textSecondary : theme.colors.background}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerSpacer: {
      width: 40,
    },
    selectionCounter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
    },
    counterText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginRight: 8,
    },
    warningText: {
      fontSize: 14,
      color: theme.colors.warning,
      fontWeight: '500',
    },
    scrollView: {
      flex: 1,
    },
    currentSelectionsSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    currentSelectionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    selectedNutrientChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '20',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
    },
    selectedNutrientText: {
      fontSize: 14,
      color: theme.colors.text,
      marginRight: 6,
    },
    removeChipButton: {
      padding: 2,
    },
    presetsSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    individualSection: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    presetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '40',
    },
    presetInfo: {
      flex: 1,
    },
    presetName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    presetDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginTop: 8,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    categoryContent: {
      paddingLeft: 16,
    },
    nutrientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '20',
    },
    nutrientInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    nutrientName: {
      fontSize: 15,
      color: theme.colors.text,
      marginRight: 6,
    },
    nutrientUnit: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomBar: {
      flexDirection: 'row',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    saveButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginLeft: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.background,
      marginRight: 8,
    },
    saveButtonTextDisabled: {
      color: theme.colors.textSecondary,
    },
  });