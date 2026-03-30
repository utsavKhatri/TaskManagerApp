import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  Text,
  Animated,
  PanResponder,
  Keyboard,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Input } from '../../../components/Input';
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

interface TaskFormBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
  initialData?: Task | null;
  loading?: boolean;
}

export const TaskFormBottomSheet = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: TaskFormBottomSheetProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { isCompact, maxListContentWidth, isTablet } = useTaskScreenLayout();

  const slideAnim = useRef(new Animated.Value(windowHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isClosing = useRef(false);

  const descriptionRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Reset state when opening
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
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
  }, [visible, initialData, slideAnim, fadeAnim, windowHeight]);

  const handleClose = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    Keyboard.dismiss();

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

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title, description);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 10;
        },
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

  if (!visible) return null;

  const sheetBottomPad =
    getModalSafeBottomInset(insets.bottom) + spacing.l;
  const sheetMaxHeight = Math.min(
    windowHeight * 0.9,
    windowHeight - Math.max(insets.top, spacing.m),
  );
  const sheetPadH = isCompact ? spacing.m : spacing.l;

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
          accessibilityHint="Closes the sheet without saving"
          style={[
            styles.overlay,
            {
              backgroundColor: colors.overlay,
              opacity: fadeAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
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
          {/* Drag Handle */}
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
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {initialData ? 'Edit Task' : 'New Task'}
            </Text>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.form}>
              <Input
                label="Title"
                placeholder="What needs to be done?"
                value={title}
                onChangeText={setTitle}
                autoFocus={!initialData}
                accessibilityLabel="Task Title"
                returnKeyType="next"
                onSubmitEditing={() => descriptionRef.current?.focus()}
                blurOnSubmit={false}
              />

              <Input
                ref={descriptionRef}
                label="Description (Optional)"
                placeholder="Add more details..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={[styles.textArea, isCompact && styles.textAreaCompact]}
                accessibilityLabel="Task Description"
              />
            </View>

            <View
              style={[styles.footer, isCompact && styles.footerStack]}
            >
              <Button
                title="Cancel"
                variant="ghost"
                onPress={handleClose}
                style={styles.cancelButton}
                accessibilityLabel="Cancel editing task"
              />
              <Button
                title="Save"
                onPress={handleSubmit}
                loading={loading}
                disabled={!title.trim()}
                style={styles.saveButton}
                accessibilityLabel="Save task"
              />
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
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
    shadowOffset: {
      width: 0,
      height: -4,
    },
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
    marginBottom: spacing.m,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.title2,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 0,
  },
  form: {
    marginBottom: spacing.l,
    gap: spacing.m,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaCompact: {
    minHeight: 64,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  footerStack: {
    flexDirection: 'column',
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
