// src/components/atoms/CalorieProgressBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CalorieProgressBarProps {
  current: number;
  goal: number;
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  color?: string;
}

export default function CalorieProgressBar({
  current,
  goal,
  variant = 'horizontal',
  size = 'medium',
  showLabels = true,
  color = '#4F46E5'
}: CalorieProgressBarProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const displayCurrent = Math.round(current);
  const isOverGoal = current > goal;
  const remaining = Math.max(goal - current, 0);

  const progressColor = isOverGoal ? '#EF4444' : color;
  const sizeStyles = getSizeStyles(size, variant);

  const renderHorizontalBar = () => (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labelContainer}>
          <Text style={[styles.currentLabel, { color: progressColor }]}>
            {displayCurrent} cal
          </Text>
          <Text style={styles.goalLabel}>
            {isOverGoal ? `+${Math.round(current - goal)}` : `${Math.round(remaining)} left`}
          </Text>
        </View>
      )}
      <View style={[styles.barContainer, sizeStyles.container]}>
        <View
          style={[
            styles.progressBar,
            sizeStyles.progress,
            {
              backgroundColor: progressColor,
              width: `${Math.min(percentage, 100)}%`
            }
          ]}
        />
        {isOverGoal && (
          <View style={[styles.overflowIndicator, sizeStyles.overflow]} />
        )}
      </View>
      {showLabels && (
        <View style={styles.goalContainer}>
          <Text style={styles.goalText}>Goal: {goal} cal</Text>
          <Text style={[styles.percentageText, { color: progressColor }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
    </View>
  );

  const renderVerticalBar = () => (
    <View style={[styles.container, styles.verticalContainer]}>
      <View style={[styles.verticalBarContainer, sizeStyles.container]}>
        <View
          style={[
            styles.verticalProgressBar,
            sizeStyles.progress,
            {
              backgroundColor: progressColor,
              height: `${Math.min(percentage, 100)}%`
            }
          ]}
        />
        {isOverGoal && (
          <View style={[styles.verticalOverflowIndicator, sizeStyles.overflow]} />
        )}
      </View>
      {showLabels && (
        <View style={styles.verticalLabelContainer}>
          <Text style={[styles.currentLabel, { color: progressColor }]}>
            {displayCurrent}
          </Text>
          <Text style={styles.goalLabel}>/{goal}</Text>
        </View>
      )}
    </View>
  );

  return variant === 'horizontal' ? renderHorizontalBar() : renderVerticalBar();
}

function getSizeStyles(size: 'small' | 'medium' | 'large', variant: 'horizontal' | 'vertical') {
  if (variant === 'horizontal') {
    switch (size) {
      case 'small':
        return {
          container: { height: 6 },
          progress: { borderRadius: 3 },
          overflow: { height: 8, top: -1 }
        };
      case 'large':
        return {
          container: { height: 12 },
          progress: { borderRadius: 6 },
          overflow: { height: 16, top: -2 }
        };
      default: // medium
        return {
          container: { height: 8 },
          progress: { borderRadius: 4 },
          overflow: { height: 12, top: -2 }
        };
    }
  } else {
    switch (size) {
      case 'small':
        return {
          container: { width: 6, height: 60 },
          progress: { borderRadius: 3 },
          overflow: { width: 8, left: -1 }
        };
      case 'large':
        return {
          container: { width: 12, height: 100 },
          progress: { borderRadius: 6 },
          overflow: { width: 16, left: -2 }
        };
      default: // medium
        return {
          container: { width: 8, height: 80 },
          progress: { borderRadius: 4 },
          overflow: { width: 12, left: -2 }
        };
    }
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  verticalContainer: {
    alignItems: 'center',
    width: 'auto',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  barContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  overflowIndicator: {
    position: 'absolute',
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    width: 4,
  },
  goalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  goalText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  verticalBarContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalProgressBar: {
    width: '100%',
    borderRadius: 4,
  },
  verticalOverflowIndicator: {
    position: 'absolute',
    top: -2,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    height: 4,
  },
  verticalLabelContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
});