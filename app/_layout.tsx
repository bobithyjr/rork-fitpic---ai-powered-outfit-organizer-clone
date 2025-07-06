import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import Colors from "@/constants/colors";
import { useUserStore } from "@/stores/userStore";
import { useClosetStore } from "@/stores/closetStore";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // We're not loading custom fonts as per instructions
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Initialize user and load cloud data
      initializeApp();
    }
  }, [fontsLoaded]);
  
  const initializeApp = async () => {
    try {
      const userStore = useUserStore.getState();
      const closetStore = useClosetStore.getState();
      
      // Initialize user ID and restore Apple ID session if available
      await userStore.initializeUser();
      
      // Get updated state after initialization
      const updatedUserStore = useUserStore.getState();
      
      console.log('App initialized with user:', {
        userId: updatedUserStore.userId?.slice(-8),
        isAppleId: !!updatedUserStore.appleUserId,
        syncEnabled: updatedUserStore.isCloudSyncEnabled,
        isAuthenticated: updatedUserStore.isAuthenticated
      });
      
      // Auto-load data from cloud if sync is enabled and user is authenticated
      if (updatedUserStore.isCloudSyncEnabled && updatedUserStore.userId && updatedUserStore.isAuthenticated) {
        console.log('Triggering auto-load from cloud...');
        await closetStore.autoLoadFromCloud();
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerTitleStyle: {
              fontWeight: "600",
            },
            contentStyle: {
              backgroundColor: Colors.background,
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="closet/add"
            options={{
              title: "Add Item",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="closet/category/[id]"
            options={{
              title: "Category Items",
            }}
          />
          <Stack.Screen
            name="outfit-history"
            options={{
              title: "Outfit History",
            }}
          />
          <Stack.Screen
            name="favorite-outfits"
            options={{
              title: "Favorite Outfits",
            }}
          />
        </Stack>
      </QueryClientProvider>
    </trpc.Provider>
  );
}