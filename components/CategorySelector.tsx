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
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
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
              numberOfLines={1}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingVertical: 12,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    minWidth: 70,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.mediumGray,
  },
  selectedCategory: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  selectedCategoryText: {
    color: "white",
  },
});