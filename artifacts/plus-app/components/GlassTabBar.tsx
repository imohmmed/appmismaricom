import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const isIOS = Platform.OS === "ios";
const isWeb = Platform.OS === "web";

const TAB_ICONS: Record<string, string> = {
  index: "plus-square",
  tv: "tv",
  smm: "message-square",
  numbers: "bar-chart-2",
  search: "search",
};

function GlassBox({ children, style }: { children: React.ReactNode; style?: any }) {
  if (isIOS) {
    return (
      <BlurView intensity={60} tint="dark" style={[styles.glass, style]}>
        {children}
      </BlurView>
    );
  }
  return (
    <View style={[styles.glass, styles.glassFallback, style]}>
      {children}
    </View>
  );
}

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchInputRef = useRef<TextInput>(null);

  const expandAnim = useRef(new Animated.Value(0)).current;
  const tabsOpacity = useRef(new Animated.Value(1)).current;
  const tabsTranslateX = useRef(new Animated.Value(0)).current;

  const openSearch = useCallback(() => {
    setIsSearching(true);
    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue: 1,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }),
      Animated.timing(tabsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(tabsTranslateX, {
        toValue: -200,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }),
    ]).start(() => {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    });
  }, [expandAnim, tabsOpacity, tabsTranslateX]);

  const closeSearch = useCallback(() => {
    searchInputRef.current?.blur();
    setSearchText("");

    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue: 0,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }),
      Animated.timing(tabsOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(tabsTranslateX, {
        toValue: 0,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }),
    ]).start(() => {
      setIsSearching(false);
    });

    const prevIndex = state.index === state.routes.length - 1 ? 0 : state.index;
    const prevRoute = state.routes[prevIndex];
    navigation.navigate(prevRoute.name);
  }, [expandAnim, tabsOpacity, tabsTranslateX, state, navigation]);

  const searchFieldWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const bottomPadding = isWeb ? 10 : Math.max(insets.bottom, 10);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {isSearching ? (
        <Animated.View
          style={[
            styles.searchRow,
            { opacity: expandAnim },
          ]}
        >
          <GlassBox style={styles.searchFieldGlass}>
            <Feather name="search" size={18} color={Colors.light.textSecondary} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search apps & games..."
              placeholderTextColor={Colors.light.textSecondary}
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                navigation.navigate("search", { query: text });
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => {
                setSearchText("");
                navigation.navigate("search", { query: "" });
              }} hitSlop={8}>
                <Feather name="x-circle" size={16} color={Colors.light.textSecondary} />
              </Pressable>
            )}
          </GlassBox>

          <Pressable onPress={closeSearch}>
            <GlassBox style={styles.closeGlass}>
              <Feather name="x" size={20} color={Colors.light.text} />
            </GlassBox>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            styles.tabsRow,
            {
              opacity: tabsOpacity,
              transform: [{ translateX: tabsTranslateX }],
            },
          ]}
        >
          <GlassBox style={styles.tabsGlass}>
            {state.routes.map((route, index) => {
              if (route.name === "search") return null;

              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const label = options.title || route.name;
              const iconName = TAB_ICONS[route.name] || "circle";

              return (
                <Pressable
                  key={route.key}
                  onPress={() => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  }}
                  style={styles.tabItem}
                >
                  <Feather
                    name={iconName as any}
                    size={20}
                    color={isFocused ? Colors.light.tint : Colors.light.tabIconDefault}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isFocused ? Colors.light.tint : Colors.light.tabIconDefault },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </GlassBox>

          <Pressable onPress={openSearch}>
            <GlassBox style={styles.searchBtnGlass}>
              <Feather name="search" size={20} color={Colors.light.tabIconDefault} />
            </GlassBox>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  glass: {
    borderRadius: 24,
    overflow: "hidden",
  },
  glassFallback: {
    backgroundColor: "rgba(22, 18, 42, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },

  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tabsGlass: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },

  searchBtnGlass: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchFieldGlass: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    paddingVertical: 0,
    outlineStyle: "none" as any,
  },

  closeGlass: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
