import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import Colors from "@/constants/colors";

type Props = {
  categoryName: string;
  onPress?: () => void;
  size?: "small" | "medium" | "large";
};

export default function EmptyClothingItem({
  categoryName,
  onPress,
  size = "medium",
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
      <View style={styles.content}>
        <Text style={styles.text}>{categoryName.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: Colors.background,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.text,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  text: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});