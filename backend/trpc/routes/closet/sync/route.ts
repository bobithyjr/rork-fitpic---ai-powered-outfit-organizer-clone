import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Define the schema for clothing items and outfits
const ClothingItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUri: z.string(),
  categoryId: z.string(),
  createdAt: z.number(),
});

const OutfitSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  items: z.record(ClothingItemSchema.nullable()),
  createdAt: z.number(),
});

const ClosetDataSchema = z.object({
  items: z.array(ClothingItemSchema),
  savedOutfits: z.array(OutfitSchema),
  outfitHistory: z.array(OutfitSchema),
  pinnedItems: z.record(z.string()).optional(),
});

// In-memory storage for demo (in production, use a real database)
const userClosets = new Map<string, any>();

export const syncClosetProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    closetData: ClosetDataSchema,
  }))
  .mutation(async ({ input }) => {
    const { userId, closetData } = input;
    
    // Store the closet data for this user
    userClosets.set(userId, {
      ...closetData,
      lastUpdated: Date.now(),
    });
    
    return {
      success: true,
      message: "Closet data synced successfully",
      lastUpdated: Date.now(),
    };
  });

export const getClosetProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    const { userId } = input;
    
    const closetData = userClosets.get(userId);
    
    if (!closetData) {
      return {
        items: [],
        savedOutfits: [],
        outfitHistory: [],
        pinnedItems: {},
        lastUpdated: null,
      };
    }
    
    return closetData;
  });

export const deleteUserDataProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { userId } = input;
    
    userClosets.delete(userId);
    
    return {
      success: true,
      message: "User data deleted successfully",
    };
  });