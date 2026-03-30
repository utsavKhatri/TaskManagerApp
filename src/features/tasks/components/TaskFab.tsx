import React from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { useTaskScreenLayout } from '../hooks/useTaskScreenLayout';

interface TaskFabProps {
  onPress: () => void;
  bottomInset: number;
  disabled?: boolean;
}

export const TaskFab = ({ onPress, bottomInset, disabled }: TaskFabProps) => {
  const { colors, isDark } = useTheme();
  const { fabEdgeInset, isCompact } = useTaskScreenLayout();
  const iconColor = isDark ? '#000000' : '#FFFFFF';
  const fabSize = isCompact ? 52 : 56;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        {
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          right: fabEdgeInset,
          bottom: fabEdgeInset + bottomInset,
          backgroundColor: colors.accent,
          opacity: disabled ? 0.5 : 1,
        },
        pressed && !disabled && styles.fabPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Add task"
      accessibilityHint="Opens the form to create a new task"
      android_ripple={{
        color: 'rgba(255,255,255,0.35)',
        borderless: false,
        foreground: true,
      }}
    >
      <Plus size={isCompact ? 24 : 26} color={iconColor} strokeWidth={2.4} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 10,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
    shadowOpacity: 0.14,
  },
});
