import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettings, type ThemeMode } from "@/contexts/SettingsContext";
import type { Language } from "@/constants/translations";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ visible, onClose }: SettingsPanelProps) {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, themeMode, setThemeMode, colors, t, fontAr } = useSettings();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = React.useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(false);
  const isClosing = React.useRef(false);

  React.useEffect(() => {
    if (visible) {
      isClosing.current = false;
      setMounted(true);
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted && !isClosing.current) {
      isClosing.current = true;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        isClosing.current = false;
      });
    }
  }, [visible]);

  if (!mounted) return null;

  const langOptions: { key: Language; label: string }[] = [
    { key: "ar", label: t("arabic") },
    { key: "en", label: t("english") },
  ];

  const themeOptions: { key: ThemeMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "light", label: t("lightMode"), icon: "sun" },
    { key: "dark", label: t("darkMode"), icon: "moon" },
    { key: "system", label: t("systemMode"), icon: "smartphone" },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 10,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={[styles.handleBar, { backgroundColor: colors.separator }]} />

        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fontAr("Bold") }]}>
            {t("settingsTitle")}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.card }]}
            activeOpacity={0.6}
          >
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} bounces>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: fontAr("SemiBold") }]}>
            {t("language")}
          </Text>
          <View style={[styles.optionGroup, { backgroundColor: colors.card }]}>
            {langOptions.map((opt, idx) => {
              const isSelected = language === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optionRow,
                    idx < langOptions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
                  ]}
                  activeOpacity={0.6}
                  onPress={() => setLanguage(opt.key)}
                >
                  <Text style={[styles.optionLabel, { color: colors.text, fontFamily: fontAr("SemiBold") }]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Feather name="check" size={18} color={colors.tint} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: fontAr("SemiBold") }]}>
            {t("appearance")}
          </Text>
          <View style={[styles.optionGroup, { backgroundColor: colors.card }]}>
            {themeOptions.map((opt, idx) => {
              const isSelected = themeMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optionRow,
                    idx < themeOptions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
                  ]}
                  activeOpacity={0.6}
                  onPress={() => setThemeMode(opt.key)}
                >
                  <View style={styles.optionLeft}>
                    <Feather name={opt.icon as any} size={18} color={colors.tint} />
                    <Text style={[styles.optionLabel, { color: colors.text, fontFamily: fontAr("SemiBold") }]}>
                      {opt.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Feather name="check" size={18} color={colors.tint} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  optionGroup: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
  },
});
