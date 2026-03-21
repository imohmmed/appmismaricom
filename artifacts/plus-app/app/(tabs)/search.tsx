import { Feather } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BROWSE_CATEGORIES = [
  { key: "social", label: "Social Media", icon: "message-circle" as const, bgColor: "#007AFF" },
  { key: "ai", label: "Ai", icon: "cpu" as const, bgColor: "#AF52DE" },
  { key: "edit", label: "Edit", icon: "edit-3" as const, bgColor: "#FF9500" },
  { key: "games", label: "Games", icon: "play" as const, bgColor: "#34C759" },
  { key: "tweaked", label: "Tweaked Apps", icon: "settings" as const, bgColor: "#5AC8FA" },
  { key: "tv", label: "TV , LIVE", icon: "tv" as const, bgColor: "#FF3B30" },
  { key: "develop", label: "Develop", icon: "terminal" as const, bgColor: "#FF9500" },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const filteredCats = query.length > 0
    ? BROWSE_CATEGORIES.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : BROWSE_CATEGORIES;

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color={Colors.light.textSecondary} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor={Colors.light.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")}>
            <Feather name="x-circle" size={18} color={Colors.light.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: isWeb ? 34 : 80 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Categories</Text>

        <View style={styles.catGrid}>
          {filteredCats.map((cat) => (
            <Pressable key={cat.key} style={[styles.catCard, { backgroundColor: cat.bgColor }]}>
              <View style={styles.catCardIcon}>
                <Feather name={cat.icon} size={28} color="rgba(255,255,255,0.7)" />
              </View>
              <Text style={styles.catCardLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>

        {filteredCats.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="search" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 32, fontFamily: "Inter_700Bold", color: Colors.light.text },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  catCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-end",
  },
  catCardIcon: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  catCardLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
});
