// src/components/molecules/MicronutrientDisplay.tsx
// Enhanced micronutrient display with minimize flags, highlights, and coverage metrics

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MicronutrientRow } from '@/services/micros/engine';
import { colors, typography, spacing, borderRadius } from '@/utils/theme';

interface MicronutrientDisplayProps {
  nutrients: MicronutrientRow[];
  coverageMetrics?: {
    tracked: number;
    available: number;
    percentage: number;
  } | null;
  showCoverage?: boolean;
  onToggleCoverage?: () => void;
  currentIntake?: Record<number, number>; // Actual intake values for comparison
  style?: any;
}

interface NutrientCardProps {
  nutrient: MicronutrientRow;
  currentIntake?: number;
}

const NutrientCard: React.FC<NutrientCardProps> = ({ nutrient, currentIntake }) => {
  const hasCurrentIntake = currentIntake !== undefined;
  const progress = hasCurrentIntake && nutrient.target
    ? Math.min((currentIntake / nutrient.target) * 100, 100)
    : 0;

  const getStatusColor = () => {
    if (nutrient.flags.minimize) {
      if (!hasCurrentIntake) return colors.gray[300];
      const limit = nutrient.limit || nutrient.max;
      if (!limit) return colors.gray[300];

      if (currentIntake > limit) return colors.red[500];
      if (currentIntake > limit * 0.8) return colors.orange[500];
      return colors.green[500];
    } else {
      if (!hasCurrentIntake || !nutrient.target) return colors.gray[300];

      if (progress >= 100) return colors.green[500];
      if (progress >= 70) return colors.orange[500];
      return colors.red[400];
    }
  };

  const formatValue = (value: number | null) => {
    if (value === null || value === undefined) return '—';

    // Format based on unit and magnitude
    if (nutrient.unit === 'µg' || nutrient.unit === 'mcg') {
      return value < 1000 ? `${value}µg` : `${(value/1000).toFixed(1)}mg`;
    } else if (nutrient.unit === 'mg') {
      return value < 1000 ? `${value}mg` : `${(value/1000).toFixed(1)}g`;
    } else if (nutrient.unit === 'g') {
      return `${value}g`;
    } else if (nutrient.unit === 'kcal') {
      return `${value} cal`;
    } else if (nutrient.unit === 'IU') {
      return `${value} IU`;
    }

    return `${value}${nutrient.unit}`;
  };

  const getTargetDisplay = () => {
    if (nutrient.flags.minimize) {
      const limit = nutrient.limit || nutrient.max;
      return limit ? `≤${formatValue(limit)}` : '—';
    } else {
      return nutrient.target ? formatValue(nutrient.target) : '—';
    }
  };

  return (
    <View style={[styles.nutrientCard, nutrient.flags.highlight && styles.highlightCard]}>
      <View style={styles.nutrientHeader}>
        <View style={styles.nutrientInfo}>
          <Text style={styles.nutrientName}>
            {nutrient.name}
            {nutrient.flags.highlight && (
              <Ionicons name="star" size={14} color={colors.primary} style={styles.highlightIcon} />
            )}
          </Text>

          {nutrient.flags.minimize && (
            <View style={styles.minimizeFlag}>
              <Ionicons name="warning" size={12} color={colors.red[600]} />
              <Text style={styles.minimizeText}>Minimize</Text>
            </View>
          )}
        </View>

        <View style={styles.valuesContainer}>
          <Text style={styles.targetValue}>{getTargetDisplay()}</Text>
          {hasCurrentIntake && (
            <Text style={[styles.currentValue, { color: getStatusColor() }]}>
              {formatValue(currentIntake)}
            </Text>
          )}
        </View>
      </View>

      {hasCurrentIntake && nutrient.target && !nutrient.flags.minimize && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress, 100)}%`, backgroundColor: getStatusColor() }
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
        </View>
      )}

      {nutrient.rationale.length > 0 && (
        <View style={styles.rationaleContainer}>
          <Text style={styles.rationaleText}>
            {nutrient.rationale[0]} {/* Show primary rationale */}
          </Text>
        </View>
      )}
    </View>
  );
};

const MicronutrientDisplay: React.FC<MicronutrientDisplayProps> = ({
  nutrients,
  coverageMetrics,
  showCoverage = true,
  onToggleCoverage,
  currentIntake,
  style,
}) => {
  // Separate nutrients by category for better organization
  const highlightedNutrients = nutrients.filter(n => n.flags.highlight);
  const minimizeNutrients = nutrients.filter(n => n.flags.minimize);
  const regularNutrients = nutrients.filter(n => !n.flags.highlight && !n.flags.minimize);

  return (
    <View style={[styles.container, style]}>
      {/* Coverage Metrics Header */}
      {showCoverage && coverageMetrics && (
        <TouchableOpacity
          style={styles.coverageHeader}
          onPress={onToggleCoverage}
          activeOpacity={0.7}
        >
          <View style={styles.coverageInfo}>
            <Text style={styles.coverageTitle}>Nutrient Coverage</Text>
            <Text style={styles.coverageSubtitle}>
              {coverageMetrics.tracked} of {coverageMetrics.available} tracked
            </Text>
          </View>

          <View style={styles.coverageMetrics}>
            <Text style={styles.coveragePercentage}>{coverageMetrics.percentage}%</Text>
            <View style={styles.coverageBar}>
              <View
                style={[
                  styles.coverageFill,
                  { width: `${coverageMetrics.percentage}%` }
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Priority/Highlighted Nutrients */}
        {highlightedNutrients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Priority Nutrients</Text>
            </View>
            {highlightedNutrients.map((nutrient) => (
              <NutrientCard
                key={nutrient.id}
                nutrient={nutrient}
                currentIntake={currentIntake?.[nutrient.id]}
              />
            ))}
          </View>
        )}

        {/* Nutrients to Minimize */}
        {minimizeNutrients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={16} color={colors.red[500]} />
              <Text style={styles.sectionTitle}>Minimize Intake</Text>
            </View>
            {minimizeNutrients.map((nutrient) => (
              <NutrientCard
                key={nutrient.id}
                nutrient={nutrient}
                currentIntake={currentIntake?.[nutrient.id]}
              />
            ))}
          </View>
        )}

        {/* Regular Nutrients */}
        {regularNutrients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="nutrition" size={16} color={colors.gray[600]} />
              <Text style={styles.sectionTitle}>Essential Nutrients</Text>
            </View>
            {regularNutrients.map((nutrient) => (
              <NutrientCard
                key={nutrient.id}
                nutrient={nutrient}
                currentIntake={currentIntake?.[nutrient.id]}
              />
            ))}
          </View>
        )}

        {nutrients.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color={colors.gray[400]} />
            <Text style={styles.emptyTitle}>No Nutrient Data</Text>
            <Text style={styles.emptySubtitle}>
              Complete your profile to see personalized nutrition targets
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  coverageInfo: {
    flex: 1,
  },
  coverageTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  coverageSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs / 2,
  },
  coverageMetrics: {
    alignItems: 'flex-end',
  },
  coveragePercentage: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  coverageBar: {
    width: 60,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    marginTop: spacing.xs / 2,
  },
  coverageFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  nutrientCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  highlightCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '05',
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  highlightIcon: {
    marginLeft: spacing.xs / 2,
  },
  minimizeFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red[50],
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  minimizeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.red[600],
    marginLeft: spacing.xs / 2,
  },
  valuesContainer: {
    alignItems: 'flex-end',
  },
  targetValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray[800],
  },
  currentValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs / 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.gray[600],
    width: 35,
    textAlign: 'right',
  },
  rationaleContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  rationaleText: {
    fontSize: typography.sizes.xs,
    color: colors.gray[600],
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray[600],
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default MicronutrientDisplay;