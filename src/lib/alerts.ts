import storage from '../../lib/storage';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface PriceAlert {
  id: string;
  exchange: string;
  fiat: string;
  crypto: string;
  tradeType: 'buy' | 'sell';
  targetPrice: number;
}

const ALERTS_STORAGE_KEY = '@p2p_alerts';
const CONTEXT_STORAGE_KEY = '@p2p_context'; // stores latest fiat, crypto, tradeType for background fetch

export const getAlerts = async (): Promise<PriceAlert[]> => {
  const alerts = await storage.getObject<PriceAlert[]>(ALERTS_STORAGE_KEY);
  return alerts || [];
};

export const saveAlerts = async (alerts: PriceAlert[]) => {
  await storage.setObject(ALERTS_STORAGE_KEY, alerts);
};

export const addAlert = async (alert: Omit<PriceAlert, 'id'>) => {
  const alerts = await getAlerts();
  const newAlert = { ...alert, id: Math.random().toString(36).substr(2, 9) };
  alerts.push(newAlert);
  await saveAlerts(alerts);
  return newAlert;
};

export const removeAlert = async (id: string) => {
  const alerts = await getAlerts();
  const newAlerts = alerts.filter(a => a.id !== id);
  await saveAlerts(newAlerts);
};

export const evaluateAlerts = async (
  adsByExchange: Record<string, any[]>,
  currentContext: { fiat: string, crypto: string, tradeType: 'buy'|'sell' }
) => {
  const alerts = await getAlerts();
  if (alerts.length === 0) return false;

  let triggeredAny = false;
  let remainingAlerts = [...alerts];

  for (const alert of alerts) {
    const exchangeAds = adsByExchange[alert.exchange] || [];
    let isTriggered = false;
    let triggeredPrice = 0;

    // If the current fetch context doesn't match the alert's criteria, skip it.
    if (
      currentContext.fiat !== alert.fiat || 
      currentContext.crypto !== alert.crypto || 
      currentContext.tradeType !== alert.tradeType
    ) {
      continue;
    }

    for (const ad of exchangeAds) {
      const price = Number(ad.price);
      if (!Number.isFinite(price)) continue;

      if (alert.tradeType === 'buy' && price <= alert.targetPrice) {
        isTriggered = true;
        triggeredPrice = price;
        break;
      } else if (alert.tradeType === 'sell' && price >= alert.targetPrice) {
        isTriggered = true;
        triggeredPrice = price;
        break;
      }
    }

    if (isTriggered) {
      triggeredAny = true;
      // Try to send Push Notification, fallback to in-app Alert
      let pushed = false;
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🎯 ${alert.exchange} Price Target Hit!`,
              body: `The best ${alert.tradeType} price for ${alert.crypto}/${alert.fiat} reached ${triggeredPrice} ${alert.fiat}.`,
            },
            trigger: null,
          });
          pushed = true;
        }
      } catch (e) {
        console.warn('Push notification skipped/failed:', e);
      }

      if (!pushed) {
        Alert.alert(
          `🎯 ${alert.exchange} Price Target Hit!`,
          `The best ${alert.tradeType} price for ${alert.crypto}/${alert.fiat} reached ${triggeredPrice} ${alert.fiat}. Tap to trade now!`
        );
      }
      // Remove the alert once triggered
      remainingAlerts = remainingAlerts.filter(a => a.id !== alert.id);
    }
  }

  if (triggeredAny) {
    await saveAlerts(remainingAlerts);
  }
  return triggeredAny;
};

export const saveContextForBackground = async (context: { fiat: string, crypto: string, tradeType: 'buy'|'sell', exchanges: string[] }) => {
  await storage.setObject(CONTEXT_STORAGE_KEY, context);
};

export const getContextForBackground = async () => {
  return await storage.getObject<{ fiat: string, crypto: string, tradeType: 'buy'|'sell', exchanges: string[] }>(CONTEXT_STORAGE_KEY);
};
