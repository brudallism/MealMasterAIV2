// src/components/molecules/MealPlanCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MealPlanItem {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

interface MealPlan {
  id: string;
  name: string;
  description: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: {
    breakfast: MealPlanItem[];
    lunch: MealPlanItem[];
    dinner: MealPlanItem[];
    snacks: MealPlanItem[];
  };
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: string;
}

interface MealPlanCardProps {
  plan: MealPlan;
  onSelect: (plan: MealPlan) => void;
  onPreview: (plan: MealPlan) => void;
}

const MealPlanCard: React.FC<MealPlanCardProps> = ({
  plan,
  onSelect,
  onPreview,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return '#10B981';
      case 'Medium':
        return '#F59E0B';
      case 'Hard':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getMealItems = () => {
    const allMeals = [
      ...plan.meals.breakfast,
      ...plan.meals.lunch,
      ...plan.meals.dinner,
      ...plan.meals.snacks,
    ];
    return allMeals.slice(0, 6); // Show first 6 items
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{plan.name}</Text>
          <Text style={styles.description}>{plan.description}</Text>
        </View>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => onPreview(plan)}
        >
          <Ionicons name="eye-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{plan.totalCalories}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{plan.totalProtein}g</Text>
          <Text style={styles.statLabel}>Protein</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{plan.totalCarbs}g</Text>
          <Text style={styles.statLabel}>Carbs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{plan.totalFat}g</Text>
          <Text style={styles.statLabel}>Fat</Text>
        </View>
      </View>

      <View style={styles.foodPreview}>
        <Text style={styles.foodPreviewTitle}>Includes:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.foodItems}
        >
          {getMealItems().map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.foodItem}>
              <Text style={styles.foodEmoji}>{item.emoji}</Text>
              <Text style={styles.foodName}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.tags}>
          {plan.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {plan.tags.length > 2 && (
            <Text style={styles.moreTagsText}>+{plan.tags.length - 2}</Text>
          )}
        </View>
        <View style={styles.metadata}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.metaText}>{plan.prepTime}</Text>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(plan.difficulty) },
            ]}
          >
            <Text style={styles.difficultyText}>{plan.difficulty}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.selectButton} onPress={() => onSelect(plan)}>
        <Ionicons name="calendar" size={20} color="#FFFFFF" />
        <Text style={styles.selectButtonText}>Use This Plan</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  previewButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  foodPreview: {
    marginBottom: 16,
  },
  foodPreviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  foodItems: {
    flexDirection: 'row',
  },
  foodItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 60,
  },
  foodEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  foodName: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    numberOfLines: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tag: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  difficultyBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MealPlanCard;