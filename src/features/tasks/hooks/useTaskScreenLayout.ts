import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { spacing } from '../../../theme';

/** Layout breakpoints for the tasks feature (logical px). */
const COMPACT_W = 360;
const NARROW_W = 400;
const TABLET_W = 600;
const SHORT_H = 640;

/**
 * Shared responsive metrics for task list, sheets, and related UI.
 * Use in task screens/components instead of hard-coded paddings and sizes.
 */
export function useTaskScreenLayout() {
  const { width, height, fontScale } = useWindowDimensions();

  const isCompact = width < COMPACT_W;
  const isNarrow = width < NARROW_W;
  const isTablet = width >= TABLET_W;
  const isShortWindow = height < SHORT_H;
  /** Readable line length cap on large phones / tablets. */
  const maxListContentWidth = isTablet ? Math.min(620, width - spacing.m * 2) : width;

  const horizontalPadding = useMemo(() => {
    if (isTablet) {
      const side = Math.max(spacing.xl, (width - maxListContentWidth) / 2);
      return Math.round(side);
    }
    if (isCompact) return spacing.m;
    if (isNarrow) return spacing.l;
    return spacing.xl;
  }, [width, isTablet, isCompact, isNarrow, maxListContentWidth]);

  const fabEdgeInset = isCompact ? spacing.m : spacing.l + 4;
  const listBottomExtra = isShortWindow ? 88 : 100;
  const flashListDrawDistance = Math.min(520, Math.max(280, height * 0.55));

  return {
    width,
    height,
    fontScale,
    isCompact,
    isNarrow,
    isTablet,
    isShortWindow,
    horizontalPadding,
    maxListContentWidth,
    fabEdgeInset,
    listBottomExtra,
    flashListDrawDistance,
    /** Title “My tasks” scale tier. */
    headerTitleSize: isCompact ? 24 : isTablet ? 34 : 28,
    headerTitleLineHeight: isCompact ? 30 : isTablet ? 40 : 34,
    swipeDeleteRailWidth: isCompact ? 92 : 104,
  };
}
