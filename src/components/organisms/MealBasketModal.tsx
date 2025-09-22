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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const [selectedTime, setSelectedTime] = useState(new Date().toTimeString().slice(0, 5)); // HH:MM format
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Helper function to format time in 12-hour format for display
  const formatTimeFor12Hour = (time24: string) => {
    const [hour24, minute] = time24.split(':').map(num => parseInt(num, 10));

    if (hour24 === 0) {
      return `12:${minute.toString().padStart(2, '0')} AM`;
    } else if (hour24 < 12) {
      return `${hour24}:${minute.toString().padStart(2, '0')} AM`;
    } else if (hour24 === 12) {
      return `12:${minute.toString().padStart(2, '0')} PM`;
    } else {
      return `${hour24 - 12}:${minute.toString().padStart(2, '0')} PM`;
    }
  };

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        >
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
            {/* Nutrition Summary - Top Section (moved below header) */}
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

            {/* Food Items List - Second Section (moved below nutrition) */}
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

            {/* Footer - Bottom Section */}
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
                <View style={styles.timeSection}>
                  <Text style={styles.inputLabel}>Time</Text>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => setShowTimePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timeInputText}>{formatTimeFor12Hour(selectedTime)}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateSection}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dateInputText}>
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Row 2: Meal Creation */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.createMealButton}
                  onPress={handleCreateMeal}
                >
                  <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                  <Text style={styles.createMealText}>Create Meal ({itemCount} items)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Custom Date Picker Modal */}
        {showDatePicker && (
          <CustomDatePicker
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}

        {/* Custom Time Picker Modal */}
        {showTimePicker && (
          <CustomTimePicker
            selectedTime={selectedTime}
            onTimeSelect={(time) => {
              setSelectedTime(time);
              setShowTimePicker(false);
            }}
            onClose={() => setShowTimePicker(false)}
          />
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

// Custom Date Picker Component with week-based navigation
interface CustomDatePickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onDateSelect,
  onClose
}) => {
  const today = new Date();
  const currentWeekStart = getStartOfWeek(today);

  // Helper function to get start of week (Sunday = 0)
  function getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  }

  // Generate 6 weeks of calendar data (current + 5 future weeks)
  const generateCalendarWeeks = () => {
    const weeks = [];
    const startDate = new Date(currentWeekStart);

    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (weekIndex * 7));

      const weekDays = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + dayIndex);

        const dateString = date.toISOString().split('T')[0];
        const isToday = dateString === today.toISOString().split('T')[0];
        const isSelected = dateString === selectedDate;
        const isPast = date < today && !isToday;
        const isCurrentOrFutureWeek = weekIndex >= 0; // All weeks are current or future

        weekDays.push({
          date: dateString,
          dayNumber: date.getDate(),
          isToday,
          isSelected,
          isPast,
          isClickable: isCurrentOrFutureWeek && !isPast,
        });
      }

      weeks.push(weekDays);
    }

    return weeks;
  };

  const calendarWeeks = generateCalendarWeeks();

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.datePickerCloseButton}>
              <Text style={styles.datePickerCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            {/* Weekday headers */}
            <View style={styles.weekdayHeaders}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.weekdayHeader}>{day}</Text>
              ))}
            </View>

            {/* Calendar weeks */}
            {calendarWeeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.calendarWeek}>
                {week.map((day, dayIndex) => (
                  <TouchableOpacity
                    key={`${weekIndex}-${dayIndex}`}
                    style={[
                      styles.calendarDay,
                      day.isSelected && styles.calendarDaySelected,
                      day.isToday && !day.isSelected && styles.calendarDayToday,
                      !day.isClickable && styles.calendarDayDisabled,
                    ]}
                    onPress={() => day.isClickable && onDateSelect(day.date)}
                    disabled={!day.isClickable}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      day.isSelected && styles.calendarDayTextSelected,
                      day.isToday && !day.isSelected && styles.calendarDayTextToday,
                      !day.isClickable && styles.calendarDayTextDisabled,
                      day.isClickable && styles.calendarDayTextClickable,
                    ]}>
                      {day.dayNumber}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Custom Time Picker Component with scroll wheels
interface CustomTimePickerProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  onClose: () => void;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  selectedTime,
  onTimeSelect,
  onClose
}) => {
  // Parse current time and convert to 12-hour format
  const [currentHour, currentMinute] = selectedTime.split(':').map(num => parseInt(num, 10));

  // Convert 24-hour to 12-hour format
  const convert24to12 = (hour24: number) => {
    if (hour24 === 0) return { hour12: 12, period: 'AM' };
    if (hour24 < 12) return { hour12: hour24, period: 'AM' };
    if (hour24 === 12) return { hour12: 12, period: 'PM' };
    return { hour12: hour24 - 12, period: 'PM' };
  };

  const currentTime12 = convert24to12(currentHour);

  const [selectedHour, setSelectedHour] = useState(currentTime12.hour12);
  const [selectedMinute, setSelectedMinute] = useState(currentMinute);
  const [selectedPeriod, setSelectedPeriod] = useState(currentTime12.period);

  // Generate hours (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);

  // Generate minutes (every 5 minutes)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  // AM/PM options
  const periods = ['AM', 'PM'];

  const handleConfirm = () => {
    // Convert back to 24-hour format
    let hour24 = selectedHour;
    if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    } else if (selectedPeriod === 'PM' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    }

    const formattedTime = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onTimeSelect(formattedTime);
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.timePickerOverlay}>
        <View style={styles.timePickerModal}>
          <View style={styles.timePickerHeader}>
            <Text style={styles.timePickerTitle}>Select Time</Text>
            <TouchableOpacity onPress={onClose} style={styles.timePickerCloseButton}>
              <Text style={styles.timePickerCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeWheelsContainer}>
            {/* Hour wheel */}
            <View style={styles.timeWheel}>
              <Text style={styles.timeWheelLabel}>Hour</Text>
              <ScrollView
                style={styles.timeScrollView}
                showsVerticalScrollIndicator={false}
                snapToInterval={50}
                decelerationRate="fast"
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeItem,
                      selectedHour === hour && styles.timeItemSelected,
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text style={[
                      styles.timeItemText,
                      selectedHour === hour && styles.timeItemTextSelected,
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Minute wheel */}
            <View style={styles.timeWheel}>
              <Text style={styles.timeWheelLabel}>Minute</Text>
              <ScrollView
                style={styles.timeScrollView}
                showsVerticalScrollIndicator={false}
                snapToInterval={50}
                decelerationRate="fast"
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeItem,
                      selectedMinute === minute && styles.timeItemSelected,
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text style={[
                      styles.timeItemText,
                      selectedMinute === minute && styles.timeItemTextSelected,
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* AM/PM wheel */}
            <View style={styles.timeWheel}>
              <Text style={styles.timeWheelLabel}>Period</Text>
              <ScrollView
                style={styles.timeScrollView}
                showsVerticalScrollIndicator={false}
                snapToInterval={50}
                decelerationRate="fast"
              >
                {periods.map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.timeItem,
                      selectedPeriod === period && styles.timeItemSelected,
                    ]}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text style={[
                      styles.timeItemText,
                      selectedPeriod === period && styles.timeItemTextSelected,
                    ]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.timePickerActions}>
            <TouchableOpacity
              style={styles.timePickerCancelButton}
              onPress={onClose}
            >
              <Text style={styles.timePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timePickerConfirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.timePickerConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
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
  keyboardAvoidingView: {
    flex: 1,
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
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
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
    flex: 0,
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    paddingBottom: 30, // Extra bottom padding for macro ring labels
    overflow: 'visible',
    minHeight: 280, // Fixed height for stability
    marginHorizontal: 16,
    marginTop: 8,
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
    paddingVertical: 24,
    paddingBottom: 50,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 30,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    height: 44,
  },
  timeInputText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    minHeight: 44,
  },
  dateInputText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  // Row 2 styles
  createMealButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  createMealText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Date Picker Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxWidth: 350,
    width: '90%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  datePickerCloseButton: {
    padding: 4,
  },
  datePickerCloseText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  calendarContainer: {
    width: '100%',
  },
  weekdayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    paddingVertical: 4,
  },
  calendarWeek: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    margin: 1,
  },
  calendarDaySelected: {
    backgroundColor: '#4F46E5',
  },
  calendarDayToday: {
    backgroundColor: '#F59E0B',
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#374151',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarDayTextDisabled: {
    color: '#9CA3AF',
  },
  calendarDayTextClickable: {
    fontWeight: '600',
    color: '#111827',
  },
  // Time Picker Styles
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxWidth: 300,
    width: '80%',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  timePickerCloseButton: {
    padding: 4,
  },
  timePickerCloseText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  timeWheelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeWheel: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeWheelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeScrollView: {
    height: 150,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  timeItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timeItemSelected: {
    backgroundColor: '#4F46E5',
  },
  timeItemText: {
    fontSize: 16,
    color: '#374151',
  },
  timeItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
  },
  timePickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  timePickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    marginLeft: 8,
    alignItems: 'center',
  },
  timePickerConfirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default MealBasketModal;