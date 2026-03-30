import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, useTheme } from '../../../theme';
import { ClipboardList } from 'lucide-react-native';
import { useTaskScreenLayout } from '../hooks/useTaskScreenLayout';

type EmptyVariant = 'default' | 'filtered';

interface EmptyTaskListProps {
  variant?: EmptyVariant;
}

export const EmptyTaskList = ({ variant = 'default' }: EmptyTaskListProps) => {
  const { colors } = useTheme();
  const { horizontalPadding, isShortWindow, width } = useTaskScreenLayout();
  const isFiltered = variant === 'filtered';
  const topMargin = isShortWindow ? spacing.xxl : spacing.xxl * 3;
  const bodyMaxWidth = Math.min(360, width - horizontalPadding * 2);

  const a11yLabel = isFiltered
    ? 'No tasks in this date range. Change the date filter or clear it to see all tasks.'
    : 'No tasks yet. Add a task with the add button to get started.';

  return (
    <View
      style={[
        styles.emptyContainer,
        {
          marginTop: topMargin,
          paddingHorizontal: horizontalPadding,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.surfaceHighlight,
            borderColor: colors.border,
          },
        ]}
        accessible={false}
      >
        <ClipboardList size={44} color={colors.accent} strokeWidth={1.5} />
      </View>
      <Text
        style={[styles.emptyTitle, { color: colors.textPrimary }]}
        accessible={false}
        maxFontSizeMultiplier={1.55}
      >
        {isFiltered ? 'Nothing in this period' : 'No tasks yet'}
      </Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.textSecondary, maxWidth: bodyMaxWidth },
        ]}
        accessible={false}
        maxFontSizeMultiplier={1.55}
      >
        {isFiltered
          ? 'Try another date or clear the filter to show all tasks.'
          : 'Tap the plus button below to add your first task.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: spacing.xl,
    borderRadius: 999,
    marginBottom: spacing.l,
    borderWidth: 1,
  },
  emptyTitle: {
    ...typography.title2,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 24,
  },
});
