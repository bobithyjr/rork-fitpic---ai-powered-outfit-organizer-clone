import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// In-memory storage for demo (in production, use a real cloud storage service like AWS S3, Cloudinary, etc.)
const imageStorage = new Map<string, string>();

export const uploadImageProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    imageData: z.string(), // base64 encoded image
    fileName: z.string(),
  }))
  .mutation(async ({ input }: { input: { userId: string; imageData: string; fileName: string } }) => {
    const { userId, imageData, fileName } = input;
    
    // Generate a unique image ID
    const imageId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the image data (in production, upload to cloud storage)
    imageStorage.set(imageId, imageData);
    
    // Return the cloud URL
    const cloudUrl = `cloud://image/${imageId}`;
    
    return {
      success: true,
      cloudUrl,
      imageId,
    };
  });

export const getImageProcedure = publicProcedure
  .input(z.object({
    imageId: z.string(),
  }))
  .query(async ({ input }: { input: { imageId: string } }) => {
    const { imageId } = input;
    
    const imageData = imageStorage.get(imageId);
    
    if (!imageData) {
      throw new Error("Image not found");
    }
    
    return {
      imageData,
    };
  });

export const deleteImageProcedure = publicProcedure
  .input(z.object({
    imageId: z.string(),
  }))
  .mutation(async ({ input }: { input: { imageId: string } }) => {
    const { imageId } = input;
    
    imageStorage.delete(imageId);
    
    return {
      success: true,
    };
  });