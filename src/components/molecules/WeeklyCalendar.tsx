// src/components/molecules/WeeklyCalendar.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';

const { width } = Dimensions.get('window');

interface WeeklyCalendarProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateSelect: (date: string) => void;
  minDate?: string; // Minimum selectable date (YYYY-MM-DD)
  maxDate?: string; // Maximum selectable date (YYYY-MM-DD)
}

interface DayInfo {
  date: string; // YYYY-MM-DD
  dayOfWeek: 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
}

export default function WeeklyCalendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
}: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current week, -1 = past, 1 = future
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Helper functions for date manipulation
  const getStartOfWeek = (date: Date): Date => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day; // Sunday = 0
    return new Date(start.setDate(diff));
  };

  const formatDate = (date: Date): string => {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  };

  const parseDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const getDayOfWeek = (date: Date): DayInfo['dayOfWeek'] => {
    const days: DayInfo['dayOfWeek'][] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Generate week data based on current week offset
  const generateWeekData = (weekOffset: number): DayInfo[] => {
    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today);
    const startOfTargetWeek = new Date(startOfCurrentWeek);
    startOfTargetWeek.setDate(startOfCurrentWeek.getDate() + (weekOffset * 7));

    const weekDays: DayInfo[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfTargetWeek);
      date.setDate(startOfTargetWeek.getDate() + i);

      const dateString = formatDate(date);
      const isToday = formatDate(date) === formatDate(today);
      const isSelected = dateString === selectedDate;

      // Check if date is within allowed range
      let isInRange = true;
      if (minDate && dateString < minDate) isInRange = false;
      if (maxDate && dateString > maxDate) isInRange = false;

      weekDays.push({
        date: dateString,
        dayOfWeek: getDayOfWeek(date),
        dayNumber: date.getDate(),
        monthName: getMonthName(date),
        isToday,
        isSelected,
        isInRange,
      });
    }

    return weekDays;
  };

  // Calculate date range limits for navigation
  const getWeekLimits = (): { canGoPast: boolean; canGoFuture: boolean } => {
    const today = new Date();
    const pastWeekLimit = new Date(today);
    pastWeekLimit.setDate(today.getDate() - 21); // 3 weeks back

    const futureWeekLimit = new Date(today);
    futureWeekLimit.setDate(today.getDate() + 14); // 2 weeks forward

    const currentWeekStart = getStartOfWeek(today);
    const targetWeekStart = new Date(currentWeekStart);
    targetWeekStart.setDate(currentWeekStart.getDate() + (currentWeek * 7));

    const canGoPast = currentWeek > -3;
    const canGoFuture = currentWeek < 2;

    return { canGoPast, canGoFuture };
  };

  // Navigate to previous/next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const { canGoPast, canGoFuture } = getWeekLimits();

    if (direction === 'prev' && canGoPast) {
      setCurrentWeek(prev => prev - 1);
    } else if (direction === 'next' && canGoFuture) {
      setCurrentWeek(prev => prev + 1);
    }
  };

  // Handle day selection
  const handleDayPress = (dayInfo: DayInfo) => {
    if (dayInfo.isInRange) {
      onDateSelect(dayInfo.date);
    }
  };

  // Auto-scroll to show selected date's week
  useEffect(() => {
    const today = new Date();
    const selectedDateObj = parseDate(selectedDate);
    const startOfCurrentWeek = getStartOfWeek(today);
    const startOfSelectedWeek = getStartOfWeek(selectedDateObj);

    const weekDiff = Math.round(
      (startOfSelectedWeek.getTime() - startOfCurrentWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    // Constrain to allowed range
    const constrainedWeek = Math.max(-3, Math.min(2, weekDiff));
    setCurrentWeek(constrainedWeek);
  }, [selectedDate]);

  // Smooth transition animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentWeek]);

  const weekData = generateWeekData(currentWeek);
  const { canGoPast, canGoFuture } = getWeekLimits();

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.weekContainer, { opacity: fadeAnim }]}>
        {/* Previous Week Arrow */}
        <TouchableOpacity
          style={[styles.navArrow, !canGoPast && styles.navArrowDisabled]}
          onPress={() => navigateWeek('prev')}
          disabled={!canGoPast}
        >
          {canGoPast && (
            <Ionicons name="chevron-back" size={20} color={colors.theme.teal} />
          )}
        </TouchableOpacity>

        {/* Days of the week */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysContainer}
          scrollEnabled={false} // Disable manual scrolling, use arrows only
        >
          {weekData.map((day) => (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayContainer,
                day.isSelected && styles.selectedDay,
                day.isToday && !day.isSelected && styles.todayDay,
                !day.isInRange && styles.disabledDay,
              ]}
              onPress={() => handleDayPress(day)}
              disabled={!day.isInRange}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayOfWeek,
                day.isSelected && styles.selectedText,
                day.isToday && !day.isSelected && styles.todayText,
                !day.isInRange && styles.disabledText,
              ]}>
                {day.isToday ? 'Today' : day.dayOfWeek}
              </Text>

              <Text style={[
                styles.dayNumber,
                day.isSelected && styles.selectedText,
                day.isToday && !day.isSelected && styles.todayText,
                !day.isInRange && styles.disabledText,
              ]}>
                {day.dayNumber}
              </Text>

              <Text style={[
                styles.monthName,
                day.isSelected && styles.selectedText,
                day.isToday && !day.isSelected && styles.todayText,
                !day.isInRange && styles.disabledText,
              ]}>
                {day.monthName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Next Week Arrow */}
        <TouchableOpacity
          style={[styles.navArrow, !canGoFuture && styles.navArrowDisabled]}
          onPress={() => navigateWeek('next')}
          disabled={!canGoFuture}
        >
          {canGoFuture && (
            <Ionicons name="chevron-forward" size={20} color={colors.theme.teal} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  weekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.theme.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  navArrowDisabled: {
    backgroundColor: 'transparent',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    flex: 1,
    marginHorizontal: spacing.xs, // Move calendar content left slightly
  },
  dayContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 42, // Slightly smaller to prevent touch overlap
    backgroundColor: 'transparent',
  },
  selectedDay: {
    backgroundColor: colors.theme.teal,
    ...shadows.sm,
  },
  todayDay: {
    backgroundColor: colors.theme.orange,
    ...shadows.sm,
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayOfWeek: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.theme.teal,
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.theme.teal,
    marginBottom: 2,
  },
  monthName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[500],
  },
  selectedText: {
    color: colors.theme.white,
  },
  todayText: {
    color: colors.theme.white,
  },
  disabledText: {
    color: colors.gray[300],
  },
});