import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import Colors from "@/constants/colors";

const TAB_ITEMS = [
  { name: "index", label: "PLUS+", icon: "plus-square" },
  { name: "tv", label: "TV", icon: "tv" },
  { name: "smm", label: "SMM", icon: "message-square" },
  { name: "numbers", label: "Numbers", icon: "bar-chart-2" },
];

export default function MismariTabBar({ state, navigation }: BottomTabBarProps) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchInputRef = useRef<TextInput>(null);

  const tabsWidth = useRef(new Animated.Value(1)).current;
  const searchWidth = useRef(new Animated.Value(0)).current;

  const activeRoute = state.routes[state.index]?.name;

  useEffect(() => {
    if (isSearchMode) {
      Animated.parallel([
        Animated.spring(tabsWidth, { toValue: 0, useNativeDriver: false, tension: 50, friction: 10 }),
        Animated.spring(searchWidth, { toValue: 1, useNativeDriver: false, tension: 50, friction: 10 }),
      ]).start(() => {
        searchInputRef.current?.focus();
      });
    } else {
      searchInputRef.current?.blur();
      Animated.parallel([
        Animated.spring(tabsWidth, { toValue: 1, useNativeDriver: false, tension: 50, friction: 10 }),
        Animated.spring(searchWidth, { toValue: 0, useNativeDriver: false, tension: 50, friction: 10 }),
      ]).start();
    }
  }, [isSearchMode]);

  const enterSearchMode = () => {
    setIsSearchMode(true);
    const searchIdx = state.routes.findIndex((r) => r.name === "search");
    if (searchIdx >= 0) navigation.navigate("search");
  };

  const exitSearchMode = () => {
    setIsSearchMode(false);
    setSearchText("");
    const homeIdx = state.routes.findIndex((r) => r.name === "index");
    if (homeIdx >= 0) navigation.navigate("index");
  };

  const navigateToTab = (routeName: string) => {
    if (isSearchMode) return;
    navigation.navigate(routeName);
  };

  const tabsFlex = tabsWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const searchFlex = searchWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const tabsOpacity = tabsWidth.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const searchInputOpacity = searchWidth.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  const barContent = (
    <View style={s.barInner}>
      {isSearchMode ? (
        <Pressable onPress={exitSearchMode} style={s.homeBtn}>
          <Feather name="home" size={20} color={Colors.light.tint} />
        </Pressable>
      ) : (
        <Animated.View style={[s.tabsContainer, { flex: tabsFlex, opacity: tabsOpacity }]}>
          {TAB_ITEMS.map((tab) => {
            const isActive = activeRoute === tab.name;
            return (
              <Pressable
                key={tab.name}
                onPress={() => navigateToTab(tab.name)}
                style={s.tabItem}
              >
                <Feather
                  name={tab.icon as any}
                  size={20}
                  color={isActive ? Colors.light.tint : Colors.light.tabIconDefault}
                />
                <Text
                  style={[
                    s.tabLabel,
                    { color: isActive ? Colors.light.tint : Colors.light.tabIconDefault },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
      )}

      {isSearchMode ? (
        <Animated.View style={[s.searchExpanded, { flex: searchFlex, opacity: searchInputOpacity }]}>
          <Feather name="search" size={18} color={Colors.light.textSecondary} />
          <TextInput
            ref={searchInputRef}
            style={s.searchInput}
            placeholder="Search Mismari..."
            placeholderTextColor={Colors.light.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")}>
              <Feather name="x-circle" size={16} color={Colors.light.textSecondary} />
            </Pressable>
          )}
        </Animated.View>
      ) : (
        <Pressable onPress={enterSearchMode} style={s.searchBtn}>
          <Feather name="search" size={20} color={Colors.light.tint} />
        </Pressable>
      )}
    </View>
  );

  if (isWeb) {
    return (
      <View style={s.barWrapper}>
        <View style={[s.glassBar, s.webGlass]}>{barContent}</View>
      </View>
    );
  }

  if (isIOS) {
    return (
      <View style={s.barWrapper}>
        <BlurView intensity={80} tint="light" style={s.glassBar}>
          {barContent}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={s.barWrapper}>
      <View style={[s.glassBar, { backgroundColor: Colors.light.background }]}>{barContent}</View>
    </View>
  );
}

const s = StyleSheet.create({
  barWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "web" ? 12 : 28,
  },
  glassBar: {
    borderRadius: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      web: {
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      },
    }),
  },
  webGlass: {
    backgroundColor: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)",
  },
  barInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 6,
    minHeight: 56,
  },

  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(120,120,128,0.08)",
    borderRadius: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
    overflow: "hidden",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  homeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(120,120,128,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(120,120,128,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchExpanded: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(120,120,128,0.08)",
    borderRadius: 22,
    paddingHorizontal: 14,
    gap: 8,
    height: 44,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    height: 44,
  },
});
