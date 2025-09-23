// src/components/preferences/CustomExcludeSearch.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spoonacularClient } from '@/services/api/spoonacular-client';
import { debounceAsync } from '@/utils/debounce';
import { COMMON_EXCLUDES_20 } from '@/services/preferences/presets';

interface CustomExcludeSearchProps {
  excludedIngredients: string[];
  onAddExclude: (ingredient: string) => void;
  onRemoveExclude: (ingredient: string) => void;
}

const debouncedAutocomplete = debounceAsync(
  async (query: string) => {
    if (query.length < 2) return [];
    return await spoonacularClient.autocompleteIngredients(query);
  },
  350 // 350ms debounce as specified in the requirements
);

export const CustomExcludeSearch: React.FC<CustomExcludeSearchProps> = ({
  excludedIngredients,
  onAddExclude,
  onRemoveExclude
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get custom excludes (non-common ones)
  const customExcludes = excludedIngredients.filter(
    ingredient => !COMMON_EXCLUDES_20.includes(ingredient)
  );

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setError(null);

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await debouncedAutocomplete(query);
      // Filter out already excluded ingredients
      const filteredResults = results.filter(
        ingredient => !excludedIngredients.includes(ingredient.toLowerCase())
      );
      setSuggestions(filteredResults.slice(0, 8)); // Limit to 8 results
    } catch (err) {
      console.error('Autocomplete error:', err);
      setError('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIngredient = (ingredient: string) => {
    const normalizedIngredient = ingredient.trim().toLowerCase();

    if (excludedIngredients.includes(normalizedIngredient)) {
      Alert.alert('Already Excluded', `"${ingredient}" is already in your exclusions list.`);
      return;
    }

    onAddExclude(normalizedIngredient);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleManualAdd = () => {
    const ingredient = searchQuery.trim();
    if (ingredient.length < 2) {
      Alert.alert('Invalid Input', 'Please enter at least 2 characters.');
      return;
    }
    handleAddIngredient(ingredient);
  };

  const handleRemoveIngredient = (ingredient: string) => {
    onRemoveExclude(ingredient);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Exclusions</Text>
      <Text style={styles.subtitle}>
        Search and add specific ingredients you want to avoid
      </Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ingredients to exclude..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search for ingredients to exclude"
            accessibilityHint="Type at least 2 characters to see suggestions"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
              style={styles.clearButton}
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {searchQuery.trim().length >= 2 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleManualAdd}
            accessibilityLabel={`Add "${searchQuery}" to exclusions`}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <Text style={styles.loadingText}>Searching ingredients...</Text>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggestions:</Text>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleAddIngredient(item)}
                accessibilityLabel={`Add ${item} to exclusions`}
              >
                <Text style={styles.suggestionText}>{item}</Text>
                <Ionicons name="add-circle-outline" size={20} color="#6366F1" />
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Custom Excludes List */}
      {customExcludes.length > 0 && (
        <View style={styles.customExcludesContainer}>
          <Text style={styles.customExcludesTitle}>
            Custom Exclusions ({customExcludes.length}):
          </Text>
          <View style={styles.customExcludesChips}>
            {customExcludes.map((ingredient) => (
              <View key={ingredient} style={styles.customChip}>
                <Text style={styles.customChipText}>{ingredient}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveIngredient(ingredient)}
                  style={styles.removeButton}
                  accessibilityLabel={`Remove ${ingredient} from exclusions`}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  customExcludesContainer: {
    marginTop: 8,
  },
  customExcludesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  customExcludesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  customChipText: {
    fontSize: 14,
    color: '#D97706',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  removeButton: {
    padding: 4,
  },
});