import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { X } from "lucide-react-native";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { ClothingItem as ClothingItemType } from "@/types/clothing";
import { CLOTHING_CATEGORIES } from "@/constants/categories";

type Props = {
  item: ClothingItemType;
  onPress?: () => void;
  onRemove?: () => void;
  size?: "small" | "medium" | "large";
  showRemoveButton?: boolean;
};

export default function ClothingItem({
  item,
  onPress,
  onRemove,
  size = "medium",
  showRemoveButton = false,
}: Props) {
  const sizeStyles = {
    small: { width: 80, height: 80 },
    medium: { width: 100, height: 100 },
    large: { width: 150, height: 150 },
  };

  return (
    <Pressable
      style={[styles.container, sizeStyles[size]]}
      onPress={onPress}
    >
      <Image
        source={{ uri: item.imageUri }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.nameContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {CLOTHING_CATEGORIES.find(c => c.id === item.categoryId)?.name || item.categoryId}
        </Text>
      </View>
      
      {showRemoveButton && onRemove && (
        <Pressable
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X size={16} color={Colors.error} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.5,
    borderColor: Colors.text,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    flex: 1,
    width: "100%",
    backgroundColor: Colors.mediumGray,
  },
  nameContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 6,
  },
  name: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  category: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
  },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "white",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});