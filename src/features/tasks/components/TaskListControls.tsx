import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { spacing, typography, radius, useTheme } from '../../../theme';

interface TaskListControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  horizontalPadding: number;
}

export const TaskListControls = ({
  searchQuery,
  setSearchQuery,
  horizontalPadding,
}: TaskListControlsProps) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.controls, { paddingHorizontal: horizontalPadding }]}>
      <View
        style={[
          styles.searchShell,
          {
            backgroundColor: colors.card,
            borderColor: focused ? colors.accent : colors.border,
            shadowColor: colors.accent,
          },
          focused && styles.searchShellFocused,
        ]}
      >
        <View style={styles.searchInner}>
          <View
            style={[
              styles.iconWell,
              { backgroundColor: colors.surfaceHighlight },
            ]}
          >
            <Search
              size={18}
              color={focused ? colors.accent : colors.textSecondary}
              strokeWidth={2.2}
            />
          </View>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search your tasks…"
            maxFontSizeMultiplier={1.5}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            accessibilityLabel="Search tasks"
            accessibilityRole="search"
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchQuery ? (
            <Pressable
              onPress={() => setSearchQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [
                styles.clearSearch,
                { backgroundColor: colors.surfaceHighlight },
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text style={{ color: colors.textSecondary }} accessible={false}>
                ✕
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    paddingBottom: spacing.l,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.m + 2,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 50,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  searchShellFocused: {
    borderWidth: 1.5,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  accentStripe: {
    width: 3,
    opacity: 0.85,
  },
  accentStripeFocused: {
    opacity: 1,
    width: 4,
  },
  searchInner: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.s,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.s,
    gap: spacing.s,
  },
  iconWell: {
    width: 36,
    height: 36,
    borderRadius: radius.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    ...typography.body,
    minHeight: 40,
    paddingVertical: 0,
  },
  clearSearch: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: radius.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
