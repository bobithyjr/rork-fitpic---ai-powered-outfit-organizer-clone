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
    const userStore = useUserStore.getState();
    const closetStore = useClosetStore.getState();
    
    // Initialize user ID
    await userStore.initializeUser();
    
    // Load data from cloud if sync is enabled
    if (userStore.isCloudSyncEnabled) {
      await closetStore.loadFromCloud();
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