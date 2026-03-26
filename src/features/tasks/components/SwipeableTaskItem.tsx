import React, { useCallback, useRef } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import Swipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Trash2 } from 'lucide-react-native';
import { TaskCard } from './TaskCard';
import { radius, spacing, useTheme } from '../../../theme';
import { Task } from '../../../api/tasks';
import { SharedValue } from 'react-native-reanimated';

interface SwipeableTaskItemProps {
  item: Task;
  drag: () => void;
  isActive: boolean;
  onToggle: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  disabled?: boolean;
}

export const SwipeableTaskItem = React.memo(
  ({
    item,
    drag,
    isActive,
    onToggle,
    onDelete,
    onEdit,
    disableScaleDecorator = false,
    disabled = false,
  }: SwipeableTaskItemProps & { disableScaleDecorator?: boolean }) => {
    const { colors } = useTheme();
    const swipeableRef = useRef<SwipeableMethods | null>(null);

    const requestDeleteConfirm = useCallback(() => {
      // Close first so the confirm dialog appears over a stable row.
      swipeableRef.current?.close();
      requestAnimationFrame(() => onDelete(item.id));
    }, [item.id, onDelete]);

    const renderRightActions = (
      _progress: SharedValue<number>,
      _translation: SharedValue<number>,
      _swipeableMethods: SwipeableMethods,
    ) => {
      return (
        <View style={styles.deleteActionWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.deleteAction,
              { backgroundColor: colors.error },
              pressed && styles.deleteActionPressed,
            ]}
            onPress={requestDeleteConfirm}
            accessibilityRole="button"
            accessibilityLabel={`Delete task, ${item.title}`}
            accessibilityHint="Removes this task after you confirm in the dialog"
          >
            <View style={styles.deleteIconBubble}>
              <Trash2 size={16} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <Text style={styles.deleteActionText} accessible={false}>
              Delete
            </Text>
            <Text style={styles.deleteActionSubText} accessible={false}>
              Confirm
            </Text>
          </Pressable>
        </View>
      );
    };

    const content = (
      <TaskCard
        task={item}
        onToggleStatus={onToggle}
        onEdit={onEdit}
        onLongPress={drag}
        disabled={isActive || disabled}
        isDragging={isActive}
      />
    );

    return (
      <Swipeable
        ref={swipeableRef}
        enabled={!disabled}
        renderRightActions={renderRightActions}
        rightThreshold={42}
        overshootRight={false}
        onSwipeableOpen={direction => {
          if (direction === 'right') {
            requestDeleteConfirm();
          }
        }}
      >
        {disableScaleDecorator ? (
          content
        ) : (
          <ScaleDecorator>{content}</ScaleDecorator>
        )}
      </Swipeable>
    );
  },
  (prev, next) => {
    const a = prev.item;
    const b = next.item;
    return (
      a.id === b.id &&
      a.title === b.title &&
      a.description === b.description &&
      a.status === b.status &&
      a.position === b.position &&
      a.category_id === b.category_id &&
      a.created_at === b.created_at &&
      (a.category?.id ?? null) === (b.category?.id ?? null) &&
      (a.category?.name ?? null) === (b.category?.name ?? null) &&
      (a.category?.color ?? null) === (b.category?.color ?? null) &&
      (a.category?.icon ?? null) === (b.category?.icon ?? null) &&
      prev.isActive === next.isActive &&
      prev.disableScaleDecorator === next.disableScaleDecorator &&
      prev.disabled === next.disabled
    );
  },
);

const styles = StyleSheet.create({
  deleteActionWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 104,
    marginBottom: spacing.s,
  },
  deleteAction: {
    width: 88,
    borderRadius: radius.m + 2,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
    height: '100%',
    gap: 2,
  },
  deleteActionPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  deleteIconBubble: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  deleteActionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 16,
  },
  deleteActionSubText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
});
