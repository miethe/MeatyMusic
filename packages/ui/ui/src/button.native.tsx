import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'link'
  | 'destructive'
  | 'premium'
  | 'default';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'default';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#e5e7eb' },
  ghost: { backgroundColor: 'transparent' },
  outline: { borderWidth: 1, borderColor: '#d1d5db' },
  link: {},
  destructive: { backgroundColor: '#dc2626' },
  premium: { backgroundColor: '#8b5cf6' },
  default: { backgroundColor: '#2563eb' },
  sm: { paddingHorizontal: 12, paddingVertical: 6 },
  md: { paddingHorizontal: 16, paddingVertical: 8 },
  lg: { paddingHorizontal: 20, paddingVertical: 12 },
  icon: { padding: 8 },
  text: { color: '#ffffff', fontSize: 14, fontWeight: '500' },
  textSecondary: { color: '#111827' },
});

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onPress,
}) => {
  const variantStyle = (styles as Record<ButtonVariant, object>)[variant] || styles.primary;
  const sizeStyles: Record<ButtonSize, object> = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
    icon: styles.icon,
    default: styles.md, // fallback to md for 'default'
  };
  const sizeStyle = sizeStyles[size];
  const textStyle = variant === 'secondary' ? styles.textSecondary : styles.text;

  return (
    <Pressable
      style={[styles.base, variantStyle, sizeStyle, disabled ? { opacity: 0.5 } : null]}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? <ActivityIndicator color={textStyle.color} /> : <Text style={textStyle}>{children}</Text>}
    </Pressable>
  );
};

export default Button;
