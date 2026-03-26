import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category } from '../../../api/categories';
import { spacing, typography, radius } from '../../../theme';

interface CategoryPillProps {
  category: Category;
  small?: boolean;
}

export const CategoryPill = ({ category, small }: CategoryPillProps) => {
  return (
    <View
      style={[
        styles.container,
        small && styles.smallContainer,
        { backgroundColor: category.color + '20' }, // 20% opacity
      ]}
    >
      <View style={[styles.dot, { backgroundColor: category.color }]} />
      <Text
        style={[
          styles.text,
          small && styles.smallText,
          { color: category.color },
        ]}
      >
        {category.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: radius.s,
    alignSelf: 'flex-start',
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
});
