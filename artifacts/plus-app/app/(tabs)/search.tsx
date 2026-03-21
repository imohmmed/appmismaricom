import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const ALL_APPS = [
  { id: 1, name: "WhatsApp++", category: "Social Media", tag: "tweaked", icon: "message-circle" },
  { id: 2, name: "Instagram++", category: "Social Media", tag: "tweaked", icon: "instagram" },
  { id: 3, name: "Snapchat++", category: "Social Media", tag: "tweaked", icon: "camera" },
  { id: 4, name: "TikTok++", category: "Social Media", tag: "tweaked", icon: "video" },
  { id: 5, name: "YouTube Premium", category: "Music", tag: "tweaked", icon: "youtube" },
  { id: 6, name: "Spotify++", category: "Music", tag: "tweaked", icon: "music" },
  { id: 7, name: "Netflix", category: "Movies", tag: "modded", icon: "film" },
  { id: 8, name: "PUBG Mobile Hack", category: "Games", tag: "hacked", icon: "crosshair" },
  { id: 9, name: "Minecraft Hack", category: "Games", tag: "hacked", icon: "box" },
  { id: 10, name: "GTA+", category: "Games", tag: "modded", icon: "monitor" },
  { id: 11, name: "Telegram++", category: "Social Media", tag: "tweaked", icon: "send" },
  { id: 12, name: "CapCut Pro", category: "Design", tag: "tweaked", icon: "scissors" },
];

function getTagColor(tag: string) {
  switch (tag) {
    case "tweaked": return Colors.light.tagTweaked;
    case "modded": return Colors.light.tagModded;
    case "hacked": return Colors.light.tagHacked;
    default: return Colors.light.tint;
  }
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const params = useLocalSearchParams<{ query?: string }>();
  const query = params.query || "";

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_APPS;
    const q = query.toLowerCase();
    return ALL_APPS.filter(
      (app) => app.name.toLowerCase().includes(q) || app.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {query.trim() ? "Results" : "Search"}
        </Text>
        {query.trim() ? (
          <Text style={styles.headerSubtitle}>
            {filtered.length} {filtered.length === 1 ? "app" : "apps"} found
          </Text>
        ) : (
          <Text style={styles.headerSubtitle}>
            Type in the search bar below
          </Text>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: isWeb ? 34 : 100 }}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="search" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>No apps found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const tagColor = getTagColor(item.tag);
          return (
            <Pressable style={styles.appRow}>
              <View style={[styles.appIcon, { backgroundColor: `${tagColor}20` }]}>
                <Feather name={item.icon as any} size={22} color={tagColor} />
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{item.name}</Text>
                <View style={styles.meta}>
                  <Text style={styles.appCategory}>{item.category}</Text>
                  <View style={[styles.tagBadge, { backgroundColor: `${tagColor}20` }]}>
                    <Text style={[styles.tagText, { color: tagColor }]}>{item.tag}</Text>
                  </View>
                </View>
              </View>
              <Pressable style={styles.getButton}>
                <Text style={styles.getButtonText}>GET</Text>
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 32, fontFamily: "Inter_700Bold", color: Colors.light.text },
  headerSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 4 },
  appRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 14 },
  appIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  appInfo: { flex: 1, gap: 4 },
  appName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  appCategory: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  getButton: { backgroundColor: Colors.light.tint, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  getButtonText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFF" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
});
