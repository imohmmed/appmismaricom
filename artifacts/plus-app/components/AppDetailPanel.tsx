import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
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
import GlassBackButton from "@/components/GlassBackButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type AppData = {
  id: number;
  name: string;
  desc: string;
  category: string;
  tag: string;
  icon: string;
  catKey?: string;
};

type Review = {
  id: number;
  name: string;
  phone: string;
  rating: number;
  text: string;
  date: string;
};

type AppDetailProps = {
  app: AppData;
  onClose: () => void;
  onCategoryPress?: (catKey: string) => void;
  relatedApps?: AppData[];
  onRelatedAppPress?: (app: AppData) => void;
};

function getTagColor(tag: string) {
  switch (tag) {
    case "tweaked": return Colors.light.tagTweaked;
    case "modded": return Colors.light.tagModded;
    case "hacked": return Colors.light.tagHacked;
    default: return Colors.light.tint;
  }
}

function maskPhone(phone: string) {
  if (phone.length < 8) return phone;
  return phone.slice(0, -7) + " *** " + phone.slice(-4);
}

function StarRow({ rating, size = 14, color = "#FFD700" }: { rating: number; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather
          key={s}
          name={s <= rating ? "star" : "star"}
          size={size}
          color={s <= rating ? color : Colors.light.separator}
        />
      ))}
    </View>
  );
}

function TapToRate({ onRate }: { onRate: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <View style={s.tapToRate}>
      <Text style={s.tapToRateLabel}>Tap to Rate</Text>
      <View style={s.tapStars}>
        {[1, 2, 3, 4, 5].map((v) => (
          <Pressable key={v} onPress={() => { setHover(v); onRate(v); }}>
            <Feather name="star" size={32} color={v <= hover ? "#FFD700" : Colors.light.separator} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const MOCK_REVIEWS: Review[] = [
  { id: 1, name: "Ahmed", phone: "+964 770 123 4567", rating: 5, text: "Amazing app! Works perfectly without any issues.", date: "2 days ago" },
  { id: 2, name: "Sara", phone: "+964 771 234 5678", rating: 4, text: "Great features, very smooth experience.", date: "1 week ago" },
];

const APP_SIZES: Record<string, string> = {
  "Social Media": "85 MB", "Ai": "142 MB", "Edit": "210 MB",
  "Games": "320 MB", "Tweaked Apps": "95 MB", "TV , LIVE": "130 MB", "Develop": "65 MB",
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function RelatedAppsRow({ apps, onPress }: { apps: AppData[]; onPress?: (app: AppData) => void }) {
  const pages = chunkArray(apps.slice(0, 9), 3);
  const pageW = SCREEN_WIDTH - 80;
  return (
    <FlatList
      data={pages}
      horizontal
      pagingEnabled={false}
      snapToInterval={pageW + 16}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
      keyExtractor={(_, i) => i.toString()}
      renderItem={({ item: chunk }) => (
        <View style={{ width: pageW }}>
          {chunk.map((a, idx) => {
            const tc = getTagColor(a.tag);
            return (
              <View key={a.id}>
                <Pressable style={s.relatedRow} onPress={() => onPress?.(a)}>
                  <View style={[s.relatedIcon, { backgroundColor: `${tc}15` }]}>
                    <Feather name={a.icon as any} size={24} color={tc} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.relatedName} numberOfLines={1}>{a.name}</Text>
                    <Text style={s.relatedDesc} numberOfLines={1}>{a.desc}</Text>
                  </View>
                  <Pressable style={s.relatedGetBtn}>
                    <Text style={s.relatedGetText}>Get</Text>
                  </Pressable>
                </Pressable>
                {idx < chunk.length - 1 && <View style={s.relatedDivider} />}
              </View>
            );
          })}
        </View>
      )}
    />
  );
}

export default function AppDetailPanel({ app, onClose, onCategoryPress, relatedApps = [], onRelatedAppPress }: AppDetailProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const tagColor = getTagColor(app.tag);

  const [descExpanded, setDescExpanded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewName, setReviewName] = useState("");
  const [reviewPhone, setReviewPhone] = useState("");

  const fullDesc = `${app.desc}. This is a ${app.tag} version of ${app.name} with premium features unlocked. Install directly without jailbreak. Regular updates and support included with your subscription. Compatible with the latest iOS versions. No revokes - we keep certificates fresh. Features include all premium content, ad removal, and exclusive tweaks not available in the original app.`;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const submitReview = () => {
    if (!reviewText.trim() || reviewRating === 0 || !reviewName.trim() || !reviewPhone.trim()) return;
    const newReview: Review = {
      id: Date.now(),
      name: reviewName,
      phone: reviewPhone,
      rating: reviewRating,
      text: reviewText,
      date: "Just now",
    };
    setReviews([newReview, ...reviews]);
    setReviewText("");
    setReviewRating(0);
    setReviewName("");
    setReviewPhone("");
  };

  const appSize = APP_SIZES[app.category] || "100 MB";

  return (
    <View style={[s.container, { paddingTop: isWeb ? 67 : insets.top }]}>
      <View style={s.navBar}>
        <GlassBackButton onPress={onClose} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : 120 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={s.appName}>{app.name}</Text>

        <View style={s.iconRow}>
          <View style={[s.bigIcon, { backgroundColor: `${tagColor}12` }]}>
            <Feather name={app.icon as any} size={56} color={tagColor} />
          </View>
        </View>

        <View style={s.actionButtons}>
          <Pressable style={s.repeatBtn}>
            <Feather name="repeat" size={16} color={Colors.light.tint} />
            <Text style={s.repeatText}>REPEAT</Text>
          </Pressable>
          <Pressable style={s.getBtn}>
            <Text style={s.getBtnText}>GET</Text>
          </Pressable>
        </View>

        <View style={s.infoBoxRow}>
          <View style={s.infoBox}>
            <Text style={s.infoBoxLabel}>RATINGS</Text>
            <Text style={s.infoBoxValue}>{avgRating}</Text>
            <StarRow rating={Math.round(Number(avgRating))} size={10} />
          </View>
          <View style={s.infoBoxDivider} />
          <View style={s.infoBox}>
            <Text style={s.infoBoxLabel}>SIZE</Text>
            <Text style={s.infoBoxValue}>{appSize}</Text>
            <Text style={s.infoBoxSub}>MB</Text>
          </View>
          <View style={s.infoBoxDivider} />
          <Pressable
            style={s.infoBox}
            onPress={() => app.catKey && onCategoryPress?.(app.catKey)}
          >
            <Text style={s.infoBoxLabel}>CATEGORY</Text>
            <Feather name="grid" size={18} color={Colors.light.tint} style={{ marginVertical: 2 }} />
            <Text style={[s.infoBoxSub, { color: Colors.light.tint }]}>{app.category}</Text>
          </Pressable>
          <View style={s.infoBoxDivider} />
          <View style={s.infoBox}>
            <Text style={s.infoBoxLabel}>UPDATED</Text>
            <Text style={s.infoBoxValue}>3d</Text>
            <Text style={s.infoBoxSub}>ago</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Description</Text>
          <Text style={s.descText} numberOfLines={descExpanded ? undefined : 3}>
            {fullDesc}
          </Text>
          <Pressable onPress={() => setDescExpanded(!descExpanded)}>
            <Text style={s.readMore}>{descExpanded ? "Show Less" : "Read More..."}</Text>
          </Pressable>
        </View>

        <View style={s.dividerFull} />

        <View style={s.section}>
          <View style={s.ratingsHeader}>
            <Text style={s.sectionTitle}>Ratings & Reviews</Text>
          </View>
          <View style={s.ratingOverview}>
            <Text style={s.bigRating}>{avgRating}</Text>
            <View style={{ gap: 4 }}>
              <StarRow rating={Math.round(Number(avgRating))} size={18} />
              <Text style={s.ratingCount}>{reviews.length} Ratings</Text>
            </View>
          </View>

          {reviews.map((review) => (
            <View key={review.id} style={s.reviewCard}>
              <View style={s.reviewHeader}>
                <View style={s.reviewerAvatar}>
                  <Text style={s.reviewerInitial}>{review.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewerName}>{review.name}</Text>
                  <Text style={s.reviewerPhone}>{maskPhone(review.phone)}</Text>
                </View>
                <Text style={s.reviewDate}>{review.date}</Text>
              </View>
              <StarRow rating={review.rating} size={12} />
              <Text style={s.reviewText}>{review.text}</Text>
            </View>
          ))}

          <TapToRate onRate={setReviewRating} />

          <View style={s.writeReviewSection}>
            <Text style={s.writeReviewTitle}>Write a Review</Text>
            <TextInput
              style={s.input}
              placeholder="Your name"
              placeholderTextColor={Colors.light.textSecondary}
              value={reviewName}
              onChangeText={setReviewName}
            />
            <TextInput
              style={s.input}
              placeholder="+964 770 000 0000"
              placeholderTextColor={Colors.light.textSecondary}
              value={reviewPhone}
              onChangeText={setReviewPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Write your review..."
              placeholderTextColor={Colors.light.textSecondary}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
            />
            <Pressable
              style={[s.submitBtn, (!reviewText.trim() || reviewRating === 0 || !reviewName.trim() || !reviewPhone.trim()) && s.submitBtnDisabled]}
              onPress={submitReview}
            >
              <Text style={s.submitBtnText}>Submit Review</Text>
            </Pressable>
          </View>
        </View>

        {relatedApps.length > 0 && (
          <>
            <View style={s.dividerFull} />
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>You Might Also Like</Text>
                <Feather name="chevron-right" size={18} color={Colors.light.textSecondary} />
              </View>
            </View>
            <RelatedAppsRow apps={relatedApps} onPress={onRelatedAppPress} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 20,
  },
  bigIcon: {
    width: 120,
    height: 120,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  repeatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
  },
  repeatText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.light.tint,
  },
  getBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
  },
  getBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },

  infoBoxRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 24,
  },
  infoBox: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  infoBoxDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.separator,
    marginVertical: 4,
  },
  infoBoxLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    letterSpacing: 0.5,
  },
  infoBoxValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  infoBoxSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  descText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  readMore: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tint,
    marginTop: 6,
    marginBottom: 8,
  },
  dividerFull: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.separator,
    marginHorizontal: 20,
    marginVertical: 8,
  },

  ratingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingOverview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  bigRating: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  ratingCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },

  reviewCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  reviewerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerInitial: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },
  reviewerName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  reviewerPhone: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  reviewText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    lineHeight: 20,
  },

  tapToRate: {
    alignItems: "center",
    gap: 8,
    marginVertical: 16,
  },
  tapToRateLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  tapStars: {
    flexDirection: "row",
    gap: 12,
  },

  writeReviewSection: {
    gap: 10,
    marginTop: 8,
  },
  writeReviewTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  submitBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
  },

  relatedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  relatedIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  relatedDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  relatedGetBtn: {
    backgroundColor: Colors.light.card,
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 18,
  },
  relatedGetText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.light.tint,
  },
  relatedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.separator,
    marginLeft: 68,
  },
});
