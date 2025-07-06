import { trpcClient } from "@/lib/trpc";
import * as FileSystem from "expo-file-system";

export async function uploadImageToCloud(imageUri: string, userId: string): Promise<string> {
  try {
    // Read the image file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Generate a filename
    const fileName = `image_${Date.now()}.jpg`;
    
    // Upload to cloud storage
    const result = await trpcClient.closet.uploadImage.mutate({
      userId,
      imageData: base64,
      fileName,
    });
    
    return result.cloudUrl;
  } catch (error) {
    console.error("Failed to upload image to cloud:", error);
    throw error;
  }
}

export function isCloudImageUrl(uri: string): boolean {
  return uri.startsWith("cloud://image/");
}

export function getImageIdFromCloudUrl(cloudUrl: string): string {
  return cloudUrl.replace("cloud://image/", "");
}

export async function getCloudImageData(cloudUrl: string): Promise<string> {
  try {
    const imageId = getImageIdFromCloudUrl(cloudUrl);
    const result = await trpcClient.closet.getImage.query({ imageId });
    return `data:image/jpeg;base64,${result.imageData}`;
  } catch (error) {
    console.error("Failed to get cloud image:", error);
    throw error;
  }
}