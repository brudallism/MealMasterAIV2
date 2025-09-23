// src/components/preferences/CuisinePicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CuisinePickerProps {
  includeCuisines: string[];
  excludeCuisines: string[];
  onUpdateCuisines: (include: string[], exclude: string[]) => void;
}

const POPULAR_CUISINES = [
  'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian',
  'Thai', 'French', 'Mediterranean', 'Korean', 'Vietnamese', 'Greek',
  'Spanish', 'Turkish', 'Lebanese', 'Moroccan', 'Brazilian', 'German',
  'British', 'Russian', 'Ethiopian', 'Cajun', 'Caribbean', 'Scandinavian'
];

export const CuisinePicker: React.FC<CuisinePickerProps> = ({
  includeCuisines,
  excludeCuisines,
  onUpdateCuisines
}) => {
  const [customCuisine, setCustomCuisine] = useState('');
  const [activeTab, setActiveTab] = useState<'include' | 'exclude'>('include');

  const isIncluded = (cuisine: string) =>
    includeCuisines.some(c => c.toLowerCase() === cuisine.toLowerCase());

  const isExcluded = (cuisine: string) =>
    excludeCuisines.some(c => c.toLowerCase() === cuisine.toLowerCase());

  const handleToggleCuisine = (cuisine: string) => {
    const normalizedCuisine = cuisine.toLowerCase();

    if (activeTab === 'include') {
      if (isIncluded(cuisine)) {
        // Remove from include
        onUpdateCuisines(
          includeCuisines.filter(c => c.toLowerCase() !== normalizedCuisine),
          excludeCuisines
        );
      } else {
        // Add to include, remove from exclude if present
        onUpdateCuisines(
          [...includeCuisines, cuisine],
          excludeCuisines.filter(c => c.toLowerCase() !== normalizedCuisine)
        );
      }
    } else {
      if (isExcluded(cuisine)) {
        // Remove from exclude
        onUpdateCuisines(
          includeCuisines,
          excludeCuisines.filter(c => c.toLowerCase() !== normalizedCuisine)
        );
      } else {
        // Add to exclude, remove from include if present
        onUpdateCuisines(
          includeCuisines.filter(c => c.toLowerCase() !== normalizedCuisine),
          [...excludeCuisines, cuisine]
        );
      }
    }
  };

  const handleAddCustomCuisine = () => {
    const cuisine = customCuisine.trim();
    if (cuisine.length < 2) return;

    // Check if already exists
    const exists = [...includeCuisines, ...excludeCuisines].some(
      c => c.toLowerCase() === cuisine.toLowerCase()
    );

    if (!exists) {
      if (activeTab === 'include') {
        onUpdateCuisines([...includeCuisines, cuisine], excludeCuisines);
      } else {
        onUpdateCuisines(includeCuisines, [...excludeCuisines, cuisine]);
      }
    }

    setCustomCuisine('');
  };

  const handleRemoveCuisine = (cuisine: string, type: 'include' | 'exclude') => {
    const normalizedCuisine = cuisine.toLowerCase();

    if (type === 'include') {
      onUpdateCuisines(
        includeCuisines.filter(c => c.toLowerCase() !== normalizedCuisine),
        excludeCuisines
      );
    } else {
      onUpdateCuisines(
        includeCuisines,
        excludeCuisines.filter(c => c.toLowerCase() !== normalizedCuisine)
      );
    }
  };

  const getChipStyle = (cuisine: string) => {
    if (isIncluded(cuisine)) {
      return [styles.chip, styles.includedChip];
    } else if (isExcluded(cuisine)) {
      return [styles.chip, styles.excludedChip];
    } else {
      return [styles.chip];
    }
  };

  const getChipTextStyle = (cuisine: string) => {
    if (isIncluded(cuisine)) {
      return [styles.chipText, styles.includedChipText];
    } else if (isExcluded(cuisine)) {
      return [styles.chipText, styles.excludedChipText];
    } else {
      return [styles.chipText];
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cuisine Preferences</Text>
      <Text style={styles.subtitle}>
        Choose cuisines to include or exclude from your recipe searches
      </Text>

      {/* Tab Selection */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'include' && styles.activeTab]}
          onPress={() => setActiveTab('include')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'include' }}
        >
          <Ionicons
            name="heart"
            size={16}
            color={activeTab === 'include' ? '#059669' : '#6B7280'}
            style={styles.tabIcon}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'include' && styles.activeTabText
          ]}>
            Include ({includeCuisines.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'exclude' && styles.activeTab]}
          onPress={() => setActiveTab('exclude')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'exclude' }}
        >
          <Ionicons
            name="close-circle"
            size={16}
            color={activeTab === 'exclude' ? '#DC2626' : '#6B7280'}
            style={styles.tabIcon}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'exclude' && styles.activeTabText
          ]}>
            Exclude ({excludeCuisines.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <Text style={styles.instructions}>
        {activeTab === 'include'
          ? '💚 Tap cuisines you want to see more of'
          : '❌ Tap cuisines you want to avoid'
        }
      </Text>

      {/* Popular Cuisines */}
      <ScrollView style={styles.cuisinesContainer}>
        <View style={styles.chipsContainer}>
          {POPULAR_CUISINES.map((cuisine) => (
            <TouchableOpacity
              key={cuisine}
              style={getChipStyle(cuisine)}
              onPress={() => handleToggleCuisine(cuisine)}
              accessibilityRole="button"
              accessibilityState={{
                selected: isIncluded(cuisine) || isExcluded(cuisine)
              }}
              accessibilityLabel={`${cuisine} cuisine. ${
                isIncluded(cuisine) ? 'Currently included' :
                isExcluded(cuisine) ? 'Currently excluded' :
                'Not selected'
              }`}
              accessibilityHint={`Tap to ${activeTab} this cuisine`}
            >
              <Text style={getChipTextStyle(cuisine)}>
                {cuisine}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Custom Cuisine Input */}
      <View style={styles.customContainer}>
        <Text style={styles.customTitle}>Add Custom Cuisine</Text>
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="Enter cuisine name..."
            value={customCuisine}
            onChangeText={setCustomCuisine}
            onSubmitEditing={handleAddCustomCuisine}
            autoCapitalize="words"
            accessibilityLabel="Custom cuisine input"
          />
          <TouchableOpacity
            style={[
              styles.addCustomButton,
              activeTab === 'include' ? styles.addIncludeButton : styles.addExcludeButton
            ]}
            onPress={handleAddCustomCuisine}
            disabled={customCuisine.trim().length < 2}
            accessibilityLabel={`Add "${customCuisine}" to ${activeTab} list`}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Cuisines Display */}
      {(includeCuisines.length > 0 || excludeCuisines.length > 0) && (
        <View style={styles.selectedContainer}>
          {includeCuisines.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedSectionTitle}>
                ✅ Including ({includeCuisines.length}):
              </Text>
              <View style={styles.selectedChips}>
                {includeCuisines.map((cuisine) => (
                  <View key={`include-${cuisine}`} style={styles.selectedChip}>
                    <Text style={styles.selectedChipText}>{cuisine}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveCuisine(cuisine, 'include')}
                      accessibilityLabel={`Remove ${cuisine} from included cuisines`}
                    >
                      <Ionicons name="close" size={16} color="#059669" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {excludeCuisines.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedSectionTitle}>
                ❌ Excluding ({excludeCuisines.length}):
              </Text>
              <View style={styles.selectedChips}>
                {excludeCuisines.map((cuisine) => (
                  <View key={`exclude-${cuisine}`} style={[styles.selectedChip, styles.excludedSelectedChip]}>
                    <Text style={[styles.selectedChipText, styles.excludedSelectedChipText]}>{cuisine}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveCuisine(cuisine, 'exclude')}
                      accessibilityLabel={`Remove ${cuisine} from excluded cuisines`}
                    >
                      <Ionicons name="close" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1F2937',
  },
  instructions: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  cuisinesContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  includedChip: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  excludedChip: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  includedChipText: {
    color: '#059669',
  },
  excludedChipText: {
    color: '#DC2626',
  },
  customContainer: {
    marginBottom: 16,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
  },
  addCustomButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIncludeButton: {
    backgroundColor: '#10B981',
  },
  addExcludeButton: {
    backgroundColor: '#EF4444',
  },
  selectedContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedSection: {
    marginBottom: 12,
  },
  selectedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  excludedSelectedChip: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  selectedChipText: {
    fontSize: 12,
    color: '#059669',
    marginRight: 6,
  },
  excludedSelectedChipText: {
    color: '#DC2626',
  },
});