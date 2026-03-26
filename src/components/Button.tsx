import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  PressableProps,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { spacing, radius, touchTargetMin, useTheme } from '../theme';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button = ({
  title,
  variant = 'primary',
  loading,
  style,
  disabled,
  accessibilityState: userA11yState,
  ...pressableProps
}: ButtonProps) => {
  const { colors, isDark } = useTheme();
  const isPrimary = variant === 'primary';
  const backgroundColor = isPrimary ? colors.accent : 'transparent';

  const textColor = isPrimary
    ? isDark
      ? '#000000'
      : '#FFFFFF'
    : colors.textPrimary;

  const isDisabled = !!(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        ...userA11yState,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      android_ripple={
        isPrimary && !isDisabled
          ? {
              color: isDark
                ? 'rgba(255,255,255,0.22)'
                : 'rgba(255,255,255,0.35)',
              foreground: true,
              borderless: false,
            }
          : undefined
      }
      style={({ pressed }) => [
        styles.container,
        { backgroundColor },
        !isPrimary && styles.ghostContainer,
        isDisabled && styles.disabled,
        !isDisabled &&
          pressed && {
            opacity: isPrimary ? 0.92 : 0.65,
            transform: [{ scale: isPrimary ? 0.985 : 1 }],
          },
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: touchTargetMin,
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  ghostContainer: {
    paddingVertical: spacing.m,
    minHeight: touchTargetMin,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
