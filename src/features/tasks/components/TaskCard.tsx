import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  useAnimatedReaction,
  useReducedMotion,
} from 'react-native-reanimated';
import { GripVertical, Check } from 'lucide-react-native';
import { Task } from '../../../api/tasks';
import { radius, spacing, typography, useTheme } from '../../../theme';
import { CategoryPill } from './CategoryPill';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onLongPress?: () => void;
  disabled?: boolean;
  isDragging?: boolean;
}

export const TaskCard = ({
  task,
  onToggleStatus,
  onEdit,
  onLongPress,
  disabled,
  isDragging,
}: TaskCardProps) => {
  const { colors, isDark } = useTheme();
  const isCompleted = task.status === 'completed';
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const skipCompletionAnim = useSharedValue(reducedMotion);

  useEffect(() => {
    skipCompletionAnim.value = reducedMotion;
  }, [reducedMotion, skipCompletionAnim]);

  useAnimatedReaction(
    () => isCompleted,
    (current, previous) => {
      if (skipCompletionAnim.value) {
        scale.value = 1;
        return;
      }
      if (current && !previous) {
        scale.value = withSequence(
          withTiming(1.15, { duration: 120 }),
          withSpring(1, { damping: 12, stiffness: 100 }),
        );
      }
    },
    [isCompleted],
  );

  const checkboxAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const checkboxLabel = `${isCompleted ? 'Completed' : 'Not completed'}: ${
    task.title
  }`;
  const categoryPart = task.category ? `, category ${task.category.name}` : '';
  const descriptionPart = task.description ? `. ${task.description}` : '';
  const descriptionText = task.description?.trim() ?? '';
  const rowA11yLabel = `${task.title}${descriptionPart}${categoryPart}. ${
    isCompleted ? 'Completed' : 'Pending'
  }`;

  const railColor = isCompleted ? colors.success : colors.accent;

  const shadowStyle =
    Platform.OS === 'ios'
      ? {
          shadowColor: isDark ? '#000' : colors.accent,
          shadowOffset: { width: 0, height: isDragging ? 12 : 4 },
          shadowOpacity: isDragging ? 0.25 : isDark ? 0.3 : 0.05,
          shadowRadius: isDragging ? 16 : 12,
        }
      : { elevation: isDragging ? 4 : isCompleted ? 0 : 2 };

  const shadowContainer = isDragging
    ? shadowStyle
    : !isCompleted
    ? shadowStyle
    : undefined;

  const cardBg = isDragging
    ? isDark
      ? colors.surfaceHighlight
      : colors.surfaceHighlight
    : isCompleted
    ? colors.cardDone
    : colors.card;

  const borderCol = isDragging
    ? colors.accent
    : isCompleted
    ? isDark
      ? 'rgba(76, 175, 131, 0.25)'
      : 'rgba(47, 125, 78, 0.20)'
    : colors.border;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: cardBg,
          borderColor: borderCol,
        },
        shadowContainer,
        isDragging && styles.containerDragging,
      ]}
      accessible={false}
    >
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={200}
        disabled={!onLongPress || disabled}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        style={styles.dragPressable}
        accessibilityRole="button"
        accessibilityLabel="Reorder task"
      >
        <View style={styles.dragZone} collapsable={false} accessible={false}>
          {isCompleted ? (
            <View
              style={[
                styles.rail,
                {
                  backgroundColor: railColor,
                  opacity: isCompleted ? 0.4 : 1,
                },
                isDragging && styles.railDragging,
              ]}
            />
          ) : null}
          <View style={[styles.dragHandle, { opacity: isCompleted ? 0.3 : 1 }]}>
            <GripVertical
              size={20}
              color={
                isCompleted
                  ? colors.textTertiary
                  : isDragging
                  ? colors.accent
                  : colors.textSecondary
              }
            />
          </View>
        </View>
      </Pressable>
      {!isDragging ? (
        <Pressable
          onPress={() => onToggleStatus(task)}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.checkboxHit,
            !disabled && pressed && !isDragging && styles.pressedOpacity,
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted, disabled: !!disabled }}
          accessibilityLabel={checkboxLabel}
          disabled={disabled || isDragging}
        >
          <Animated.View
            style={[
              styles.checkbox,
              checkboxAnimatedStyle,
              {
                borderColor: isCompleted
                  ? colors.success
                  : isDragging
                  ? colors.border
                  : colors.textTertiary,
                backgroundColor: isCompleted ? colors.success : 'transparent',
              },
            ]}
          >
            {isCompleted ? (
              <Check
                size={14}
                color={isDark ? '#0B0B0E' : '#FFFFFF'}
                strokeWidth={3.5}
              />
            ) : null}
          </Animated.View>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => onEdit(task)}
        disabled={disabled || isDragging}
        style={({ pressed }) => [
          styles.contentWrap,
          !disabled && pressed && !isDragging && styles.pressedOpacity,
        ]}
        accessibilityRole="button"
        accessibilityLabel={rowA11yLabel}
      >
        <View style={styles.textBlock}>
          <Text
            style={[
              styles.title,
              {
                color: isCompleted ? colors.completedTitle : colors.textPrimary,
              },
              isCompleted && styles.completedText,
            ]}
            numberOfLines={isDragging ? 1 : 2}
            ellipsizeMode="tail"
            accessible={false}
          >
            {task.title}
          </Text>

          {!isDragging && descriptionText ? (
            <Text
              style={[
                styles.description,
                {
                  color: isCompleted
                    ? colors.completedBody
                    : colors.textSecondary,
                },
              ]}
              numberOfLines={3}
              ellipsizeMode="tail"
              accessible={false}
            >
              {descriptionText}
            </Text>
          ) : null}

          {!isDragging && task.category ? (
            <View style={styles.categoryContainer} accessible={false}>
              <CategoryPill category={task.category} small />
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingRight: spacing.m,
    paddingVertical: spacing.s + 2,
    borderRadius: radius.l,
    marginBottom: spacing.m,
    borderWidth: 1.5,
    minHeight: 80,
  },
  containerDragging: {
    width: '90%',
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    maxHeight: 56,
    transform: [{ scale: 1.01 }, { translateY: 4 }],
  },
  dragPressable: {
    alignSelf: 'stretch',
    paddingTop: 8,
  },
  dragZone: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  rail: {
    width: 4,
    marginVertical: spacing.xs,
    marginLeft: spacing.m,
    marginRight: spacing.xs + 2,
    borderRadius: 2,
  },
  railDragging: {
    marginVertical: 4,
  },
  dragHandle: {
    paddingRight: spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
  checkboxHit: {
    justifyContent: 'flex-start',
    paddingTop: 6,
    paddingRight: spacing.m,
    alignItems: 'center',
    width: 40,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: 2,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  textBlock: {
    gap: 4,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
  },
  description: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  pressedOpacity: {
    opacity: 0.7,
  },
});
