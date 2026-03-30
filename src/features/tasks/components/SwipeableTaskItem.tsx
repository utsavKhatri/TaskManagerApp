import React, { useCallback, useRef } from 'react';
import { Text, StyleSheet, View, Platform } from 'react-native';
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
import { useTaskScreenLayout } from '../hooks/useTaskScreenLayout';

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
    const { swipeDeleteRailWidth } = useTaskScreenLayout();
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
        <View
          style={[
            styles.deleteActionWrap,
            { width: swipeDeleteRailWidth },
          ]}
        >
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
              <Trash2 size={15} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <Text style={styles.deleteActionText} accessible={false}>
              Delete
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
      <View
        style={[
          styles.itemRowSpacing,
          isActive && styles.itemRowDraggingWrap,
        ]}
      >
        <Swipeable
          ref={swipeableRef}
          enabled={!disabled}
          /* Default is overflow:hidden — clips the active row bottom during DnD. */
          containerStyle={isActive ? styles.swipeClipDrag : undefined}
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
            <ScaleDecorator
              /* Large scales exceed the cell's laid-out rect on Android and clip. */
              activeScale={Platform.OS === 'android' ? 1 : 1.06}
            >
              <View style={styles.dragMeasureWrap} collapsable={false}>
                {content}
              </View>
            </ScaleDecorator>
          )}
        </Swipeable>
      </View>
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
      a.created_at === b.created_at &&
      prev.isActive === next.isActive &&
      prev.disableScaleDecorator === next.disableScaleDecorator &&
      prev.disabled === next.disabled
    );
  },
);

const styles = StyleSheet.create({
  /** Spacing between list rows lives outside Swipeable so action height matches the card, not card+gap. */
  itemRowSpacing: {
    marginBottom: spacing.m,
  },
  itemRowDraggingWrap: {
    overflow: 'visible',
    zIndex: 999,
    elevation: 12,
  },
  swipeClipDrag: {
    overflow: 'visible',
  },
  dragMeasureWrap: {
    overflow: 'visible',
  },
  deleteActionWrap: {
    alignSelf: 'stretch',
  },
  deleteAction: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: radius.l,
    marginLeft: spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
    paddingVertical: spacing.xs,
  },
  deleteActionPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  deleteIconBubble: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
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
