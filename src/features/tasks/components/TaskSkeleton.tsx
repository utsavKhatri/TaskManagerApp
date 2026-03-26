import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../../../theme';

const { width } = Dimensions.get('window');

const SkeletonItem = ({
  width: itemWidth,
  height,
  style,
}: {
  width: number | string;
  height: number;
  style?: object;
}) => {
  const { isDark, colors } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const baseColor = isDark ? colors.surfaceHighlight : colors.border;

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: itemWidth,
          height,
          backgroundColor: baseColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const TaskSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6, 7].map(key => (
        <View
          key={key}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <SkeletonItem
            width={4}
            height={40}
            style={styles.railSk}
          />
          <SkeletonItem
            width={22}
            height={22}
            style={styles.checkSk}
          />
          <View style={styles.textCol}>
            <SkeletonItem width={width * 0.42} height={14} />
            <SkeletonItem
              width={width * 0.28}
              height={11}
              style={styles.line2}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.m,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingRight: spacing.m,
    paddingLeft: spacing.xs,
    borderRadius: radius.m + 2,
    marginBottom: spacing.s,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 72,
  },
  railSk: {
    borderRadius: 2,
    marginRight: spacing.xs,
    marginLeft: spacing.xs,
  },
  checkSk: {
    borderRadius: 7,
    marginRight: spacing.s,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  line2: {
    marginTop: 2,
  },
  skeletonBase: {
    borderRadius: 4,
  },
});
