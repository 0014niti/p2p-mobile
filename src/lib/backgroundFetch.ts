import { getContextForBackground, evaluateAlerts } from './alerts';

const API_BASE = 'https://p2pcompanion.com/api';

export const handleBackgroundFetch = async (): Promise<boolean> => {
  try {
    const context = await getContextForBackground();
    if (!context || !context.exchanges || context.exchanges.length === 0) return false;

    const { fiat, crypto, tradeType, exchanges } = context;

    const promises = exchanges.map(async (exchange) => {
      const url = `${API_BASE}?type=${tradeType}&token=${crypto}&fiat=${fiat}&exchange=${exchange}`;
      const res = await fetch(url);
      const data = await res.json();
      return { exchange, ads: data.responses || [] };
    });

    const results = await Promise.all(promises);
    const newAds: Record<string, any[]> = {};
    results.forEach((result) => {
      newAds[result.exchange] = result.ads;
    });

    const hasNewAlerts = await evaluateAlerts(newAds, {
      fiat,
      crypto,
      tradeType
    });
    return hasNewAlerts;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return false;
  }
};
