import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LogOut, CalendarDays } from 'lucide-react-native';
import { spacing, typography, radius, useTheme } from '../../../theme';

interface TaskListHeaderProps {
  dateBadgeLabel: string;
  onOpenDateFilter: () => void;
  onSignOut: () => void;
  horizontalPadding: number;
  titleFontSize: number;
  titleLineHeight: number;
}

export const TaskListHeader = ({
  dateBadgeLabel,
  onOpenDateFilter,
  onSignOut,
  horizontalPadding,
  titleFontSize,
  titleLineHeight,
}: TaskListHeaderProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { paddingHorizontal: horizontalPadding }]}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onOpenDateFilter}
          accessibilityRole="button"
          accessibilityLabel={`Task date filter. Current: ${dateBadgeLabel}`}
          accessibilityHint="Opens a calendar to filter your task list by date or date range"
          style={({ pressed }) => [
            styles.datePill,
            {
              backgroundColor: colors.surfaceHighlight,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <CalendarDays
            size={16}
            color={colors.accent}
            strokeWidth={2}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.dateText, { color: colors.textSecondary }]}
            maxFontSizeMultiplier={1.5}
          >
            {dateBadgeLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={onSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          accessibilityHint="Ends your session on this device"
          style={({ pressed }) => [
            styles.signOutBtn,
            {
              backgroundColor: colors.surfaceHighlight,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.72 },
          ]}
        >
          <LogOut size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        {/* <View style={[styles.accentBar, { backgroundColor: colors.accent }]} /> */}
        <View style={styles.titleTextBlock}>
          <Text
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                fontSize: titleFontSize,
                lineHeight: titleLineHeight,
              },
            ]}
            maxFontSizeMultiplier={1.6}
          >
            My tasks
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.s,
    paddingBottom: spacing.m,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  datePill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    minHeight: 44,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: 0,
  },
  signOutBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.m,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    ...typography.caption,
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.m,
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 52,
  },
  titleTextBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  kicker: {
    ...typography.caption,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '500',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.6,
  },
});
