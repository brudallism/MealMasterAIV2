// src/components/modals/RecipeOverrideModal.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';

interface RecipeOverrideModalProps {
  visible: boolean;
  recipe: Recipe | null;
  conflicts: {
    allergies: string[];
    excludedIngredients: string[];
    dietConflicts: string[];
  };
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export const RecipeOverrideModal: React.FC<RecipeOverrideModalProps> = ({
  visible,
  recipe,
  conflicts,
  onConfirm,
  onCancel,
}) => {
  if (!recipe) return null;

  const hasAllergies = conflicts.allergies.length > 0;
  const hasExclusions = conflicts.excludedIngredients.length > 0;
  const hasDietConflicts = conflicts.dietConflicts.length > 0;

  const handleOverride = (reason: string) => {
    onConfirm(reason);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            accessibilityLabel="Cancel override"
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Override</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recipe Info */}
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <View style={styles.recipeMetrics}>
              <View style={styles.metric}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.metricText}>{recipe.readyInMinutes}min</Text>
              </View>
              {recipe.servings && (
                <View style={styles.metric}>
                  <Ionicons name="people-outline" size={16} color="#6B7280" />
                  <Text style={styles.metricText}>{recipe.servings} servings</Text>
                </View>
              )}
            </View>
          </View>

          {/* Warning Section */}
          <View style={styles.warningContainer}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={20} color="#EF4444" />
              <Text style={styles.warningTitle}>Dietary Conflicts Detected</Text>
            </View>
            <Text style={styles.warningDescription}>
              This recipe conflicts with your dietary preferences. Review the conflicts below before proceeding.
            </Text>
          </View>

          {/* Allergy Conflicts (Blocking) */}
          {hasAllergies && (
            <View style={styles.conflictSection}>
              <View style={styles.conflictHeader}>
                <Ionicons name="medical" size={18} color="#DC2626" />
                <Text style={styles.conflictTitle}>⚠️ Allergy Conflicts (Cannot Override)</Text>
              </View>
              <View style={styles.conflictItems}>
                {conflicts.allergies.map((allergy, index) => (
                  <View key={index} style={styles.conflictItem}>
                    <Text style={styles.conflictText}>{allergy}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.blockingNote}>
                Allergy restrictions cannot be overridden for safety reasons.
              </Text>
            </View>
          )}

          {/* Diet Conflicts */}
          {hasDietConflicts && (
            <View style={styles.conflictSection}>
              <View style={styles.conflictHeader}>
                <Ionicons name="leaf-outline" size={18} color="#F59E0B" />
                <Text style={styles.conflictTitle}>🍃 Diet Conflicts</Text>
              </View>
              <View style={styles.conflictItems}>
                {conflicts.dietConflicts.map((conflict, index) => (
                  <View key={index} style={styles.conflictItem}>
                    <Text style={styles.conflictText}>{conflict}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Ingredient Exclusions */}
          {hasExclusions && (
            <View style={styles.conflictSection}>
              <View style={styles.conflictHeader}>
                <Ionicons name="close-circle-outline" size={18} color="#F59E0B" />
                <Text style={styles.conflictTitle}>🚫 Excluded Ingredients</Text>
              </View>
              <View style={styles.conflictItems}>
                {conflicts.excludedIngredients.map((ingredient, index) => (
                  <View key={index} style={styles.conflictItem}>
                    <Text style={styles.conflictText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Override Options */}
          {!hasAllergies && (
            <>
              <View style={styles.overrideSection}>
                <Text style={styles.overrideTitle}>Override Reason</Text>
                <Text style={styles.overrideDescription}>
                  Why do you want to proceed with this recipe despite the conflicts?
                </Text>
              </View>

              <View style={styles.reasonButtons}>
                <TouchableOpacity
                  style={styles.reasonButton}
                  onPress={() => handleOverride("Special occasion")}
                >
                  <Ionicons name="star-outline" size={20} color="#6366F1" />
                  <Text style={styles.reasonButtonText}>Special Occasion</Text>
                  <Text style={styles.reasonButtonSubtext}>Birthday, holiday, etc.</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reasonButton}
                  onPress={() => handleOverride("Trying something new")}
                >
                  <Ionicons name="bulb-outline" size={20} color="#6366F1" />
                  <Text style={styles.reasonButtonText}>Trying Something New</Text>
                  <Text style={styles.reasonButtonSubtext}>Experimenting with flavors</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reasonButton}
                  onPress={() => handleOverride("Cooking for others")}
                >
                  <Ionicons name="people-outline" size={20} color="#6366F1" />
                  <Text style={styles.reasonButtonText}>Cooking for Others</Text>
                  <Text style={styles.reasonButtonSubtext}>Family or guests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reasonButton}
                  onPress={() => handleOverride("Can modify recipe")}
                >
                  <Ionicons name="create-outline" size={20} color="#6366F1" />
                  <Text style={styles.reasonButtonText}>Can Modify Recipe</Text>
                  <Text style={styles.reasonButtonSubtext}>Will substitute ingredients</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.favoriteNote}>
                <Ionicons name="heart" size={16} color="#10B981" />
                <Text style={styles.favoriteNoteText}>
                  This recipe will be automatically added to your favorites when you override restrictions.
                </Text>
              </View>
            </>
          )}

          {/* Blocking Message for Allergies */}
          {hasAllergies && (
            <View style={styles.blockingContainer}>
              <Ionicons name="shield-checkmark" size={48} color="#DC2626" />
              <Text style={styles.blockingTitle}>Recipe Blocked for Safety</Text>
              <Text style={styles.blockingDescription}>
                This recipe contains ingredients you're allergic to. For your safety, we cannot allow you to proceed with this recipe.
              </Text>
              <Text style={styles.blockingAdvice}>
                💡 Try searching for similar recipes or look for allergen-free alternatives.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelActionButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelActionText}>Cancel</Text>
          </TouchableOpacity>

          {!hasAllergies ? (
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => handleOverride("Just browsing")}
            >
              <Text style={styles.browseButtonText}>View Recipe Anyway</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.browseButton, styles.browseButtonDisabled]}
              disabled={true}
            >
              <Text style={[styles.browseButtonText, styles.browseButtonTextDisabled]}>
                Recipe Blocked
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recipeInfo: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 28,
  },
  recipeMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  warningDescription: {
    fontSize: 14,
    color: '#B91C1C',
    lineHeight: 20,
  },
  conflictSection: {
    marginBottom: 20,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  conflictItems: {
    gap: 6,
  },
  conflictItem: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  conflictText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  blockingNote: {
    fontSize: 12,
    color: '#DC2626',
    fontStyle: 'italic',
    marginTop: 8,
    fontWeight: '500',
  },
  overrideSection: {
    marginVertical: 20,
  },
  overrideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  overrideDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  reasonButtons: {
    gap: 12,
    marginBottom: 20,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  reasonButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  reasonButtonSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  favoriteNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  favoriteNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#059669',
    lineHeight: 16,
  },
  blockingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  blockingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  blockingDescription: {
    fontSize: 16,
    color: '#B91C1C',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  blockingAdvice: {
    fontSize: 14,
    color: '#92400E',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  cancelActionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  browseButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#6366F1',
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  browseButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  browseButtonTextDisabled: {
    color: '#9CA3AF',
  },
});