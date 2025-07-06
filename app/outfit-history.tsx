import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, Pressable } from "react-native";
import { Stack } from "expo-router";
import { Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import { Outfit } from "@/types/clothing";
import OutfitModal from "./outfit-modal";

export default function OutfitHistoryScreen() {
  const { outfitHistory, clearHistory } = useClosetStore();
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

  const handleViewOutfit = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOutfit(null);
  };

  const renderOutfit = ({ item }: { item: Outfit }) => (
    <Pressable
      onPress={() => handleViewOutfit(item)}
      style={styles.outfitCard}
    >
      <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "OUTFIT HISTORY",
          headerRight: () => (
            <Pressable onPress={clearHistory} style={styles.clearButton}>
              <Trash2 size={20} color={Colors.error} />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={outfitHistory}
        renderItem={renderOutfit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              NO OUTFIT HISTORY YET.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              GENERATE SOME OUTFITS TO SEE THEM HERE!
            </Text>
          </View>
        }
      />

      <OutfitModal
        visible={modalVisible}
        outfit={selectedOutfit}
        onClose={handleCloseModal}
        title="OUTFIT HISTORY"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  clearButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  outfitCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
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