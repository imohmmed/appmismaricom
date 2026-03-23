import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotifType = "broadcast" | "app_added" | "app_updated";

export interface StoredNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  appId?: number;
  appIcon?: string;
  isRead: boolean;
  receivedAt: string;
}

const STORAGE_KEY = "@mismari_notifications";
const PENDING_APP_KEY = "@mismari_pending_open_app";
const MAX_COUNT = 100;

export async function saveNotification(
  notif: Omit<StoredNotification, "id" | "isRead" | "receivedAt">
): Promise<void> {
  try {
    const existing = await getNotifications();
    const newNotif: StoredNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      isRead: false,
      receivedAt: new Date().toISOString(),
    };
    const updated = [newNotif, ...existing].slice(0, MAX_COUNT);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export async function getNotifications(): Promise<StoredNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function markAllRead(): Promise<void> {
  try {
    const notifs = await getNotifications();
    const updated = notifs.map(n => ({ ...n, isRead: true }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export async function getUnreadCount(): Promise<number> {
  try {
    const notifs = await getNotifications();
    return notifs.filter(n => !n.isRead).length;
  } catch {
    return 0;
  }
}

export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export async function setPendingOpenApp(appId: number): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_APP_KEY, String(appId));
  } catch {}
}

export async function consumePendingOpenApp(): Promise<number | null> {
  try {
    const val = await AsyncStorage.getItem(PENDING_APP_KEY);
    if (val) {
      await AsyncStorage.removeItem(PENDING_APP_KEY);
      return Number(val);
    }
    return null;
  } catch {
    return null;
  }
}
