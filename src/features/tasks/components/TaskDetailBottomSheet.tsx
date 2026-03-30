import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Text,
  Animated,
  PanResponder,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { Button } from '../../../components/Button';
import {
  radius,
  spacing,
  typography,
  useTheme,
  getModalSafeBottomInset,
} from '../../../theme';
import { Task } from '../../../api/tasks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskScreenLayout } from '../hooks/useTaskScreenLayout';

interface TaskDetailBottomSheetProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
}

export const TaskDetailBottomSheet = ({
  visible,
  task,
  onClose,
}: TaskDetailBottomSheetProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { isCompact, maxListContentWidth, isTablet } = useTaskScreenLayout();

  const slideAnim = useRef(new Animated.Value(windowHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

  useEffect(() => {
    if (visible && task) {
      isClosing.current = false;
      slideAnim.setValue(windowHeight);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 64,
          velocity: 0,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, task, slideAnim, fadeAnim, windowHeight]);

  const handleClose = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: windowHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [windowHeight, slideAnim, fadeAnim, onClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 10,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            slideAnim.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 100) {
            handleClose();
          } else {
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
              tension: 64,
            }).start();
          }
        },
      }),
    [handleClose, slideAnim],
  );

  if (!visible || !task) return null;

  const sheetBottomPad =
    getModalSafeBottomInset(insets.bottom) + spacing.l;
  const sheetMaxHeight = Math.min(
    windowHeight * 0.9,
    windowHeight - Math.max(insets.top, spacing.m),
  );
  const sheetPadH = isCompact ? spacing.m : spacing.l;

  const created = new Date(task.created_at).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          accessibilityHint="Closes task details"
          style={[
            styles.overlay,
            {
              backgroundColor: colors.overlay,
              opacity: fadeAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <View style={styles.keyboardView} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.card,
              transform: [{ translateY: slideAnim }],
              paddingBottom: sheetBottomPad,
              paddingHorizontal: sheetPadH,
              maxHeight: sheetMaxHeight,
              maxWidth: isTablet ? maxListContentWidth : undefined,
              width: '100%',
              alignSelf: isTablet ? 'center' : undefined,
            },
          ]}
        >
          <View
            {...panResponder.panHandlers}
            style={styles.dragHandleContainer}
          >
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: colors.textTertiary },
              ]}
            />
          </View>

          <View style={styles.header}>
            <View
              style={[
                styles.doneBadge,
                {
                  backgroundColor: colors.success + '22',
                  borderColor: colors.success + '55',
                },
              ]}
            >
              <Check size={16} color={colors.success} strokeWidth={2.5} />
              <Text style={[styles.doneBadgeText, { color: colors.success }]}>
                Completed
              </Text>
            </View>
            <Text
              style={[styles.headerTitle, { color: colors.textPrimary }]}
              accessibilityRole="header"
            >
              Task details
            </Text>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Title
              </Text>
              <Text
                style={[
                  styles.titleText,
                  {
                    color: colors.textTertiary,
                    textDecorationLine: 'line-through',
                  },
                ]}
                maxFontSizeMultiplier={1.6}
              >
                {task.title}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Description
              </Text>
              {task.description ? (
                <Text
                  style={[styles.bodyText, { color: colors.textSecondary }]}
                  maxFontSizeMultiplier={1.65}
                >
                  {task.description}
                </Text>
              ) : (
                <Text
                  style={[styles.placeholderText, { color: colors.textTertiary }]}
                >
                  No description
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Added
              </Text>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {created}
              </Text>
            </View>

            <Button
              title="Close"
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel="Close task details"
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: radius.l + 2,
    borderTopRightRadius: radius.l + 2,
    paddingTop: spacing.s,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingBottom: spacing.m,
    paddingTop: spacing.xs,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    opacity: 0.45,
  },
  header: {
    marginBottom: spacing.l,
    alignItems: 'center',
    gap: spacing.m,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  doneBadgeText: {
    ...typography.subtitle,
    fontSize: 13,
  },
  headerTitle: {
    ...typography.title2,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 0,
  },
  scrollContentInner: {
    paddingBottom: spacing.s,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.s,
  },
  titleText: {
    ...typography.body,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  bodyText: {
    ...typography.body,
    lineHeight: 24,
  },
  placeholderText: {
    ...typography.body,
    fontStyle: 'italic',
  },
  metaText: {
    ...typography.body,
  },
  closeButton: {
    marginTop: spacing.s,
  },
});
