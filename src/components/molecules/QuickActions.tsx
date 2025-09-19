// src/components/molecules/QuickActions.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface QuickActionsProps {
  onAddMeal?: () => void;
  onScanBarcode?: () => void;
  onQuickAdd?: () => void;
  onSearchFood?: () => void;
  onViewPlans?: () => void;
  onTrackWater?: () => void;
}

export default function QuickActions({
  onAddMeal = () => console.log('Add meal pressed'),
  onScanBarcode = () => console.log('Scan barcode pressed'),
  onQuickAdd = () => console.log('Quick add pressed'),
  onSearchFood = () => console.log('Search food pressed'),
  onViewPlans = () => console.log('View plans pressed'),
  onTrackWater = () => console.log('Track water pressed'),
}: QuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'scan',
      title: 'Scan Food',
      subtitle: 'Use camera',
      icon: 'barcode-outline',
      color: colors.theme.white,
      backgroundColor: colors.primary[500],
      onPress: onScanBarcode,
    },
    {
      id: 'search',
      title: 'Search Food',
      subtitle: 'Find nutrition',
      icon: 'search-outline',
      color: colors.theme.white,
      backgroundColor: colors.success[500],
      onPress: onSearchFood,
    },
    {
      id: 'quick-add',
      title: 'Quick Add',
      subtitle: 'Common foods',
      icon: 'flash-outline',
      color: colors.theme.white,
      backgroundColor: colors.warning[500],
      onPress: onQuickAdd,
    },
    {
      id: 'plans',
      title: 'Meal Plans',
      subtitle: 'View plans',
      icon: 'calendar-outline',
      color: colors.theme.white,
      backgroundColor: colors.theme.teal,
      onPress: onViewPlans,
    },
    {
      id: 'water',
      title: 'Track Water',
      subtitle: 'Stay hydrated',
      icon: 'water-outline',
      color: colors.theme.white,
      backgroundColor: colors.primary[400],
      onPress: onTrackWater,
    },
    {
      id: 'manual',
      title: 'Manual Entry',
      subtitle: 'Custom meal',
      icon: 'create-outline',
      color: colors.theme.white,
      backgroundColor: colors.error[500],
      onPress: onAddMeal,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Actions</Text>
        <Text style={styles.subtitle}>Shortcuts to common tasks</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsContainer}
        style={styles.scrollView}
      >
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, { backgroundColor: action.backgroundColor }]}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={action.icon as any}
                size={24}
                color={action.color}
              />
            </View>
            <Text style={[styles.actionTitle, { color: action.color }]}>
              {action.title}
            </Text>
            <Text style={[styles.actionSubtitle, { color: action.color, opacity: 0.8 }]}>
              {action.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Secondary Actions Grid */}
      <View style={styles.secondaryGrid}>
        <TouchableOpacity
          style={[styles.secondaryAction, styles.secondaryPrimary]}
          onPress={onAddMeal}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color={colors.primary[500]} />
          <Text style={styles.secondaryText}>Add Meal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryAction, styles.secondarySuccess]}
          onPress={onQuickAdd}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant" size={20} color={colors.success[500]} />
          <Text style={styles.secondaryText}>Quick Add</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryAction, styles.secondaryWarning]}
          onPress={onScanBarcode}
          activeOpacity={0.8}
        >
          <Ionicons name="scan" size={20} color={colors.warning[600]} />
          <Text style={styles.secondaryText}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryAction, styles.secondaryTeal]}
          onPress={onViewPlans}
          activeOpacity={0.8}
        >
          <Ionicons name="list" size={20} color={colors.theme.teal} />
          <Text style={styles.secondaryText}>Plans</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  header: {
    padding: spacing.base,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  scrollView: {
    paddingHorizontal: spacing.base,
  },
  actionsContainer: {
    paddingRight: spacing.base,
  },
  actionButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
    ...shadows.sm,
  },
  iconContainer: {
    marginBottom: spacing.xs,
  },
  actionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  secondaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: spacing.sm,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  secondaryPrimary: {
    backgroundColor: colors.primary[50],
  },
  secondarySuccess: {
    backgroundColor: colors.success[50],
  },
  secondaryWarning: {
    backgroundColor: colors.warning[50],
  },
  secondaryTeal: {
    backgroundColor: '#E6FFFA', // Teal 50 equivalent
  },
  secondaryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginLeft: spacing.xs,
  },
});