// src/components/organisms/FoodDetailModal.tsx
import React, { useState } from 'react';
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToMeal}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add to Meal</Text>
          </TouchableOpacity>
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
  quantityInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FoodDetailModal;