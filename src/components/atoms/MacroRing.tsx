// src/components/atoms/MacroRing.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MacroRingProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function MacroRing({ 
  label, 
  current, 
  goal, 
  color, 
  unit = '', 
  size = 'medium' 
}: MacroRingProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const displayCurrent = Math.round(current);
  const isOverGoal = current > goal;
  
  const sizeStyles = getSizeStyles(size);
  const strokeWidth = size === 'large' ? 6 : size === 'medium' ? 4 : 3;
  
  return (
    <View style={styles.container}>
      <View style={[styles.ringContainer, sizeStyles.container, { borderColor: color }]}>
        <View 
          style={[
            styles.ringFill, 
            sizeStyles.fill,
            { 
              borderColor: color,
              borderTopWidth: percentage >= 25 ? strokeWidth : 0,
              borderRightWidth: percentage >= 50 ? strokeWidth : 0,
              borderBottomWidth: percentage >= 75 ? strokeWidth : 0,
              borderLeftWidth: percentage >= 100 ? strokeWidth : 0,
            }
          ]}
        />
        <View style={styles.ringCenter}>
          <Text style={[styles.ringPercentage, sizeStyles.percentage, isOverGoal && { color: '#EF4444' }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      </View>
      <Text style={[styles.macroLabel, sizeStyles.label]}>{label}</Text>
      <Text style={[styles.macroValue, sizeStyles.value, isOverGoal && { color: '#EF4444' }]}>
        {displayCurrent}{unit}/{goal}{unit}
      </Text>
    </View>
  );
}

function getSizeStyles(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        container: { width: 48, height: 48, borderWidth: 2 },
        fill: { width: 44, height: 44 },
        percentage: { fontSize: 10 },
        label: { fontSize: 11 },
        value: { fontSize: 10 }
      };
    case 'large':
      return {
        container: { width: 80, height: 80, borderWidth: 4 },
        fill: { width: 72, height: 72 },
        percentage: { fontSize: 14 },
        label: { fontSize: 14 },
        value: { fontSize: 12 }
      };
    default: // medium
      return {
        container: { width: 60, height: 60, borderWidth: 3 },
        fill: { width: 54, height: 54 },
        percentage: { fontSize: 12 },
        label: { fontSize: 12 },
        value: { fontSize: 11 }
      };
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  ringContainer: {
    borderRadius: 50,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  ringFill: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 0,
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentage: {
    fontWeight: '600',
    color: '#333',
  },
  macroLabel: {
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  macroValue: {
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});