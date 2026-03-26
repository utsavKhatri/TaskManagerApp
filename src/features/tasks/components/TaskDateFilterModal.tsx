import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { X } from 'lucide-react-native';
import {
  spacing,
  typography,
  radius,
  useTheme,
  getModalSafeBottomInset,
} from '../../../theme';
import { Button } from '../../../components/Button';
import { useToast } from '../../../context/ToastContext';
import type { TaskDateRange } from '../utils/taskDateFilter';
import type { TaskCreatedBounds } from '../../../api/tasks';
import {
  normalizeDayRange,
  buildCalendarPeriodMarked,
  clampRangeToDataBounds,
  isValidDayKey,
} from '../utils/taskDateFilter';

type Selection = { start: string; end: string | null };

type Props = {
  visible: boolean;
  onClose: () => void;
  appliedRange: TaskDateRange | null;
  dataBounds: TaskCreatedBounds | undefined;
  onApply: (range: TaskDateRange) => void;
  onClear: () => void;
};

export const TaskDateFilterModal = ({
  visible,
  onClose,
  appliedRange,
  dataBounds,
  onApply,
  onClear,
}: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { showToast } = useToast();
  const bottomPad = getModalSafeBottomInset(insets.bottom);

  const [selection, setSelection] = useState<Selection | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (appliedRange) {
      setSelection({
        start: appliedRange.start,
        end:
          appliedRange.start === appliedRange.end ? null : appliedRange.end,
      });
    } else {
      setSelection(null);
    }
  }, [visible, appliedRange]);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: colors.card,
      calendarBackground: colors.card,
      monthTextColor: colors.textPrimary,
      textSectionTitleColor: colors.textSecondary,
      dayTextColor: colors.textPrimary,
      textDisabledColor: colors.textTertiary,
      todayTextColor: colors.accent,
      arrowColor: colors.accent,
      selectedDayBackgroundColor: colors.accent,
      selectedDayTextColor: '#FFFFFF',
    }),
    [colors],
  );

  const onDayPress = useCallback((day: DateData) => {
    const key = day.dateString;
    if (!isValidDayKey(key)) return;
    setSelection(prev => {
      const doneRange = prev?.end != null;
      if (!prev || doneRange) {
        return { start: key, end: null };
      }
      const { start, end } = normalizeDayRange(prev.start, key);
      return { start, end };
    });
  }, []);

  const effectiveEnd = selection?.end ?? selection?.start ?? null;

  const markedDates = useMemo(() => {
    if (!selection?.start || !effectiveEnd) return {};
    return buildCalendarPeriodMarked(
      selection.start,
      effectiveEnd,
      colors.accent,
    );
  }, [selection?.start, effectiveEnd, colors.accent]);

  const initialMonth =
    appliedRange?.end ??
    appliedRange?.start ??
    dataBounds?.max ??
    format(new Date(), 'yyyy-MM-dd');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const minDate = dataBounds?.min ?? undefined;
  const maxDate = todayKey;

  const handleApply = () => {
    if (!selection?.start) {
      showToast('Select a date on the calendar', 'info');
      return;
    }
    const rawEnd = selection.end ?? selection.start;
    let { start, end } = normalizeDayRange(selection.start, rawEnd);
    const b = dataBounds;
    if (b?.min || b?.max) {
      const { start: cs, end: ce, wasClamped } = clampRangeToDataBounds(
        start,
        end,
        b.min,
        b.max,
      );
      start = cs;
      end = ce;
      if (wasClamped) {
        showToast('Adjusted to the dates where your tasks exist', 'info');
      }
    }
    onApply({ start, end });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={[styles.scrim, { backgroundColor: colors.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close date filter"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              maxHeight: height * 0.88,
              paddingBottom: bottomPad,
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleBlock}>
              <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
                Select one day or a date range.
              </Text>
              {dataBounds?.min ? (
                <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
                  Available from {dataBounds.min}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: colors.surfaceHighlight },
                pressed && { opacity: 0.75 },
              ]}
            >
              <X size={22} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <Calendar
            markingType="period"
            markedDates={markedDates}
            onDayPress={onDayPress}
            minDate={minDate}
            maxDate={maxDate}
            current={initialMonth}
            theme={calendarTheme}
            enableSwipeMonths
          />

          <View style={styles.actions}>
            <Button
              title="Clear filter"
              variant="ghost"
              onPress={onClear}
              accessibilityHint="Shows all tasks regardless of date"
              style={styles.actionBtn}
            />
            <Button
              title="Apply"
              onPress={handleApply}
              disabled={!selection?.start}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderRadius: radius.l,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.s,
    gap: spacing.m,
  },
  sheetTitleBlock: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.title2,
    marginBottom: spacing.xs,
  },
  sheetHint: {
    ...typography.caption,
    lineHeight: 18,
    opacity: 0.95,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.m,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
  },
  actionBtn: {
    flex: 1,
  },
});
