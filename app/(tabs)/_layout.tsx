import React from "react";
import { Tabs } from "expo-router";
import { Home, ShoppingBag, Settings } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.darkGray,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.lightGray,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          textTransform: "uppercase",
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="closet"
        options={{
          title: "YOUR CLOSET",
          tabBarLabel: "YOUR CLOSET",
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "FITPIC",
          tabBarLabel: "FITPIC",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "SETTINGS",
          tabBarLabel: "SETTINGS",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}