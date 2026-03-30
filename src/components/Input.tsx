import React, { forwardRef, useState, useCallback } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { radius, spacing, typography, useTheme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, style, accessibilityLabel, ...props }, ref) => {
    const { colors, isDark } = useTheme();
    const [focused, setFocused] = useState(false);
    const { multiline, onFocus, onBlur } = props;
    const fieldLabel = accessibilityLabel ?? label ?? props.placeholder;
    const a11yLabel =
      error && fieldLabel ? `${fieldLabel}. Error: ${error}` : fieldLabel;

    const borderColor = error
      ? colors.error
      : focused
        ? colors.accent
        : colors.inputBorder;

    const handleFocus = useCallback(
      (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        setFocused(true);
        onFocus?.(e);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        setFocused(false);
        onBlur?.(e);
      },
      [onBlur],
    );

    return (
      <View style={styles.container}>
        {label ? (
          <Text
            style={[styles.label, { color: colors.textPrimary }]}
            nativeID={`input-label-${label}`}
          >
            {label}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              backgroundColor: isDark
                ? colors.surfaceHighlight
                : colors.card,
              borderColor,
            },
            multiline && styles.multilineInput,
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={a11yLabel}
          accessibilityState={props.accessibilityState}
        />
        {error ? (
          <Text
            style={[styles.errorText, { color: colors.error }]}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.l,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.m,
    padding: spacing.l,
    ...typography.body,
    includeFontPadding: false, // Android fix
    textAlignVertical: 'center',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
