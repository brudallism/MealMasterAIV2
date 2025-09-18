// src/components/organisms/MealBasketModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../stores/cart-store';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

interface MealBasketModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MealBasketModal({
  visible,
  onClose,
}: MealBasketModalProps) {
  const {
    items,
    itemCount,
    totalNutrition,
    currentMealName,
    currentMealType,
    removeFromCart,
    updateQuantity,
      clearCart,
    setMealName,
    setMealType,
  } = useCart();

  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');

  const handleQuantityEdit = (fdcId: number, currentQuantity: number) => {
    setEditingQuantity(fdcId.toString());
    setTempQuantity(currentQuantity.toString());
  };

  const handleQuantitySubmit = (fdcId: number) => {
    const newQuantity = parseFloat(tempQuantity);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      updateQuantity(fdcId, newQuantity);
    }
    setEditingQuantity(null);
    setTempQuantity('');
  };

  const handleRemoveItem = (fdcId: number, description: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${description} from your meal basket?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(fdcId) },
      ]
    );
  };

  const handleClearBasket = () => {
    Alert.alert(
      'Clear Basket',
      'Remove all items from your meal basket?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
    { value: 'lunch', label: 'Lunch', icon: 'partly-sunny-outline' },
    { value: 'dinner', label: 'Dinner', icon: 'moon-outline' },
    { value: 'snack', label: 'Snack', icon: 'nutrition-outline' },
  ] as const;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Meal Basket ({itemCount})</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
        </View>

        {items.length === 0 ? (
          // Empty State
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color={colors.gray[400]} />
            <Text style={styles.emptyTitle}>Your basket is empty</Text>
            <Text style={styles.emptySubtitle}>
              Search for foods and add them to create your meal
            </Text>
          </View>
        ) : (
          <>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Meal Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Meal Details</Text>

                {/* Meal Name */}
                <View style={styles.mealInfoRow}>
                  <Text style={styles.label}>Meal Name:</Text>
                  <TextInput
                    style={styles.mealNameInput}
                    placeholder="Enter meal name..."
                    value={currentMealName}
                    onChangeText={setMealName}
                  />
                </View>

                {/* Meal Type */}
                <View style={styles.mealTypeContainer}>
                  <Text style={styles.label}>Meal Type:</Text>
                  <View style={styles.mealTypeGrid}>
                    {mealTypes.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.mealTypeButton,
                          currentMealType === type.value && styles.mealTypeButtonActive,
                        ]}
                        onPress={() => setMealType(type.value)}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={16}
                          color={currentMealType === type.value ? colors.theme.white : colors.gray[600]}
                        />
                        <Text
                          style={[
                            styles.mealTypeText,
                            currentMealType === type.value && styles.mealTypeTextActive,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Nutrition Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Total Nutrition</Text>
                <View style={styles.nutritionSummary}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{totalNutrition.calories.toFixed(0)}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{totalNutrition.protein.toFixed(1)}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{totalNutrition.carbs.toFixed(1)}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{totalNutrition.fat.toFixed(1)}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </View>

              {/* Food Items */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items</Text>
                {items.map((item) => (
                  <View key={item.food.fdcId} style={styles.foodItem}>
                    <View style={styles.foodItemHeader}>
                      <Text style={styles.foodName} numberOfLines={2}>
                        {item.food.description}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveItem(item.food.fdcId, item.food.description)}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error[500]} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.foodItemDetails}>
                      <View style={styles.quantityContainer}>
                        <Text style={styles.quantityLabel}>Quantity:</Text>
                        {editingQuantity === item.food.fdcId.toString() ? (
                          <View style={styles.quantityEditContainer}>
                            <TextInput
                              style={styles.quantityInput}
                              value={tempQuantity}
                              onChangeText={setTempQuantity}
                              keyboardType="numeric"
                              autoFocus
                              onBlur={() => handleQuantitySubmit(item.food.fdcId)}
                              onSubmitEditing={() => handleQuantitySubmit(item.food.fdcId)}
                            />
                            <Text style={styles.unitText}>{item.unit}</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.quantityDisplay}
                            onPress={() => handleQuantityEdit(item.food.fdcId, item.quantity)}
                          >
                            <Text style={styles.quantityText}>
                              {item.quantity} {item.unit}
                            </Text>
                            <Ionicons name="pencil-outline" size={12} color={colors.gray[500]} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.itemNutrition}>
                        <Text style={styles.nutritionText}>
                          {item.nutrition.calories.toFixed(0)} cal • {item.nutrition.protein.toFixed(1)}g protein
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClearBasket}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={onClose}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.theme.white} />
                <Text style={styles.saveButtonText}>Save Meal</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    backgroundColor: colors.background.primary,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[800],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
    marginTop: spacing.base,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  mealInfoRow: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  mealNameInput: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.gray[800],
  },
  mealTypeContainer: {
    marginTop: spacing.sm,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: 80,
  },
  mealTypeButtonActive: {
    backgroundColor: colors.theme.teal,
    borderColor: colors.theme.teal,
  },
  mealTypeText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    marginLeft: spacing.xs,
  },
  mealTypeTextActive: {
    color: colors.theme.white,
  },
  nutritionSummary: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.sm,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.theme.teal,
  },
  nutritionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  foodItem: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[800],
    lineHeight: typography.lineHeight.normal,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  foodItemDetails: {
    marginTop: spacing.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quantityLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginRight: spacing.sm,
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  quantityText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    marginRight: spacing.xs,
  },
  quantityEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.theme.teal,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.gray[800],
    width: 60,
    textAlign: 'center',
  },
  unitText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginLeft: spacing.xs,
  },
  itemNutrition: {},
  nutritionText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  footer: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    flexDirection: 'row',
    gap: spacing.sm,
  },
  clearButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: colors.gray[700],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.theme.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  saveButtonText: {
    color: colors.theme.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
});