import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useSettings } from "@/contexts/SettingsContext";

const API_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || "";
const BASE_URL = API_DOMAIN ? `https://${API_DOMAIN}` : "";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerToken(code: string): Promise<void> {
  if (Platform.OS === "web") return;
  if (!BASE_URL) return;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "com.mismari.app",
    });
    const token = tokenData.data;

    await fetch(`${BASE_URL}/api/subscriber/push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, pushToken: token }),
    });
  } catch (err) {
    console.warn("[push] Registration failed:", err);
  }
}

export function usePushNotifications() {
  const { subscriptionCode, onboardingDone } = useSettings();
  const registered = useRef(false);
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!onboardingDone || !subscriptionCode || registered.current) return;
    registered.current = true;
    registerToken(subscriptionCode);

    notifListener.current = Notifications.addNotificationReceivedListener(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.appId) {
          console.log("[push] User tapped notification for appId:", data.appId);
        }
      }
    );

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [onboardingDone, subscriptionCode]);
}
