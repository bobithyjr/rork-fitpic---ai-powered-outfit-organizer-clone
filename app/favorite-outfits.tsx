import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, Pressable } from "react-native";
import { Stack } from "expo-router";
import { Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import { Outfit } from "@/types/clothing";
import OutfitModal from "./outfit-modal";

export default function FavoriteOutfitsScreen() {
  const { savedOutfits, removeSavedOutfit } = useClosetStore();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleViewOutfit = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOutfit(null);
  };

  const renderOutfit = ({ item }: { item: Outfit }) => (
    <View style={styles.outfitCard}>
      <Pressable
        onPress={() => handleViewOutfit(item)}
        style={styles.outfitButton}
      >
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
      </Pressable>
      <Pressable
        onPress={() => handleRemoveOutfit(item.id)}
        style={styles.removeButton}
      >
        <Trash2 size={18} color={Colors.error} />
      </Pressable>
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

      <OutfitModal
        visible={modalVisible}
        outfit={selectedOutfit}
        onClose={handleCloseModal}
        title="FAVORITE OUTFIT"
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  outfitButton: {
    flex: 1,
    padding: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  removeButton: {
    padding: 16,
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