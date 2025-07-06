import React from "react";
import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import { CLOSET_CATEGORIES } from "@/constants/categories";
import Colors from "@/constants/colors";

type Props = {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
};

export default function CategorySelector({
  selectedCategory,
  onSelectCategory,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CLOSET_CATEGORIES.map((category) => (
        <Pressable
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.selectedCategory,
          ]}
          onPress={() => onSelectCategory(category.id)}
        >
          <Text
            style={[
              styles.categoryText,
              selectedCategory === category.id && styles.selectedCategoryText,
            ]}
          >
            {category.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: Colors.background,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: Colors.lightGray,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategory: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    color: Colors.text,
    fontWeight: "500",
    fontSize: 14,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: "white",
  },
});