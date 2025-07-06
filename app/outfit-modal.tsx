import React from "react";
import { StyleSheet, View, Text, Pressable, Modal } from "react-native";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Outfit } from "@/types/clothing";
import OutfitGrid from "@/components/OutfitGrid";

interface OutfitModalProps {
  visible: boolean;
  outfit: Outfit | null;
  onClose: () => void;
  title?: string;
}

export default function OutfitModal({ visible, outfit, onClose, title }: OutfitModalProps) {
  if (!outfit) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOutfitDisplayName = () => {
    return outfit.name || formatDate(outfit.createdAt);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title || "OUTFIT"}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </Pressable>
        </View>
        
        <View style={styles.nameContainer}>
          <Text style={styles.outfitName}>{getOutfitDisplayName()}</Text>
          {outfit.name && (
            <Text style={styles.dateText}>{formatDate(outfit.createdAt)}</Text>
          )}
        </View>

        <View style={styles.outfitContainer}>
          <OutfitGrid
            outfit={outfit.items}
            enabledCategories={{}}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
  },
  nameContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  outfitName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.darkGray,
    textAlign: "center",
  },
  outfitContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
});