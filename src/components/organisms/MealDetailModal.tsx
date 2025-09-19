// src/components/organisms/MealDetailModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';
import { Meal } from '@/stores/meal-store';
import MacroNutritionDisplay from '@/components/molecules/MacroNutritionDisplay';

interface MealDetailModalProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
  onEdit?: (meal: Meal) => void;
  onDelete?: (mealId: string) => void;
  onCopy?: (meal: Meal) => void;
  onToggleFavorite?: (meal: Meal) => void;
  isFavorite?: boolean;
}

const MealDetailModal: React.FC<MealDetailModalProps> = ({
  visible,
  meal,
  onClose,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
  isFavorite = false,
}) => {
  if (!meal) return null;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMealTypeColor = (mealType: string) => {
    const colors = {
      breakfast: '#F59E0B',
      lunch: '#10B981',
      dinner: '#6366F1',
      snack: '#EC4899',
    };
    return colors[mealType as keyof typeof colors] || colors.snack;
  };

  const getMealTypeIcon = (mealType: string) => {
    const icons = {
      breakfast: 'sunny-outline',
      lunch: 'restaurant-outline',
      dinner: 'moon-outline',
      snack: 'cafe-outline',
    };
    return icons[mealType as keyof typeof icons] || 'cafe-outline';
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${meal.food_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(meal.id);
            onClose();
          }
        },
      ]
    );
  };

  const handleCopy = () => {
    onCopy?.(meal);
    onClose();
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal Details</Text>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite?.(meal)}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? colors.error[500] : colors.gray[600]}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Meal Info Card */}
          <View style={styles.mealInfoCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealTypeContainer}>
                <View style={[styles.mealTypeIcon, { backgroundColor: getMealTypeColor(meal.meal_type) }]}>
                  <Ionicons
                    name={getMealTypeIcon(meal.meal_type) as any}
                    size={20}
                    color="white"
                  />
                </View>
                <View>
                  <Text style={styles.mealType}>
                    {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                  </Text>
                  <Text style={styles.mealTime}>
                    {formatTime(meal.logged_at)}
                  </Text>
                </View>
              </View>

              {meal.user_confirmed && (
                <View style={styles.confirmedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
                  <Text style={styles.confirmedText}>Confirmed</Text>
                </View>
              )}
            </View>

            <Text style={styles.mealName}>{meal.food_name}</Text>
            <Text style={styles.mealDate}>{formatDate(meal.logged_at)}</Text>

            {meal.quantity_grams && (
              <View style={styles.quantityContainer}>
                <Ionicons name="scale-outline" size={16} color={colors.gray[500]} />
                <Text style={styles.quantityText}>
                  {Math.round(meal.quantity_grams)}g total
                </Text>
              </View>
            )}
          </View>

          {/* Nutrition Information */}
          <View style={styles.nutritionCard}>
            <Text style={styles.sectionTitle}>Nutrition Information</Text>
            <MacroNutritionDisplay
              nutrition={{
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fat: meal.fat,
                fiber: meal.fiber
              }}
              variant="basket-meal"
              size="medium"
              showFiber={meal.fiber !== undefined && meal.fiber > 0}
              animated={true}
            />
          </View>

          {/* AI Information */}
          {meal.ai_confidence !== undefined && (
            <View style={styles.aiInfoCard}>
              <Text style={styles.sectionTitle}>AI Recognition</Text>
              <View style={styles.aiInfoRow}>
                <View style={styles.aiInfoItem}>
                  <Text style={styles.aiInfoLabel}>Source</Text>
                  <Text style={styles.aiInfoValue}>
                    {meal.recognition_source === 'food_recognition_ai' ? 'AI Recognition' :
                     meal.recognition_source === 'manual_entry' ? 'Manual Entry' : 'User Input'}
                  </Text>
                </View>
                {meal.ai_confidence < 1 && (
                  <View style={styles.aiInfoItem}>
                    <Text style={styles.aiInfoLabel}>Confidence</Text>
                    <Text style={styles.aiInfoValue}>
                      {Math.round(meal.ai_confidence * 100)}%
                    </Text>
                  </View>
                )}
              </View>
              {meal.validation_status && meal.validation_status !== 'validated' && (
                <View style={styles.validationStatus}>
                  <Ionicons
                    name={meal.validation_status === 'pending' ? "time-outline" : "alert-circle-outline"}
                    size={16}
                    color={colors.warning[500]}
                  />
                  <Text style={styles.validationText}>
                    {meal.validation_status === 'pending' ? 'Pending validation' : 'Needs review'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              {onEdit && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => onEdit(meal)}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
              )}

              {onCopy && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.copyButton]}
                  onPress={handleCopy}
                >
                  <Ionicons name="copy-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Copy to Basket</Text>
                </TouchableOpacity>
              )}

              {onDelete && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
  },
  favoriteButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl, // Extra bottom padding for scroll content
  },
  mealInfoCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  mealType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
  },
  mealTime: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  confirmedText: {
    fontSize: typography.fontSize.xs,
    color: colors.success[600],
    marginLeft: spacing.xs,
  },
  mealName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  mealDate: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.base,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginLeft: spacing.xs,
  },
  nutritionCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl, // Extra bottom padding for macro rings
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.base,
  },
  aiInfoCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  aiInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiInfoItem: {
    flex: 1,
  },
  aiInfoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  aiInfoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[800],
  },
  validationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
    padding: spacing.sm,
    backgroundColor: colors.warning[50],
    borderRadius: borderRadius.md,
  },
  validationText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning[700],
    marginLeft: spacing.xs,
  },
  actionsCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg, // Add bottom margin to prevent cutoff
    ...shadows.sm,
  },
  actionButtons: {
    gap: spacing.base,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.primary[500],
  },
  copyButton: {
    backgroundColor: colors.success[500],
  },
  deleteButton: {
    backgroundColor: colors.error[500],
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: 'white',
  },
});

export default MealDetailModal;