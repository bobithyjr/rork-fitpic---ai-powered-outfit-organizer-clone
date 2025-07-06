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
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
  },
  selectedCategory: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    color: Colors.text,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "white",
  },
});