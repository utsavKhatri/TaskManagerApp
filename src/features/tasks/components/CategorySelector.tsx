import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Category } from '../../../api/categories';
import { radius, spacing, typography, useTheme } from '../../../theme';

interface CategorySelectorProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const CategorySelector = ({
  categories,
  selectedId,
  onSelect,
}: CategorySelectorProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={styles.container}
      accessibilityRole="radiogroup"
      accessibilityLabel="Category"
    >
      <Text
        style={[styles.label, { color: colors.textPrimary }]}
        accessible={false}
      >
        Category
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map(category => {
          const isSelected = selectedId === category.id;
          return (
            <Pressable
              key={category.id}
              style={({ pressed }) => [
                styles.item,
                isSelected && {
                  backgroundColor: category.color,
                  borderColor: category.color,
                },
                { borderColor: category.color },
                pressed && !isSelected && { opacity: 0.72 },
              ]}
              onPress={() => onSelect(category.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={category.name}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isSelected ? '#FFFFFF' : category.color },
                ]}
              />
              <Text
                style={[
                  styles.text,
                  { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                ]}
                accessible={false}
              >
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.l,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: 10,
    borderRadius: radius.l,
    marginRight: spacing.s,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.s,
  },
  text: {
    ...typography.body,
    fontWeight: '500',
  },
});
