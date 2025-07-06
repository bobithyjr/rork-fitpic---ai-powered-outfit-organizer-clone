import React from "react";
import { StyleSheet, View, Text, FlatList, Pressable } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Plus } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import ClothingItem from "@/components/ClothingItem";
import { CLOSET_CATEGORIES } from "@/constants/categories";

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, removeItem } = useClosetStore();

  const category = CLOSET_CATEGORIES.find((c) => c.id === id);
  
  const getCategoryItems = () => {
    if (id === "accessories") {
      return items.filter((item) => 
        item.categoryId === "accessory1" || item.categoryId === "accessory2"
      );
    }
    return items.filter((item) => item.categoryId === id);
  };

  const categoryItems = getCategoryItems();

  const handleAddItem = () => {
    let targetCategory = id;
    if (id === "accessories") {
      targetCategory = "accessory1";
    }
    
    router.push({
      pathname: "/closet/add",
      params: { category: targetCategory },
    });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: category?.name || "Category",
        }}
      />

      <FlatList
        data={categoryItems}
        renderItem={({ item }) => (
          <ClothingItem
            item={item}
            showRemoveButton
            onRemove={() => handleRemoveItem(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No items in this category yet.
            </Text>
            <Pressable style={styles.addButton} onPress={handleAddItem}>
              <Text style={styles.addButtonText}>Add Item</Text>
            </Pressable>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={handleAddItem}>
        <Plus size={24} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: "center",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});