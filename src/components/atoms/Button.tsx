// src/components/atoms/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={textStyle}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.sm,
  },

  // Variants - Earth-toned theme
  primary: {
    backgroundColor: colors.primary[500], // Deep Forest Green
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  secondary: {
    backgroundColor: colors.secondary[500], // Terracotta Clay
    borderWidth: 1,
    borderColor: colors.secondary[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500], // Deep Forest Green border
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  danger: {
    backgroundColor: colors.error[500], // Terracotta-based error
    borderWidth: 1,
    borderColor: colors.error[500],
  },

  // Sizes
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  large: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 48,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  loading: {
    opacity: 0.7,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },

  // Text styles
  text: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },

  // Variant text styles
  primaryText: {
    color: colors.text.inverse, // Cream Linen on dark buttons
  },
  secondaryText: {
    color: colors.text.inverse, // Cream Linen on terracotta
  },
  outlineText: {
    color: colors.primary[500], // Deep Forest Green
  },
  ghostText: {
    color: colors.primary[500], // Deep Forest Green
  },
  dangerText: {
    color: colors.text.inverse, // Cream Linen on error
  },

  // Size text styles
  smallText: {
    fontSize: typography.fontSize.xs,
  },
  mediumText: {
    fontSize: typography.fontSize.sm,
  },
  largeText: {
    fontSize: typography.fontSize.base,
  },

  disabledText: {
    color: colors.gray[400],
  },

  icon: {
    marginRight: spacing.sm,
    fontSize: typography.fontSize.base,
  },
});