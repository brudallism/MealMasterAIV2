// src/components/organisms/FoodDetailModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodLookupResult } from '../../services/api/types';
import MacroNutritionDisplay from '@/components/molecules/MacroNutritionDisplay';
import { useMicronutrientsStore } from '../../stores/micronutrients-store';

interface FoodDetailModalProps {
  visible: boolean;
  food: FoodLookupResult | null;
  onClose: () => void;
  onAddToMeal: (food: FoodLookupResult, quantity: number, unit: string) => void;
}

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  visible,
  food,
  onClose,
  onAddToMeal,
}) => {
  const [quantity, setQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('100g');
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealDate, setMealDate] = useState(new Date().toLocaleDateString());
  const [mealTime, setMealTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Get user's selected micronutrients from store
  const { getOrderedDisplayList, initialize, isInitialized } = useMicronutrientsStore();

  const commonUnits = [
    '100g',
    'g',
    'serving',
    'cup',
    'oz',
    'piece',
    'slice',
    'tbsp',
    'tsp',
  ];

  // Initialize micronutrients store on first render
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  React.useEffect(() => {
    if (food) {
      setSelectedUnit(food.nutrition.servingSize || '100g');
      setQuantity('1');
    }
  }, [food]);

  const handleAddToMeal = () => {
    if (!food) return;

    const numericQuantity = parseFloat(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than 0');
      return;
    }

    onAddToMeal(food, numericQuantity, selectedUnit);
    onClose();
  };

  const calculateNutritionForQuantity = () => {
    if (!food) return null;

    const baseQuantity = parseFloat(quantity) || 1;
    let conversionFactor = baseQuantity;

    // Basic unit conversions
    if (selectedUnit === '100g') {
      conversionFactor = baseQuantity;
    } else if (selectedUnit === 'g') {
      conversionFactor = baseQuantity / 100;
    } else if (selectedUnit === 'serving') {
      conversionFactor = baseQuantity;
    } else if (selectedUnit === 'cup') {
      conversionFactor = (baseQuantity * 240) / 100;
    } else if (selectedUnit === 'oz') {
      conversionFactor = (baseQuantity * 28.35) / 100;
    } else if (selectedUnit === 'tbsp') {
      conversionFactor = (baseQuantity * 15) / 100;
    } else if (selectedUnit === 'tsp') {
      conversionFactor = (baseQuantity * 5) / 100;
    }

    return {
      calories: Math.round((food.nutrition.per100g.calories || 0) * conversionFactor),
      protein: Math.round((food.nutrition.per100g.protein || 0) * conversionFactor * 10) / 10,
      carbs: Math.round((food.nutrition.per100g.carbs || 0) * conversionFactor * 10) / 10,
      fat: Math.round((food.nutrition.per100g.fat || 0) * conversionFactor * 10) / 10,
      fiber: Math.round((food.nutrition.per100g.fiber || 0) * conversionFactor * 10) / 10,
    };
  };

  const calculatedNutrition = calculateNutritionForQuantity();

  // Get user's micronutrient display list
  const userMicronutrients = getOrderedDisplayList();

  // Calculate micronutrients based on user's selection and quantity
  const calculatedMicronutrients = useMemo(() => {
    if (!food || !food.nutrition.micronutrients) {
      return [];
    }

    const baseQuantity = parseFloat(quantity) || 1;
    let conversionFactor = baseQuantity;

    // Apply same unit conversion logic as main nutrition
    if (selectedUnit === '100g') {
      conversionFactor = baseQuantity;
    } else if (selectedUnit === 'g') {
      conversionFactor = baseQuantity / 100;
    } else if (selectedUnit === 'serving') {
      conversionFactor = baseQuantity;
    } else if (selectedUnit === 'cup') {
      conversionFactor = (baseQuantity * 240) / 100;
    } else if (selectedUnit === 'oz') {
      conversionFactor = (baseQuantity * 28.35) / 100;
    } else if (selectedUnit === 'tbsp') {
      conversionFactor = (baseQuantity * 15) / 100;
    } else if (selectedUnit === 'tsp') {
      conversionFactor = (baseQuantity * 5) / 100;
    }

    // Generate micronutrients based on user's selected micronutrients from store
    return userMicronutrients
      .map(nutrientInfo => {
        const foodNutrient = food.nutrition.micronutrients![nutrientInfo.id];

        if (!foodNutrient) {
          return null; // Skip nutrients not available in this food
        }

        return {
          name: nutrientInfo.minimizeFlag ? `⚠️ ${nutrientInfo.name}` : nutrientInfo.name,
          amount: Math.round(foodNutrient.amount * conversionFactor * 10) / 10,
          unit: nutrientInfo.unit === 'µg' ? 'mcg' : nutrientInfo.unit, // Convert µg to mcg for display
          isHarmful: nutrientInfo.minimizeFlag
        };
      })
      .filter(Boolean); // Remove null entries
  }, [food, quantity, selectedUnit, userMicronutrients]);

  if (!food) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.foodHeader}>
            <View style={styles.foodIconContainer}>
              <Text style={styles.foodIcon}>{food.metadata?.foodIcon || '🍽️'}</Text>
            </View>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{food.name}</Text>
              {food.brand && (
                <Text style={styles.brandName}>{food.brand}</Text>
              )}
              <Text style={styles.categoryText}>{food.category}</Text>
              <Text style={styles.sourceText}>Source: {food.source.api.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Serving Size</Text>
            <View style={styles.servingRow}>
              <View style={styles.quantityContainer}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
              <View style={styles.unitContainer}>
                <Text style={styles.inputLabel}>Unit</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.unitScrollView}
                >
                  {commonUnits.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        selectedUnit === unit && styles.unitButtonSelected,
                      ]}
                      onPress={() => setSelectedUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          selectedUnit === unit && styles.unitButtonTextSelected,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            <Text style={styles.servingSizeText}>
              Per {quantity} {selectedUnit}
            </Text>

            <MacroNutritionDisplay
              nutrition={{
                calories: calculatedNutrition?.calories || 0,
                protein: calculatedNutrition?.protein || 0,
                carbs: calculatedNutrition?.carbs || 0,
                fat: calculatedNutrition?.fat || 0,
                fiber: calculatedNutrition?.fiber || 0
              }}
              variant="food-detail"
              size="medium"
              showFiber={calculatedNutrition?.fiber !== undefined && calculatedNutrition.fiber > 0}
              animated={true}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Base Nutrition (per 100g)</Text>
            <View style={styles.baseNutritionRow}>
              <Text style={styles.baseNutritionText}>
                {Math.round(food.nutrition.per100g.calories || 0)} cal •{' '}
                {Math.round(food.nutrition.per100g.protein || 0)}g protein •{' '}
                {Math.round(food.nutrition.per100g.carbs || 0)}g carbs •{' '}
                {Math.round(food.nutrition.per100g.fat || 0)}g fat
              </Text>
            </View>
          </View>

          {/* Micronutrients Section */}
          {userMicronutrients.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.microHeader}
                onPress={() => setShowMicronutrients(!showMicronutrients)}
              >
                <Text style={styles.sectionTitle}>Micronutrients & Vitamins</Text>
                <Ionicons
                  name={showMicronutrients ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {showMicronutrients && (
                <View style={styles.microContent}>
                  {calculatedMicronutrients.length > 0 ? (
                    <View style={styles.microColumns}>
                      {/* Left Column (First half) */}
                      <View style={styles.microColumn}>
                        {calculatedMicronutrients.slice(0, Math.ceil(calculatedMicronutrients.length / 2)).map((nutrient, index) => (
                          <View key={index} style={styles.microRow}>
                            <Text style={styles.microName}>{nutrient.name}</Text>
                            <Text style={styles.microValue}>
                              {nutrient.amount} {nutrient.unit}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Right Column (Second half) */}
                      <View style={styles.microColumn}>
                        {calculatedMicronutrients.slice(Math.ceil(calculatedMicronutrients.length / 2)).map((nutrient, index) => (
                          <View key={index + Math.ceil(calculatedMicronutrients.length / 2)} style={styles.microRow}>
                            <Text style={styles.microName}>{nutrient.name}</Text>
                            <Text style={styles.microValue}>
                              {nutrient.amount} {nutrient.unit}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.microRow}>
                      <Text style={styles.microName}>No micronutrient data available for this food</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {food.metadata?.warnings && food.metadata.warnings.length > 0 && (
            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>⚠️ Warnings</Text>
              {food.metadata.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  • {warning}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {/* Row 1: Meal Context */}
          <View style={styles.footerRow}>
            <View style={styles.mealNameSection}>
              <Text style={styles.inputLabel}>Meal Name</Text>
              <TextInput
                style={styles.mealNameInput}
                value={mealName}
                onChangeText={setMealName}
                placeholder="Enter meal name"
              />
            </View>
            <View style={styles.dateSection}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity style={styles.dateTimeButton}>
                <Text style={styles.dateTimeText}>{mealDate}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeSection}>
              <Text style={styles.inputLabel}>Time</Text>
              <TouchableOpacity style={styles.dateTimeButton}>
                <Text style={styles.dateTimeText}>{mealTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Food Addition */}
          <View style={styles.footerRow}>
            <View style={styles.quantitySection}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>

            <View style={styles.unitSection}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TouchableOpacity
                style={styles.unitDropdown}
                onPress={() => setShowUnitPicker(!showUnitPicker)}
              >
                <Text style={styles.unitDropdownText}>{selectedUnit}</Text>
                <Ionicons
                  name={showUnitPicker ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#9CA3AF"
                />
              </TouchableOpacity>

              {showUnitPicker && (
                <View style={styles.unitPickerContainer}>
                  {commonUnits.map((unit, index) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitPickerItem,
                        index === commonUnits.length - 1 && styles.unitPickerItemLast,
                        selectedUnit === unit && styles.unitPickerItemSelected
                      ]}
                      onPress={() => {
                        setSelectedUnit(unit);
                        setShowUnitPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.unitPickerText,
                        selectedUnit === unit && styles.unitPickerTextSelected
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToMeal}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add to Meal</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  foodIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  foodIcon: {
    fontSize: 32,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  sourceText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  servingRow: {
    flexDirection: 'row',
    gap: 16,
  },
  quantityContainer: {
    flex: 1,
  },
  unitContainer: {
    flex: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  unitScrollView: {
    flexDirection: 'row',
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  unitButtonSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  unitButtonTextSelected: {
    color: '#FFFFFF',
  },
  servingSizeText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  baseNutritionRow: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  baseNutritionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  warningSection: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 16,
  },
  // Row 1 styles
  mealNameSection: {
    flex: 2,
  },
  mealNameInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    height: 44,
  },
  dateSection: {
    flex: 1,
  },
  timeSection: {
    flex: 1,
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    height: 44,
    justifyContent: 'center',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  // Row 2 styles
  quantitySection: {
    marginRight: 0,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minWidth: 60,
    textAlign: 'center',
    height: 44,
  },
  unitSection: {
    flex: 1,
    marginRight: 16,
    position: 'relative',
  },
  unitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 44,
  },
  unitDropdownText: {
    fontSize: 14,
    color: '#374151',
  },
  unitPickerContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: -1,
  },
  unitPickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unitPickerItemLast: {
    borderBottomWidth: 0,
  },
  unitPickerItemSelected: {
    backgroundColor: '#F3F4F6',
  },
  unitPickerText: {
    fontSize: 14,
    color: '#374151',
  },
  unitPickerTextSelected: {
    color: '#2D5A5B',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Micronutrients styles
  microHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  microContent: {
    marginTop: 12,
  },
  microColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  microColumn: {
    flex: 1,
  },
  microRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  microName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    paddingRight: 8,
  },
  microValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
  },
});

export default FoodDetailModal;