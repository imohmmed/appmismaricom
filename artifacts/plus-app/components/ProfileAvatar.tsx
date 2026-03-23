import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

import { useSettings } from "@/contexts/SettingsContext";

interface ProfileAvatarProps {
  size?: number;
  iconSize?: number;
  borderWidth?: number;
}

export default function ProfileAvatar({ size = 28, iconSize, borderWidth = 0 }: ProfileAvatarProps) {
  const { profilePhoto, colors } = useSettings();
  const computedIconSize = iconSize ?? Math.round(size * 0.55);

  if (profilePhoto) {
    return (
      <Image
        source={{ uri: profilePhoto }}
        style={[
          styles.photo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: colors.tint,
          },
        ]}
      />
    );
  }

  return <Feather name="user" size={computedIconSize} color={colors.textSecondary} />;
}

const styles = StyleSheet.create({
  photo: {
    resizeMode: "cover",
  },
});
