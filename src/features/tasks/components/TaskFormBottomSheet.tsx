import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  Text,
  Animated,
  Dimensions,
  PanResponder,
  Keyboard,
  ScrollView,
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

import { CategorySelector } from './CategorySelector';
import { useCategories } from '../hooks/useTasks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TaskFormBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    description: string,
    categoryId: string | null,
  ) => void;
  initialData?: Task | null;
  loading?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  const { data: categories } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isClosing = useRef(false);

  const descriptionRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Reset state when opening
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
      setSelectedCategoryId(initialData?.category_id || null);
      isClosing.current = false;

      slideAnim.setValue(SCREEN_HEIGHT);
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
  }, [visible, initialData, slideAnim, fadeAnim]);

  const handleClose = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
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
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title, description, selectedCategoryId);
  };

  // Simple PanResponder for swipe-down-to-close
  const panResponder = useRef(
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
          // Spring back
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 64,
          }).start();
        }
      },
    }),
  ).current;

  if (!visible) return null;

  const sheetBottomPad =
    getModalSafeBottomInset(insets.bottom) + spacing.l;

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

              {categories && categories.length > 0 && (
                <CategorySelector
                  categories={categories}
                  selectedId={selectedCategoryId}
                  onSelect={setSelectedCategoryId}
                />
              )}

              <Input
                ref={descriptionRef}
                label="Description (Optional)"
                placeholder="Add more details..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={styles.textArea}
                accessibilityLabel="Task Description"
              />
            </View>

            <View style={styles.footer}>
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
    paddingHorizontal: spacing.l,
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
    maxHeight: '90%',
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
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
