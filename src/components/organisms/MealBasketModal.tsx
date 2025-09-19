// src/components/organisms/MealBasketModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../stores/cart-store';
import { useUserStore } from '../../stores/user-store';
import { useMealStore } from '../../stores/meal-store';
import { CartItem } from '../../services/api/types';
import MacroNutritionDisplay from '@/components/molecules/MacroNutritionDisplay';

interface MealBasketModalProps {
  visible: boolean;
  onClose: () => void;
}

const MealBasketModal: React.FC<MealBasketModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    items,
    itemCount,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    removeFromCart,
    updateQuantity,
    updateUnit,
    clearCart,
    createMealFromCart,
  } = useCart();

  const { goals } = useUserStore();
  const { dailyTotals } = useMealStore();

  const [mealName, setMealName] = useState('');
  const [showDayProgress, setShowDayProgress] = useState(false);

  const handleRemoveItem = (foodId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your basket?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(foodId) },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Basket',
      'Are you sure you want to remove all items from your basket?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const handleCreateMeal = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Basket', 'Add some items to your basket first');
      return;
    }

    const finalMealName = mealName.trim() || `Meal ${new Date().toLocaleTimeString()}`;

    try {
      const result = await createMealFromCart(finalMealName);

      if (result.success) {
        Alert.alert(
          'Meal Created',
          `"${finalMealName}" has been added to your meals!`,
          [{ text: 'OK', onPress: onClose }]
        );
        setMealName('');
      } else {
        Alert.alert('Error', result.error || 'Failed to create meal');
      }
    } catch (error) {
      console.error('Failed to create meal:', error);
      Alert.alert('Error', 'Failed to create meal');
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.food.name}</Text>
        <Text style={styles.itemDetails}>
          {item.quantity} {item.unit} • {Math.round(item.food.calories * (item.quantity / 100))} cal
        </Text>
        <View style={styles.itemActions}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.food.id, Math.max(0.1, item.quantity - 0.5))}
            >
              <Ionicons name="remove" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={item.quantity.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                if (value > 0) {
                  updateQuantity(item.food.id, value);
                }
              }}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.food.id, item.quantity + 0.5)}
            >
              <Ionicons name="add" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.unitText}>{item.unit}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.food.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal Basket</Text>
          {items.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Your basket is empty</Text>
            <Text style={styles.emptySubtitle}>
              Search for foods and add them to your basket to create a meal
            </Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {/* Food Items List - Top Section */}
            <View style={styles.itemsSection}>
              <Text style={styles.itemsSectionTitle}>Items in Basket</Text>
              <View style={styles.itemsListContainer}>
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.food.id}
                  renderItem={renderCartItem}
                  style={styles.itemsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>

            {/* Macro Display - Center Section */}
            <View style={styles.macroDisplaySection}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Nutrition Summary</Text>
                <View style={styles.toggleContainer}>
                  <Text style={[styles.toggleLabel, !showDayProgress && styles.toggleLabelActive]}>
                    Meal Only
                  </Text>
                  <TouchableOpacity
                    style={styles.toggleSwitch}
                    onPress={() => setShowDayProgress(!showDayProgress)}
                  >
                    <View style={[
                      styles.toggleSlider,
                      showDayProgress && styles.toggleSliderActive
                    ]} />
                  </TouchableOpacity>
                  <Text style={[styles.toggleLabel, showDayProgress && styles.toggleLabelActive]}>
                    Day Progress
                  </Text>
                </View>
              </View>

              <MacroNutritionDisplay
                nutrition={{
                  calories: totalCalories,
                  protein: totalProtein,
                  carbs: totalCarbs,
                  fat: totalFat,
                  fiber: 10 // Always show fiber for basket modal
                }}
                variant={showDayProgress ? 'basket-progress' : 'basket-meal'}
                targets={goals}
                currentTotals={showDayProgress ? dailyTotals : undefined}
                size="medium"
                showFiber={true}
                animated={true}
              />
            </View>

            {/* Footer - Bottom Section */}
            <View style={styles.footer}>
              <View style={styles.mealNameContainer}>
                <Text style={styles.mealNameLabel}>Meal Name (optional)</Text>
                <TextInput
                  style={styles.mealNameInput}
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder="e.g., Breakfast, Lunch, Custom Meal"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <TouchableOpacity
                style={styles.createMealButton}
                onPress={handleCreateMeal}
              >
                <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                <Text style={styles.createMealText}>Create Meal ({itemCount} items)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  clearButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'visible',
  },
  itemsSection: {
    flex: 0,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
  },
  itemsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  macroDisplaySection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 30,
    paddingBottom: 50, // Extra bottom padding for macro ring labels
    overflow: 'visible',
    minHeight: 250, // Ensure adequate height for macro rings and labels
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  toggleLabelActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSlider: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleSliderActive: {
    backgroundColor: '#4F46E5',
    alignSelf: 'flex-end',
  },
  itemsListContainer: {
    maxHeight: 200,
  },
  itemsList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  quantityButton: {
    padding: 8,
  },
  quantityInput: {
    width: 60,
    textAlign: 'center',
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
  },
  unitText: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    padding: 8,
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  mealNameContainer: {
    marginBottom: 16,
  },
  mealNameLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  mealNameInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  createMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createMealText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MealBasketModal;