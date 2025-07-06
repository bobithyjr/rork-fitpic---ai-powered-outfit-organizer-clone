import React, { useState, useEffect } from "react";
import { Image } from "expo-image";
import { isCloudImageUrl, getCloudImageData } from "@/utils/imageUpload";

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
          console.warn("Failed to load cloud image, using fallback:", error);
          setHasError(true);
          // Keep the original URI as fallback - this might be a local file URI
          setImageUri(source.uri);
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

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      contentFit={contentFit}
      transition={transition}
    />
  );
}