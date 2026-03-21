import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import React, { useState, useRef, useCallback } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAGE_WIDTH = SCREEN_WIDTH - 40;

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "social", label: "Social Media" },
  { key: "ai", label: "Ai" },
  { key: "edit", label: "Edit" },
  { key: "games", label: "Games" },
  { key: "tweaked", label: "Tweaked Apps" },
  { key: "tv", label: "TV , LIVE" },
  { key: "develop", label: "Develop" },
] as const;

const FEATURED_APPS = [
  { id: 1, title: "Black Friday Sale", subtitle: "50% off all premium subscriptions", color: "#B044FF" },
  { id: 2, title: "New Apps Added", subtitle: "100+ new tweaked apps this week", color: "#4488FF" },
  { id: 3, title: "Premium Bundle", subtitle: "Get all apps with one subscription", color: "#FF8844" },
];

type AppItem = {
  id: number;
  name: string;
  category: string;
  tag: "tweaked" | "modded" | "hacked";
  icon: string;
  isHot?: boolean;
  isNew?: boolean;
  isMostDownloaded?: boolean;
  catKey?: string;
};

const ALL_APPS: AppItem[] = [
  { id: 1, name: "WhatsApp++", category: "Social Media", tag: "tweaked", icon: "message-circle", isHot: true, isMostDownloaded: true, catKey: "social" },
  { id: 2, name: "Snapchat++", category: "Social Media", tag: "tweaked", icon: "camera", isHot: true, isMostDownloaded: true, catKey: "social" },
  { id: 3, name: "Instagram++", category: "Social Media", tag: "tweaked", icon: "instagram", isHot: true, isMostDownloaded: true, catKey: "social" },
  { id: 4, name: "TikTok++", category: "Social Media", tag: "tweaked", icon: "video", isHot: true, catKey: "social" },
  { id: 5, name: "Telegram++", category: "Social Media", tag: "tweaked", icon: "send", catKey: "social" },
  { id: 6, name: "Twitter++", category: "Social Media", tag: "tweaked", icon: "twitter", catKey: "social" },
  { id: 7, name: "ChatGPT Pro", category: "Ai", tag: "modded", icon: "cpu", isHot: true, isMostDownloaded: true, catKey: "ai" },
  { id: 8, name: "Copilot+", category: "Ai", tag: "modded", icon: "zap", isNew: true, catKey: "ai" },
  { id: 9, name: "Gemini Pro", category: "Ai", tag: "modded", icon: "star", isNew: true, catKey: "ai" },
  { id: 10, name: "CapCut Pro", category: "Edit", tag: "modded", icon: "scissors", isHot: true, isNew: true, catKey: "edit" },
  { id: 11, name: "Canva Pro", category: "Edit", tag: "modded", icon: "edit", isNew: true, catKey: "edit" },
  { id: 12, name: "Lightroom++", category: "Edit", tag: "tweaked", icon: "aperture", catKey: "edit" },
  { id: 13, name: "PUBG Hack", category: "Games", tag: "hacked", icon: "crosshair", isHot: true, isMostDownloaded: true, catKey: "games" },
  { id: 14, name: "Minecraft+", category: "Games", tag: "hacked", icon: "box", catKey: "games" },
  { id: 15, name: "Roblox Mod", category: "Games", tag: "modded", icon: "play", isNew: true, catKey: "games" },
  { id: 16, name: "YouTube Premium", category: "Tweaked Apps", tag: "tweaked", icon: "youtube", isHot: true, isMostDownloaded: true, catKey: "tweaked" },
  { id: 17, name: "Spotify++", category: "Tweaked Apps", tag: "tweaked", icon: "music", isHot: true, isMostDownloaded: true, catKey: "tweaked" },
  { id: 18, name: "SoundCloud++", category: "Tweaked Apps", tag: "tweaked", icon: "headphones", catKey: "tweaked" },
  { id: 19, name: "Netflix", category: "TV , LIVE", tag: "modded", icon: "film", isHot: true, isMostDownloaded: true, catKey: "tv" },
  { id: 20, name: "Disney+", category: "TV , LIVE", tag: "modded", icon: "play-circle", catKey: "tv" },
  { id: 21, name: "Shahid VIP", category: "TV , LIVE", tag: "tweaked", icon: "tv", isNew: true, catKey: "tv" },
  { id: 22, name: "Xcode Helper", category: "Develop", tag: "modded", icon: "terminal", catKey: "develop" },
  { id: 23, name: "iSH Shell", category: "Develop", tag: "tweaked", icon: "code", isNew: true, catKey: "develop" },
  { id: 24, name: "Pythonista+", category: "Develop", tag: "modded", icon: "file-text", catKey: "develop" },
];

const BROWSE_CATEGORIES = [
  { key: "social", label: "Social Media", icon: "message-circle", bgColor: "#4A90D9" },
  { key: "ai", label: "Ai", icon: "cpu", bgColor: "#9B59B6" },
  { key: "edit", label: "Edit", icon: "edit-3", bgColor: "#E67E22" },
  { key: "games", label: "Games", icon: "play", bgColor: "#2ECC71" },
  { key: "tweaked", label: "Tweaked Apps", icon: "settings", bgColor: "#1ABC9C" },
  { key: "tv", label: "TV , LIVE", icon: "tv", bgColor: "#E74C3C" },
  { key: "develop", label: "Develop", icon: "terminal", bgColor: "#F39C12" },
];

function getTagColor(tag: string) {
  switch (tag) {
    case "tweaked": return Colors.light.tagTweaked;
    case "modded": return Colors.light.tagModded;
    case "hacked": return Colors.light.tagHacked;
    default: return Colors.light.tint;
  }
}

function GlassSegmentedControl({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const inner = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.segmentInner}
    >
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat.key;
        return (
          <Pressable
            key={cat.key}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onSelect(cat.key);
            }}
            style={[
              styles.segmentItem,
              isActive && styles.segmentItemActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                isActive && styles.segmentTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  if (isIOS) {
    return (
      <View style={styles.segmentOuter}>
        <BlurView intensity={40} tint="dark" style={styles.segmentBlur}>
          {inner}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={styles.segmentOuter}>
      <View style={[styles.segmentBlur, styles.segmentBlurFallback]}>
        {inner}
      </View>
    </View>
  );
}

function FeaturedCard({ item }: { item: typeof FEATURED_APPS[number] }) {
  return (
    <View style={[styles.featuredCard, { width: SCREEN_WIDTH - 48 }]}>
      <View style={[styles.featuredGradient, { backgroundColor: item.color }]}>
        <View style={styles.featuredContent}>
          <Text style={styles.featuredLabel}>FEATURED</Text>
          <Text style={styles.featuredTitle}>{item.title}</Text>
          <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

function AppListRow({ app, showDivider }: { app: AppItem; showDivider: boolean }) {
  const tagColor = getTagColor(app.tag);
  return (
    <View>
      <View style={styles.listRow}>
        <View style={[styles.listRowIcon, { backgroundColor: `${tagColor}20` }]}>
          <Feather name={app.icon as any} size={24} color={tagColor} />
        </View>
        <View style={styles.listRowInfo}>
          <Text style={styles.listRowName} numberOfLines={1}>{app.name}</Text>
          <Text style={styles.listRowCategory} numberOfLines={1}>{app.category}</Text>
        </View>
        <Pressable style={styles.listRowGetButton}>
          <Text style={styles.listRowGetText}>GET</Text>
        </Pressable>
      </View>
      {showDivider && <View style={styles.listRowDivider} />}
    </View>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function AppRow({ app }: { app: AppItem }) {
  const tagColor = getTagColor(app.tag);
  return (
    <Pressable style={styles.appRow}>
      <View style={[styles.appIcon, { backgroundColor: `${tagColor}20` }]}>
        <Feather name={app.icon as any} size={22} color={tagColor} />
      </View>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{app.name}</Text>
        <View style={styles.appMeta}>
          <Text style={styles.appCategory}>{app.category}</Text>
          <View style={[styles.tagBadge, { backgroundColor: `${tagColor}20` }]}>
            <Text style={[styles.tagText, { color: tagColor }]}>{app.tag}</Text>
          </View>
        </View>
      </View>
      <Pressable style={styles.getButton}>
        <Text style={styles.getButtonText}>GET</Text>
      </Pressable>
    </Pressable>
  );
}

function StackedSection({ title, subtitle, data }: { title: string; subtitle: string; data: AppItem[] }) {
  const pages = chunkArray(data, 3);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={Colors.light.textSecondary} />
      </View>
      <FlatList
        data={pages}
        horizontal
        pagingEnabled={false}
        snapToInterval={PAGE_WIDTH + 16}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item: page }) => (
          <View style={{ width: PAGE_WIDTH }}>
            {page.map((app, idx) => (
              <AppListRow key={app.id} app={app} showDivider={idx < page.length - 1} />
            ))}
          </View>
        )}
      />
    </View>
  );
}

function CategoryCard({ cat, onPress }: { cat: typeof BROWSE_CATEGORIES[number]; onPress: () => void }) {
  return (
    <Pressable style={[styles.catCard, { backgroundColor: cat.bgColor }]} onPress={onPress}>
      <Feather name={cat.icon as any} size={32} color="rgba(255,255,255,0.9)" style={styles.catCardIcon} />
      <Text style={styles.catCardLabel}>{cat.label}</Text>
    </Pressable>
  );
}

export default function PlusScreen() {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState("all");
  const scrollX = useRef(new Animated.Value(0)).current;
  const isWeb = Platform.OS === "web";

  const hotApps = ALL_APPS.filter((a) => a.isHot);
  const mostDownloaded = ALL_APPS.filter((a) => a.isMostDownloaded);
  const newAdds = ALL_APPS.filter((a) => a.isNew);
  const filteredApps = activeCat === "all" ? ALL_APPS : ALL_APPS.filter((a) => a.catKey === activeCat);

  const handleCategoryPress = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCat(key);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PLUS+</Text>
        <Pressable style={styles.profileButton}>
          <Feather name="user" size={20} color={Colors.light.text} />
        </Pressable>
      </View>

      <GlassSegmentedControl selected={activeCat} onSelect={handleCategoryPress} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : 100 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {activeCat === "all" ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>FEATURED</Text>
                <Feather name="chevron-right" size={18} color={Colors.light.textSecondary} />
              </View>
              <FlatList
                data={FEATURED_APPS}
                horizontal
                pagingEnabled={false}
                snapToInterval={SCREEN_WIDTH - 24}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <FeaturedCard item={item} />}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false }
                )}
              />
              <View style={styles.paginationDots}>
                {FEATURED_APPS.map((_, i) => {
                  const inputRange = [(i - 1) * (SCREEN_WIDTH - 24), i * (SCREEN_WIDTH - 24), (i + 1) * (SCREEN_WIDTH - 24)];
                  const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 20, 8], extrapolate: "clamp" });
                  const dotOpacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: "clamp" });
                  return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]} />;
                })}
              </View>
            </View>

            <StackedSection
              title="What's Hot 🔥"
              subtitle="Trending right now"
              data={hotApps}
            />

            <StackedSection
              title="Most Downloaded"
              subtitle="Top picks by the community"
              data={mostDownloaded}
            />

            <StackedSection
              title="Recently Added"
              subtitle="Fresh apps just dropped"
              data={newAdds}
            />

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categories</Text>
              </View>
              <View style={styles.catGrid}>
                {BROWSE_CATEGORIES.map((cat) => (
                  <CategoryCard key={cat.key} cat={cat} onPress={() => handleCategoryPress(cat.key)} />
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {CATEGORIES.find((c) => c.key === activeCat)?.label}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredApps.length} {filteredApps.length === 1 ? "app" : "apps"}
                </Text>
              </View>
            </View>
            <View style={styles.appList}>
              {filteredApps.map((app) => (
                <AppRow key={app.id} app={app} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
  },

  segmentOuter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentBlur: {
    borderRadius: 28,
    overflow: "hidden",
  },
  segmentBlurFallback: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  segmentInner: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
  },
  segmentItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  segmentItemActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  segmentText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.55)",
  },
  segmentTextActive: {
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },

  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  featuredCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  featuredGradient: {
    borderRadius: 16,
    padding: 24,
    minHeight: 180,
    justifyContent: "flex-end",
  },
  featuredContent: {
    gap: 4,
  },
  featuredLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
  },
  featuredTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  featuredSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.tint,
  },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  listRowIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  listRowInfo: {
    flex: 1,
    gap: 3,
  },
  listRowName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  listRowCategory: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  listRowGetButton: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 18,
  },
  listRowGetText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.light.tint,
  },
  listRowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.cardBorder,
    marginLeft: 68,
  },

  appList: {
    paddingHorizontal: 20,
    gap: 2,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  appInfo: {
    flex: 1,
    gap: 4,
  },
  appName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  appMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appCategory: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  getButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  getButtonText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },

  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  catCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    height: 110,
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-end",
  },
  catCardIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    opacity: 0.8,
  },
  catCardLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
});
