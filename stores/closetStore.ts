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
  pinnedItems: Record<string, string>; // categoryId -> itemId mapping
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
  pinItem: (categoryId: string, itemId: string) => void;
  unpinItem: (categoryId: string) => void;
  getPinnedItem: (categoryId: string) => ClothingItem | null;
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
      pinnedItems: {},
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
      
      pinItem: (categoryId, itemId) => {
        set((state) => ({
          pinnedItems: {
            ...state.pinnedItems,
            [categoryId]: itemId,
          },
        }));
        // Sync after pinning item
        setTimeout(() => get().syncToCloud(), 100);
      },
      
      unpinItem: (categoryId) => {
        set((state) => {
          const newPinnedItems = { ...state.pinnedItems };
          delete newPinnedItems[categoryId];
          return { pinnedItems: newPinnedItems };
        });
        // Sync after unpinning item
        setTimeout(() => get().syncToCloud(), 100);
      },
      
      getPinnedItem: (categoryId) => {
        const state = get();
        const pinnedItemId = state.pinnedItems[categoryId];
        if (!pinnedItemId) return null;
        return state.items.find(item => item.id === pinnedItemId) || null;
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
              pinnedItems: state.pinnedItems,
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
              pinnedItems: cloudData.pinnedItems || {},
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
          console.log('Attempting auto-load from cloud for user:', userStore.userId);
          
          const cloudData = await trpcClient.closet.get.query({
            userId: userStore.userId,
          });
          
          // Only auto-load if there's cloud data
          if (cloudData.lastUpdated) {
            const currentState = get();
            const localLastUpdate = currentState.lastSyncTime || 0;
            const hasLocalData = currentState.items.length > 0 || currentState.savedOutfits.length > 0;
            
            // For Apple ID users, always prioritize cloud data if it exists and is newer
            // For device ID users, be more conservative
            const isAppleIdUser = !!userStore.appleUserId;
            
            let shouldAutoLoad = false;
            
            if (isAppleIdUser) {
              // Apple ID users: auto-load if cloud data is newer or if no local data
              shouldAutoLoad = !hasLocalData || cloudData.lastUpdated > localLastUpdate;
              console.log('Apple ID user - shouldAutoLoad:', shouldAutoLoad, {
                hasLocalData,
                cloudNewer: cloudData.lastUpdated > localLastUpdate,
                cloudLastUpdate: new Date(cloudData.lastUpdated),
                localLastUpdate: new Date(localLastUpdate)
              });
            } else {
              // Device ID users: more conservative approach
              shouldAutoLoad = !hasLocalData || cloudData.lastUpdated > (localLastUpdate + 60000);
              console.log('Device ID user - shouldAutoLoad:', shouldAutoLoad, {
                hasLocalData,
                cloudSignificantlyNewer: cloudData.lastUpdated > (localLastUpdate + 60000)
              });
            }
            
            if (shouldAutoLoad) {
              console.log('Auto-loading data from cloud...', {
                itemsCount: cloudData.items?.length || 0,
                outfitsCount: cloudData.savedOutfits?.length || 0,
                historyCount: cloudData.outfitHistory?.length || 0
              });
              
              set({
                items: cloudData.items || [],
                savedOutfits: cloudData.savedOutfits || [],
                outfitHistory: cloudData.outfitHistory || [],
                pinnedItems: cloudData.pinnedItems || {},
                lastSyncTime: cloudData.lastUpdated,
              });
              userStore.setLastSyncTime(cloudData.lastUpdated);
            } else {
              console.log('Skipping auto-load - local data is current or preferred');
            }
          } else {
            console.log('No cloud data found for user');
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