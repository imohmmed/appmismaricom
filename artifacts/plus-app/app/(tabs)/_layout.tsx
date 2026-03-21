import { Tabs } from "expo-router";
import React from "react";

import GlassTabBar from "@/components/GlassTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "PLUS+" }} />
      <Tabs.Screen name="tv" options={{ title: "TV" }} />
      <Tabs.Screen name="smm" options={{ title: "SMM" }} />
      <Tabs.Screen name="numbers" options={{ title: "Numbers" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
    </Tabs>
  );
}
