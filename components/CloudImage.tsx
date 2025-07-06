import React, { useState, useEffect } from "react";
import { Image } from "expo-image";
import { View, Text, StyleSheet } from "react-native";
import { isCloudImageUrl, getCloudImageData } from "@/utils/imageUpload";
import Colors from "@/constants/colors";

interface CloudImageProps {
  source: { uri: string };
  style: any;
  contentFit?: "cover" | "contain" | "fill" | "scale-down" | "none";
  transition?: number;
}

export default function CloudImage({ source, style, contentFit = "cover", transition }: CloudImageProps) {
  const [imageUri, setImageUri] = useState<string>(source.uri);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadCloudImage = async () => {
      if (isCloudImageUrl(source.uri)) {
        setIsLoading(true);
        setHasError(false);
        try {
          const dataUri = await getCloudImageData(source.uri);
          setImageUri(dataUri);
          setHasError(false);
        } catch (error) {
          console.warn("Failed to load cloud image:", error);
          setHasError(true);
          // Don't set the original URI as fallback for cloud images
          // Instead, we'll show an error state
        } finally {
          setIsLoading(false);
        }
      } else {
        setImageUri(source.uri);
        setHasError(false);
      }
    };

    loadCloudImage();
  }, [source.uri]);

  if (hasError && isCloudImageUrl(source.uri)) {
    return (
      <View style={[style, styles.errorContainer]}>
        <Text style={styles.errorText}>Image not available</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[style, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      onError={() => {
        if (!isCloudImageUrl(source.uri)) {
          setHasError(true);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: Colors.darkGray,
    fontSize: 12,
    textAlign: "center",
  },
  loadingContainer: {
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.darkGray,
    fontSize: 12,
    textAlign: "center",
  },
});