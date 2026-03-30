import React, { useEffect, useRef, useCallback } from 'react';
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

/** Must match DraggableFlatList “long press to drag” expectation, without RNGH Pressable (it ends the touch stream). */
const DRAG_ACTIVATE_MS = 200;

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
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelDragActivation = useCallback(() => {
    if (dragTimerRef.current != null) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
  }, []);

  const armDragActivation = useCallback(() => {
    cancelDragActivation();
    if (!onLongPress || disabled) return;
    dragTimerRef.current = setTimeout(() => {
      dragTimerRef.current = null;
      onLongPress();
    }, DRAG_ACTIVATE_MS);
  }, [onLongPress, disabled, cancelDragActivation]);

  useEffect(() => () => cancelDragActivation(), [cancelDragActivation]);

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

  const checkboxLabel = `${isCompleted ? 'Completed' : 'Not completed'}: ${task.title
    }`;
  const descriptionPart = task.description ? `. ${task.description}` : '';
  const descriptionText = task.description?.trim() ?? '';
  const rowA11yLabel = `${task.title}${descriptionPart}. ${isCompleted ? 'Completed' : 'Pending'
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
      <View
        style={styles.dragPressable}
        collapsable={false}
        onTouchStart={armDragActivation}
        onTouchEnd={cancelDragActivation}
        onTouchCancel={cancelDragActivation}
        pointerEvents={!onLongPress || disabled ? 'none' : 'auto'}
        accessible={!!onLongPress}
        accessibilityRole="button"
        accessibilityLabel="Reorder task"
        accessibilityHint="Hold, then drag vertically to reorder this task"
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
      </View>
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
              Platform.OS === 'android' && styles.titleAndroid,
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
            accessible={false}
            maxFontSizeMultiplier={1.65}
          >
            {task.title}
          </Text>

          {descriptionText ? (
            <Text
              style={[
                styles.description,
                {
                  color: isCompleted
                    ? colors.completedBody
                    : colors.textSecondary,
                },
                Platform.OS === 'android' && styles.descriptionAndroid,
              ]}
              numberOfLines={3}
              ellipsizeMode="tail"
              accessible={false}
              maxFontSizeMultiplier={1.65}
            >
              {descriptionText}
            </Text>
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
    borderWidth: 1.5,
    minHeight: 80,
  },
  containerDragging: {
    width: '90%',
    alignSelf: 'center',
    overflow: 'visible',
    paddingVertical: spacing.xs,
    transform: [{ scale: 1.01 }, { translateY: 2 }],
  },
  dragPressable: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    paddingRight: 2,
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
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'flex-start',
    paddingVertical: 2,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  textBlock: {
    gap: 4,
    width: '100%',
    minWidth: 0,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
  },
  titleAndroid: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  description: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionAndroid: {
    includeFontPadding: false,
  },
  completedText: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  pressedOpacity: {
    opacity: 0.7,
  },
});
