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
  const { items, removeItem, pinItem, unpinItem, pinnedItems } = useClosetStore();

  const category = CLOSET_CATEGORIES.find((c) => c.id === id);
  
  const getCategoryItems = () => {
    if (id === "accessories") {
      return items.filter((item) => 
        item.categoryId === "accessories"
      );
    }
    return items.filter((item) => item.categoryId === id);
  };

  const categoryItems = getCategoryItems();

  const handleAddItem = () => {
    let targetCategory = id;
    if (id === "accessories") {
      targetCategory = "accessories";
    }
    
    router.push({
      pathname: "/closet/add",
      params: { category: targetCategory },
    });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handlePinToggle = (itemId: string) => {
    const isPinned = pinnedItems[id!] === itemId;
    if (isPinned) {
      unpinItem(id!);
    } else {
      pinItem(id!, itemId);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: category?.name || "CATEGORY",
        }}
      />

      <FlatList
        data={categoryItems}
        renderItem={({ item }) => (
          <ClothingItem
            item={item}
            showRemoveButton
            showPinButton
            isPinned={pinnedItems[id!] === item.id}
            onRemove={() => handleRemoveItem(item.id)}
            onPin={() => handlePinToggle(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              NO ITEMS IN THIS CATEGORY YET.
            </Text>
            <Pressable style={styles.addButton} onPress={handleAddItem}>
              <Text style={styles.addButtonText}>ADD ITEM</Text>
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