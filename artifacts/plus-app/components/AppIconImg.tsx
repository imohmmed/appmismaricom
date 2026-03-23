import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { useSettings } from "@/contexts/SettingsContext";

interface AppIconImgProps {
  icon: string | null | undefined;
  size: number;
  borderRadius?: number;
}

export default function AppIconImg({ icon, size, borderRadius = 14 }: AppIconImgProps) {
  const { colors } = useSettings();
  const [errored, setErrored] = useState(false);

  if (!icon) {
    return (
      <View style={{ width: size, height: size, borderRadius, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
        <Feather name="box" size={Math.round(size * 0.45)} color={colors.tint} />
      </View>
    );
  }

  const isImageUri = !errored && (
    icon.startsWith("data:image") ||
    icon.startsWith("http") ||
    icon.startsWith("/")
  );

  if (isImageUri) {
    return (
      <Image
        source={{ uri: icon }}
        style={{ width: size, height: size, borderRadius }}
        resizeMode="cover"
        onError={() => setErrored(true)}
      />
    );
  }

  const isEmoji = icon.length <= 4 && /\p{Emoji}/u.test(icon);
  if (isEmoji) {
    return (
      <View style={{ width: size, height: size, borderRadius, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: Math.round(size * 0.5), lineHeight: Math.round(size * 0.65) }}>{icon}</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
      <Feather name={icon as any} size={Math.round(size * 0.45)} color={colors.tint} />
    </View>
  );
}
