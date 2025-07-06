import React from "react";
import { StyleSheet, View, Text, FlatList, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import OutfitGrid from "@/components/OutfitGrid";
import { Outfit } from "@/types/clothing";

export default function OutfitHistoryScreen() {
  const router = useRouter();
  const { outfitHistory, clearHistory } = useClosetStore();

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

  const renderOutfit = ({ item }: { item: Outfit }) => (
    <View style={styles.outfitCard}>
      <View style={styles.outfitHeader}>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.outfitPreview}>
        <OutfitGrid
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
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  outfitHeader: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  outfitPreview: {
    height: 200,
    transform: [{ scale: 0.7 }],
    alignSelf: 'center',
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