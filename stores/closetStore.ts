import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ClothingItem, Outfit } from "@/types/clothing";
import { trpcClient } from "@/lib/trpc";
import { useUserStore } from "./userStore";

interface ClosetState {
  items: ClothingItem[];
  savedOutfits: Outfit[];
  outfitHistory: Outfit[];
  isLoading: boolean;
  lastSyncTime: number | null;
  addItem: (item: Omit<ClothingItem, "id" | "createdAt">) => void;
  removeItem: (id: string) => void;
  getItemsByCategory: (categoryId: string) => ClothingItem[];
  saveOutfit: (outfit: Omit<Outfit, "id" | "createdAt">) => void;
  addToHistory: (outfit: Omit<Outfit, "id" | "createdAt">) => void;
  removeSavedOutfit: (id: string) => void;
  renameOutfit: (id: string, name: string) => void;
  clearHistory: () => void;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  autoLoadFromCloud: () => Promise<void>;
  setData: (data: { items: ClothingItem[]; savedOutfits: Outfit[]; outfitHistory: Outfit[] }) => void;
}

export const useClosetStore = create<ClosetState>()(
  persist(
    (set, get) => ({
      items: [],
      savedOutfits: [],
      outfitHistory: [],
      isLoading: false,
      lastSyncTime: null,
      
      addItem: (item) => {
        const newItem: ClothingItem = {
          ...item,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
        // Sync after adding item
        setTimeout(() => get().syncToCloud(), 100);
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
        // Sync after removing item
        setTimeout(() => get().syncToCloud(), 100);
      },
      
      getItemsByCategory: (categoryId) => {
        return get().items.filter((item) => item.categoryId === categoryId);
      },
      
      saveOutfit: (outfit) => {
        const newOutfit: Outfit = {
          ...outfit,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };
        set((state) => ({
          savedOutfits: [...state.savedOutfits, newOutfit],
        }));
        // Sync after saving outfit
        setTimeout(() => get().syncToCloud(), 100);
      },
      
      addToHistory: (outfit) => {
        const newOutfit: Outfit = {
          ...outfit,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };
        set((state) => ({
          outfitHistory: [newOutfit, ...state.outfitHistory].slice(0, 50), // Keep last 50 outfits
        }));
        // Sync after adding to history
        setTimeout(() => get().syncToCloud(), 100);
      },
      
      removeSavedOutfit: (id) => {
        console.log('removeSavedOutfit called with ID:', id);
        set((state) => {
          console.log('Before filter - savedOutfits count:', state.savedOutfits.length);
          const filteredOutfits = state.savedOutfits.filter((outfit) => outfit.id !== id);
          console.log('After filter - savedOutfits count:', filteredOutfits.length);
          return {
            ...state,
            savedOutfits: filteredOutfits,
          };
        });
        // Sync after removing outfit
        setTimeout(() => get().syncToCloud(), 100);
      },
      
      renameOutfit: (id, name) => {
        set((state) => ({
          savedOutfits: state.savedOutfits.map((outfit) =>
            outfit.id === id ? { ...outfit, name: name.trim() || undefined } : outfit
          ),
        }));
        // Sync after renaming outfit
        setTimeout(() => get().syncToCloud(), 100);
      },
      
      clearHistory: () => {
        set({ outfitHistory: [] });
        // Sync after clearing history
        get().syncToCloud();
      },
      
      syncToCloud: async () => {
        const userStore = useUserStore.getState();
        if (!userStore.isCloudSyncEnabled || !userStore.userId) {
          return;
        }
        
        try {
          set({ isLoading: true });
          const state = get();
          
          await trpcClient.closet.sync.mutate({
            userId: userStore.userId,
            closetData: {
              items: state.items,
              savedOutfits: state.savedOutfits,
              outfitHistory: state.outfitHistory,
            },
          });
          
          const now = Date.now();
          set({ lastSyncTime: now });
          userStore.setLastSyncTime(now);
        } catch (error) {
          console.error('Failed to sync to cloud:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      loadFromCloud: async () => {
        const userStore = useUserStore.getState();
        if (!userStore.isCloudSyncEnabled || !userStore.userId) {
          return;
        }
        
        try {
          set({ isLoading: true });
          
          const cloudData = await trpcClient.closet.get.query({
            userId: userStore.userId,
          });
          
          if (cloudData.lastUpdated) {
            set({
              items: cloudData.items || [],
              savedOutfits: cloudData.savedOutfits || [],
              outfitHistory: cloudData.outfitHistory || [],
              lastSyncTime: cloudData.lastUpdated,
            });
            userStore.setLastSyncTime(cloudData.lastUpdated);
          }
        } catch (error) {
          console.error('Failed to load from cloud:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      autoLoadFromCloud: async () => {
        const userStore = useUserStore.getState();
        if (!userStore.isCloudSyncEnabled || !userStore.userId || userStore.hasAutoLoaded) {
          return;
        }
        
        try {
          const cloudData = await trpcClient.closet.get.query({
            userId: userStore.userId,
          });
          
          // Only auto-load if there's cloud data
          if (cloudData.lastUpdated) {
            const currentState = get();
            const localLastUpdate = currentState.lastSyncTime || 0;
            const hasLocalData = currentState.items.length > 0 || currentState.savedOutfits.length > 0;
            
            // Auto-load scenarios:
            // 1. No local data exists (fresh install or cleared data)
            // 2. Cloud data is significantly newer (more than 1 minute)
            // 3. User has Apple ID (more reliable identification)
            const shouldAutoLoad = !hasLocalData || 
                                   cloudData.lastUpdated > (localLastUpdate + 60000) ||
                                   (userStore.appleUserId && cloudData.lastUpdated > localLastUpdate);
            
            if (shouldAutoLoad) {
              console.log('Auto-loading data from cloud...', {
                hasLocalData,
                cloudLastUpdate: new Date(cloudData.lastUpdated),
                localLastUpdate: new Date(localLastUpdate),
                hasAppleId: !!userStore.appleUserId
              });
              
              set({
                items: cloudData.items || [],
                savedOutfits: cloudData.savedOutfits || [],
                outfitHistory: cloudData.outfitHistory || [],
                lastSyncTime: cloudData.lastUpdated,
              });
              userStore.setLastSyncTime(cloudData.lastUpdated);
            } else {
              console.log('Skipping auto-load - local data is current');
            }
          }
          
          userStore.setHasAutoLoaded(true);
        } catch (error) {
          console.error('Failed to auto-load from cloud:', error);
          userStore.setHasAutoLoaded(true); // Mark as attempted even if failed
        }
      },
      
      setData: (data) => {
        set({
          items: data.items,
          savedOutfits: data.savedOutfits,
          outfitHistory: data.outfitHistory,
        });
      },
    }),
    {
      name: "closet-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migrate old accessory categories to new single accessories category
          state.items = state.items.map((item: ClothingItem) => {
            if (item.categoryId === 'accessory1' || item.categoryId === 'accessory2') {
              return { ...item, categoryId: 'accessories' };
            }
            return item;
          });
          
          // Migrate outfit history
          state.outfitHistory = state.outfitHistory.map((outfit: Outfit) => ({
            ...outfit,
            items: Object.fromEntries(
              Object.entries(outfit.items).map(([key, item]: [string, ClothingItem | null]) => [
                key,
                item && (item.categoryId === 'accessory1' || item.categoryId === 'accessory2')
                  ? { ...item, categoryId: 'accessories' }
                  : item
              ])
            )
          }));
          
          // Migrate saved outfits
          state.savedOutfits = state.savedOutfits.map((outfit: Outfit) => ({
            ...outfit,
            items: Object.fromEntries(
              Object.entries(outfit.items).map(([key, item]: [string, ClothingItem | null]) => [
                key,
                item && (item.categoryId === 'accessory1' || item.categoryId === 'accessory2')
                  ? { ...item, categoryId: 'accessories' }
                  : item
              ])
            )
          }));
        }
      },
    }
  )
);