import React from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../../../theme';

interface TaskFabProps {
  onPress: () => void;
  bottomInset: number;
  disabled?: boolean;
}

export const TaskFab = ({ onPress, bottomInset, disabled }: TaskFabProps) => {
  const { colors, isDark } = useTheme();
  const iconColor = isDark ? '#000000' : '#FFFFFF';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: 28 + bottomInset,
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
      <Plus size={26} color={iconColor} strokeWidth={2.4} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
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
