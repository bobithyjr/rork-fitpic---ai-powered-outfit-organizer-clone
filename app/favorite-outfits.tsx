import React from "react";
import { StyleSheet, View, Text, FlatList, Pressable } from "react-native";
import { Stack } from "expo-router";
import { Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import CompactOutfitGrid from "@/components/CompactOutfitGrid";
import { Outfit } from "@/types/clothing";

export default function FavoriteOutfitsScreen() {
  const { savedOutfits, removeSavedOutfit } = useClosetStore();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRemoveOutfit = (outfitId: string) => {
    removeSavedOutfit(outfitId);
  };

  const renderOutfit = ({ item }: { item: Outfit }) => (
    <View style={styles.outfitCard}>
      <View style={styles.outfitHeader}>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        <Pressable
          onPress={() => handleRemoveOutfit(item.id)}
          style={styles.removeButton}
        >
          <Trash2 size={16} color={Colors.error} />
        </Pressable>
      </View>
      <View style={styles.outfitPreview}>
        <CompactOutfitGrid
          outfit={item.items}
          enabledCategories={{}}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "FAVORITE OUTFITS",
        }}
      />

      <FlatList
        data={savedOutfits}
        renderItem={renderOutfit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              NO FAVORITE OUTFITS YET.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              SAVE SOME OUTFITS TO SEE THEM HERE!
            </Text>
          </View>
        }
      />
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
  },
  outfitCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  outfitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  removeButton: {
    padding: 4,
  },
  outfitPreview: {
    height: 140,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  emptyStateText: {
    fontSize: 18,
    color: Colors.darkGray,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: "center",
  },
});