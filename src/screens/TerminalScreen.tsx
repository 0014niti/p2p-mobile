import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import storage from '../../lib/storage';
import fiatList from '../../lib/data/binance-fiat-list.json';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  Platform,
  SectionList,
  Dimensions,
  ScrollView,
  Image,
  StyleSheet,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate,
  Extrapolation,
  withTiming
} from 'react-native-reanimated';
import { 
  BottomSheetModal, 
  BottomSheetBackdrop, 
  BottomSheetTextInput,
  BottomSheetFlatList
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { FlatList } from 'react-native';

import AdCard from '../../components/AdCard';
import CompareCard from '../../components/CompareCard';
import MainHeader from '../../components/MainHeader';
import AlertSetupModal from '../../components/AlertSetupModal';
import { getAlerts, evaluateAlerts, saveContextForBackground, PriceAlert } from '../lib/alerts';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

const API_BASE = 'https://p2pcompanion.com/api';
const EXCHANGES = ['binance', 'okx', 'bybit', 'bitget', 'mexc', 'kucoin', 'remitano'];
const DEFAULT_CRYPTO = 'USDT';
const DEFAULT_FIAT = 'USD';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.43;
const SNAP_INTERVAL = CARD_WIDTH + 12; // Card width + gap

export default function TerminalScreen() {
  const [cryptoInput, setCryptoInput] = useState(DEFAULT_CRYPTO);
  const [fiatInput, setFiatInput] = useState(DEFAULT_FIAT);
  const [crypto, setCrypto] = useState(DEFAULT_CRYPTO);
  const [fiat, setFiat] = useState(DEFAULT_FIAT);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedExchanges, setSelectedExchanges] = useState(EXCHANGES);

  const [adsByExchange, setAdsByExchange] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'ledger'>('grid');
  const [marketRate, setMarketRate] = useState<number | null>(null);
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const initialFetchSkippedRef = useRef(false);

  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const alertSetupModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['65%', '90%'], []);

  const handlePresentModalPress = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetModalRef.current?.present();
  }, []);

  const handleCloseModalPress = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleAlertModalPress = useCallback(() => {
    Keyboard.dismiss();
    alertSetupModalRef.current?.present();
  }, []);

  const CRYPTO_OPTIONS = [
    { code: 'USDT', label: 'Tether' },
    { code: 'BTC', label: 'Bitcoin' },
    { code: 'ETH', label: 'Ethereum' },
    { code: 'BNB', label: 'Binance Coin' },
    { code: 'SOL', label: 'Solana' },
    { code: 'ADA', label: 'Cardano' },
    { code: 'BUSD', label: 'Binance USD' },
  ];

  const FIAT_OPTIONS = useMemo(() => {
    return fiatList.map((fiat: any) => ({
      code: fiat.currencyCode,
      label: fiat.currencySymbol ? `${fiat.currencyCode} (${fiat.currencySymbol})` : fiat.currencyCode
    }));
  }, []);

  const fiatAliases: Record<string, string> = {
    usd: 'USD', dollar: 'USD', dollars: 'USD', '$': 'USD',
    eur: 'EUR', euro: 'EUR', euros: 'EUR', '€': 'EUR',
    gbp: 'GBP', pound: 'GBP', pounds: 'GBP', '£': 'GBP',
    ngn: 'NGN', naira: 'NGN', '₦': 'NGN',
    ars: 'ARS', 'argentine peso:': 'ARS',
    php: 'PHP', 'philippine peso:': 'PHP', '₱': 'PHP',
    try: 'TRY', lira: 'TRY', '₺': 'TRY',
    vnd: 'VND', dong: 'VND', '₫': 'VND',
    inr: 'INR', rupee: 'INR', '₹': 'INR',
    rub: 'RUB', ruble: 'RUB', '₽': 'RUB',
    brl: 'BRL', real: 'BRL', 'r$': 'BRL',
    idr: 'IDR', rupiah: 'IDR', 'rp': 'IDR',
    aud: 'AUD', 'australian dollar:': 'AUD',
    cad: 'CAD', 'canadian dollar:': 'CAD',
    chf: 'CHF', franc: 'CHF',
    zar: 'ZAR', rand: 'ZAR',
    myr: 'MYR', ringgit: 'MYR',
  };

  const normalizeFiatInput = (value: string) => {
    const cleaned = value.trim();
    const lower = cleaned.toLowerCase();
    const aliasKey = lower.replace(/\s+/g, ' ');
    const alias = fiatAliases[aliasKey] || fiatAliases[lower.replace(/[^a-zA-Z]/g, '')];
    if (alias) return alias;
    if (/^[a-zA-Z]{3}$/.test(cleaned)) return cleaned.toUpperCase();
    return cleaned.toUpperCase();
  };

  const handleFiatText = (text: string) => {
    setFiatInput(text);
    const normalized = normalizeFiatInput(text);
    if (FIAT_OPTIONS.some((option) => option.code === normalized)) {
      setFiat(normalized);
    }
  };

  const handleCryptoText = (text: string) => {
    setCryptoInput(text);
    const normalized = text.trim().toUpperCase();
    if (CRYPTO_OPTIONS.some((option) => option.code === normalized)) {
      setCrypto(normalized);
    }
  };

  const cryptoSuggestions = useMemo(() => {
    const query = cryptoInput.trim().toUpperCase();
    if (!query) return CRYPTO_OPTIONS;
    return CRYPTO_OPTIONS.filter(
      (option) => option.code.startsWith(query) || option.label.toUpperCase().includes(query),
    );
  }, [cryptoInput]);

  const fiatSuggestions = useMemo(() => {
    const query = fiatInput.trim().toUpperCase();
    if (!query) return FIAT_OPTIONS;
    return FIAT_OPTIONS.filter(
      (option) => option.code.startsWith(query) || option.label.toUpperCase().includes(query),
    );
  }, [fiatInput]);

  const selectCryptoOption = (code: string) => {
    setCryptoInput(code);
    setCrypto(code);
  };

  const selectFiatOption = (code: string) => {
    setFiatInput(code);
    setFiat(code);
  };

  const activeExchanges = selectedExchanges.length ? selectedExchanges : EXCHANGES;

  const sections = useMemo(
    () =>
      activeExchanges.map((exchange) => ({
        title: exchange,
        data: adsByExchange[exchange] || [],
      })),
    [activeExchanges, adsByExchange],
  );

  const filteredSections = useMemo(() => {
    return sections
      .map((s) => ({
        ...s,
        data: (s.data || [])
          .filter((ad: any) => {
            const price = Number(ad.price);
            if (!Number.isFinite(price)) return false;
            return true;
          })
          .sort((a: any, b: any) => {
            const pa = Number(a.price) || 0;
            const pb = Number(b.price) || 0;
            return tradeType === 'buy' ? pa - pb : pb - pa;
          }),
      }));
  }, [sections, tradeType]);

  const totalAds = useMemo(
    () => sections.reduce((count, section) => count + section.data.length, 0),
    [sections],
  );

  const bestOffer = useMemo(() => {
    let best: { exchange: string; price: number } | null = null;
    for (const exchange of activeExchanges) {
      const ads = adsByExchange[exchange] || [];
      for (const ad of ads) {
        const price = Number(ad.price);
        if (!Number.isFinite(price)) continue;
        if (
          !best ||
          (tradeType === 'buy' ? price < best.price : price > best.price)
        ) {
          best = { exchange, price };
        }
      }
    }
    return best;
  }, [adsByExchange, activeExchanges, tradeType]);

  const toggleExchange = (exchange: string) => {
    setSelectedExchanges((current) =>
      current.includes(exchange) ? current.filter((item) => item !== exchange) : [...current, exchange],
    );
  };

  const fetchAds = async (
    overrideTradeType?: string,
    overrideCrypto?: string,
    overrideFiat?: string,
    overrideExchanges?: string[],
  ) => {
    const currentTradeType = overrideTradeType || tradeType;
    const currentCrypto = overrideCrypto || crypto;
    const currentFiat = overrideFiat || fiat;
    const exchangesToQuery = overrideExchanges || selectedExchanges;

    if (exchangesToQuery.length === 0) {
      Alert.alert('Select at least one exchange', 'Please choose an exchange to search.');
      return;
    }

    setIsLoading(true);
    setRefreshing(true);
    setAdsByExchange({});

    try {
      const promises = exchangesToQuery.map(async (exchange) => {
        const url = `${API_BASE}?type=${currentTradeType}&token=${currentCrypto}&fiat=${currentFiat}&exchange=${exchange}`;
        const res = await fetch(url);
        const data = await res.json();
        return { exchange, ads: data.responses || [] };
      });

      const results = await Promise.all(promises);
      const newAds: Record<string, any[]> = {};
      results.forEach((result) => {
        newAds[result.exchange] = result.ads;
      });
      setAdsByExchange(newAds);

      // Alert Engine & Background Context sync
      saveContextForBackground({
        fiat: currentFiat,
        crypto: currentCrypto,
        tradeType: currentTradeType as 'buy' | 'sell',
        exchanges: exchangesToQuery
      });
      const triggered = await evaluateAlerts(newAds, {
        fiat: currentFiat,
        crypto: currentCrypto,
        tradeType: currentTradeType as 'buy' | 'sell'
      });
      if (triggered) {
        const updatedAlerts = await getAlerts();
        setAlerts(updatedAlerts);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch ads from exchanges.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getAlerts().then(setAlerts);
  }, []);

  // Foreground Polling Interval (5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && !refreshing) {
        fetchAds();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [crypto, fiat, tradeType, selectedExchanges, isLoading, refreshing]);

  useEffect(() => {
    if (!initialFetchSkippedRef.current) {
      initialFetchSkippedRef.current = true;
      return;
    }

    const isValidCrypto = CRYPTO_OPTIONS.some((option) => option.code === crypto);
    const isValidFiat = FIAT_OPTIONS.some((option) => option.code === fiat);
    if (!isValidCrypto || !isValidFiat) return;

    const t = setTimeout(() => fetchAds(undefined, crypto, fiat), 450);
    return () => clearTimeout(t);
  }, [crypto, fiat, tradeType]);

  useEffect(() => {
    const fetchMarketRate = async () => {
      try {
        const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
        const json = await res.json();
        const rates = json?.data?.rates;
        if (!rates) return;
        const fiatRate = Number(rates[fiat.toUpperCase()]);
        const tokenRate = Number(rates[crypto.toUpperCase()]);
        if (fiatRate) {
            let mRate = null;
            const tokenUp = crypto.toUpperCase();
            if (['USDT', 'USDC', 'FDUSD', 'DAI'].includes(tokenUp)) {
                mRate = tokenRate ? (fiatRate / tokenRate) : fiatRate;
            } else if (tokenRate) {
                mRate = fiatRate / tokenRate;
            }
            setMarketRate(mRate);
        }
      } catch(e) {
        console.error('Failed to fetch market rates:', e);
      }
    };
    if (crypto && fiat) {
      fetchMarketRate();
    }
  }, [crypto, fiat]);

  useEffect(() => {
    const initLocationAndFetch = async () => {
      let detectedFiat = DEFAULT_FIAT;

      const countryToFiat: Record<string, string> = {
        US: 'USD', GB: 'GBP', EU: 'EUR', NG: 'NGN', AR: 'ARS', TR: 'TRY', PH: 'PHP', VN: 'VND', IN: 'INR', RU: 'RUB', BR: 'BRL', ID: 'IDR', ZA: 'ZAR', MY: 'MYR', TH: 'THB', PK: 'PKR', CA: 'CAD', AU: 'AUD', CH: 'CHF', KR: 'KRW', JP: 'JPY', CN: 'CNY', MX: 'MXN', SG: 'SGD', HK: 'HKD', AE: 'AED', SA: 'SAR', EG: 'EGP', KE: 'KES', ZW: 'ZWL'
      };

      const getLocaleCountry = () => {
        try {
          const locale = Intl.DateTimeFormat().resolvedOptions().locale;
          return locale?.split('-')[1]?.toUpperCase() || locale?.slice(-2).toUpperCase() || '';
        } catch {
          return '';
        }
      };

      const fallbackFiat = () => {
        const countryCode = getLocaleCountry();
        return countryToFiat[countryCode] || DEFAULT_FIAT;
      };

      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        const geoData = await geoRes.json();
        if (geoData?.currency) {
          detectedFiat = normalizeFiatInput(geoData.currency);
        } else {
          detectedFiat = fallbackFiat();
        }
      } catch (error) {
        console.log('GeoIP fetch failed, using device locale fallback');
        detectedFiat = fallbackFiat();
      }

      setFiat(detectedFiat);
      await fetchAds('buy', DEFAULT_CRYPTO, detectedFiat);

      // Auto pop up the filter sheet on mount!
      setTimeout(() => {
        bottomSheetModalRef.current?.present();
      }, 500);

      try {
        const view = await storage.getItem('terminalView');
        if (view === 'ledger' || view === 'grid') setViewMode(view as any);
      } catch (e) {}
    };

    initLocationAndFetch();
  }, []);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, 150], [0, -150], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0], Extrapolation.CLAMP);

    return {
      transform: [{ translateY }],
      opacity,
      marginBottom: interpolate(scrollY.value, [0, 150], [24, -100], Extrapolation.CLAMP),
    };
  });

  const stickyBarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [100, 150], [0, 1], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [100, 150], [-20, 0], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ translateY }],
      position: 'absolute',
      top: Math.max(insets.top, 20),
      left: 16,
      right: 16,
      zIndex: 20,
    };
  });

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <LinearGradient
        colors={isDark ? ['#09090b', '#18181b', '#09090b'] : ['#e0f2fe', '#f0fdf4', '#fafafa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      
      {/* Sticky Top Bar when scrolling */}
      <Animated.View style={stickyBarAnimatedStyle}>
        <View className="rounded-full bg-white/80 dark:bg-zinc-900/80 border border-white/50 dark:border-zinc-700/50 shadow-sm px-4 py-3 flex-row items-center justify-center self-start">
          <View className="flex-row items-center gap-3">
            <View className={`w-2 h-2 rounded-full ${tradeType === 'buy' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <Text className="font-bold text-sm text-zinc-900 dark:text-white uppercase">
              {tradeType} {crypto} / {fiat}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <MainHeader style={headerAnimatedStyle} />
        
        {/* Floating Actions Bar (Market Rate, Dark Mode, Filter) */}
        <Animated.View style={headerAnimatedStyle} className="px-4 mb-4">
          <View className="rounded-[24px] bg-white/80 dark:bg-zinc-900/80 border border-white/50 dark:border-zinc-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-3 py-2 flex-row items-center justify-between">
            {/* Market Rate */}
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 items-center justify-center">
                <Ionicons name="trending-up" size={14} color="#10b981" />
              </View>
              <View>
                <Text className="text-[9px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-bold">
                  Official Rate
                </Text>
                <Text className="text-[13px] font-black text-zinc-900 dark:text-white">
                  {marketRate ? `${marketRate.toFixed(2)} ${fiat}` : '--'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Refresh Button */}
              <TouchableOpacity 
                onPress={() => fetchAds()}
                disabled={refreshing || isLoading}
                className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50"
              >
                {(refreshing || isLoading) ? (
                  <ActivityIndicator size="small" color={isDark ? "#ffffff" : "#000000"} />
                ) : (
                  <Ionicons name="refresh" size={16} color={isDark ? "#d4d4d8" : "#52525b"} />
                )}
              </TouchableOpacity>

              {/* Theme Toggle */}
              <TouchableOpacity 
                onPress={toggleColorScheme}
                className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50"
              >
                <Ionicons name={isDark ? "sunny" : "moon"} size={16} color={isDark ? "#fbbf24" : "#71717a"} />
              </TouchableOpacity>

              {/* Alerts Button */}
              <TouchableOpacity 
                onPress={handleAlertModalPress}
                className={`w-10 h-10 rounded-full items-center justify-center border ${alerts.length > 0 ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200/50 dark:border-zinc-700/50'}`}
              >
                <Ionicons name={alerts.length > 0 ? "notifications" : "notifications-outline"} size={16} color={alerts.length > 0 ? "#6366f1" : (isDark ? "#d4d4d8" : "#52525b")} />
                {alerts.length > 0 && (
                  <View className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-zinc-900" />
                )}
              </TouchableOpacity>

              {/* Filter Button */}
              <TouchableOpacity 
                onPress={handlePresentModalPress}
                className="flex-row items-center gap-1.5 bg-emerald-500 px-4 py-2.5 rounded-full shadow-md"
              >
                <Ionicons name="options" size={14} color="#ffffff" />
                <Text className="text-xs font-black text-white uppercase tracking-widest">Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
        
        {filteredSections.length === 0 && (
          <View className="py-16 items-center">
            {isLoading ? (
              <ActivityIndicator size="large" color="#10b981" />
            ) : (
              <Text className="text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No offers found yet. Adjust your filters and refresh.
              </Text>
            )}
          </View>
        )}

        {filteredSections.map((section: any) => {
          const isEmpty = !section.data || section.data.length === 0;

          const handleOpenExchange = () => {
             const ex = section.title.toLowerCase();
             let url = `https://${ex}.com`;
             if (ex === 'binance') url = `https://p2p.binance.com/en/trade/${tradeType}/${crypto}?fiat=${fiat}&ref=GRO_28502_JGH8O`;
             else if (ex === 'okx') url = `https://www.okx.com/p2p-markets/${fiat}/${tradeType}-${crypto}?channelId=33289858`;
             else if (ex === 'bybit') url = `https://www.bybit.com/fiat/trade/otc/?actionType=${tradeType === 'buy' ? '1' : '0'}&token=${crypto}&fiat=${fiat}&ref=KV7G85`;
             else if (ex === 'mexc') url = `https://www.mexc.com/p2p/trade?currency=${fiat}&inviteCode=SnyTdGPYGL`;
             else if (ex === 'bitget') url = `https://www.bitget.com/p2p-trade?fiatName=${fiat}&coinName=${crypto}&channelCode=N8X39VA9`;
             else if (ex === 'kucoin') url = `https://www.kucoin.com/p2p/fiat-trade/?fiat=${fiat}&rcode=CXEVMU19`;
             else if (ex === 'remitano') url = 'https://remitano.com/p2p';
             Linking.openURL(url).catch(() => console.log('Unable to open link'));
          };

          const isBest = bestOffer?.exchange === section.title && !isEmpty;

          return (
            <View key={section.title} className={isBest ? "mb-8 mt-5 relative" : "mb-3"}>
              {isBest && (
                <View className="absolute -top-4 left-0 right-0 items-center z-50 shadow-xl">
                  <View className={`flex-row items-center gap-1.5 px-4 py-1.5 rounded-full border ${
                    tradeType === 'buy' ? 'bg-emerald-500 border-emerald-400' : 'bg-rose-500 border-rose-400'
                  }`}>
                    <Ionicons name={tradeType === 'buy' ? 'flash' : 'star'} size={12} color="white" />
                    <Text className="text-[10px] font-black uppercase tracking-widest text-white">
                      {tradeType === 'buy' ? 'Cheapest Buy' : 'Best Sell'}
                    </Text>
                  </View>
                </View>
              )}
              
              <View className={isBest ? `pt-4 pb-2 rounded-2xl border ${tradeType === 'buy' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-rose-500/40 bg-rose-500/10'}` : ''}>
              {isEmpty ? (
                <View className="mx-4 mb-1 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-white/40 dark:border-zinc-800/50 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex-row items-center justify-between p-3 overflow-hidden">
                   <View className="flex-row items-center gap-2">
                     <Image 
                       source={{ uri: `https://www.google.com/s2/favicons?domain=${section.title.toLowerCase() || 'binance'}.com&sz=128` }} 
                       style={{ width: 14, height: 14, borderRadius: 2 }} 
                     />
                     <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                       {section.title}
                     </Text>
                   </View>
                   <View className="flex-row items-center gap-2">
                     <Text className="text-[9px] font-bold text-rose-500 dark:text-rose-400 max-w-[120px]" numberOfLines={2}>
                       Due to strict API policies, fetching failed.
                     </Text>
                     <TouchableOpacity 
                       onPress={handleOpenExchange}
                       className="bg-rose-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1 shadow-[0_2px_10px_rgba(244,63,94,0.3)]"
                     >
                       <Text className="text-[9px] font-black text-white uppercase tracking-widest">Visit</Text>
                       <Ionicons name="open-outline" size={10} color="white" />
                     </TouchableOpacity>
                   </View>
                </View>
              ) : (
                <View style={{ width: '100%', minHeight: 160 }}>
                  <FlatList
                    data={section.data}
                    horizontal
                    keyExtractor={(item: any, idx) => `${item.id ?? item.advNo ?? item.price}-${idx}`}
                    renderItem={({ item, index }: { item: any; index: number }) => {
                      const id = item.id ?? item.advNo ?? item.price;
                      return (
                        <View style={{ width: CARD_WIDTH, marginRight: 12 }}>
                          <AdCard 
                            ad={item} 
                            fiat={fiat} 
                            crypto={crypto} 
                            exchange={section.title} 
                            tradeType={tradeType}
                            isExpanded={expandedAdId === id}
                            onToggle={() => setExpandedAdId(expandedAdId === id ? null : id)}
                            index={index}
                            isDark={isDark}
                          />
                        </View>
                      );
                    }}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
                    snapToInterval={SNAP_INTERVAL}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    windowSize={5}
                    removeClippedSubviews={false}
                  />
                </View>
              )}
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={['60%']}
        enablePanDownToClose={true}
        detached={true}
        bottomInset={100}
        style={{ marginHorizontal: 16 }}
        animationConfigs={{ damping: 30, stiffness: 300, mass: 1 }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
        )}
        backgroundComponent={(props) => (
          <View style={[props.style, { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(9,9,11,0.85)' : 'rgba(255,255,255,0.85)' }} />
          </View>
        )}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#52525b' : '#a1a1aa', width: 40 }}
      >
        <View className="flex-1 px-5 pt-2">
          <View className="flex-row items-center justify-between mb-6">
            <Text className={`text-xl font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>Filter Offers</Text>
            <TouchableOpacity onPress={handleCloseModalPress} className="w-10 h-10 rounded-full bg-emerald-500 items-center justify-center shadow-lg">
              <Ionicons name="search" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => { setTradeType('buy'); fetchAds('buy'); }}
              className={`flex-1 rounded-2xl px-4 py-3 items-center justify-center ${tradeType === 'buy' ? 'bg-emerald-500' : 'bg-zinc-900 border border-zinc-800'}`}
            >
              <Text className={`font-bold ${tradeType === 'buy' ? 'text-white' : 'text-zinc-400'}`}>
                Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setTradeType('sell'); fetchAds('sell'); }}
              className={`flex-1 rounded-2xl px-4 py-3 items-center justify-center ${tradeType === 'sell' ? 'bg-rose-500' : 'bg-zinc-900 border border-zinc-800'}`}
            >
              <Text className={`font-bold ${tradeType === 'sell' ? 'text-white' : 'text-zinc-400'}`}>
                Sell
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4 mb-6 h-64">
            <View className="flex-1">
              <Text className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Asset</Text>
              <BottomSheetTextInput
                value={cryptoInput}
                onChangeText={handleCryptoText}
                autoCapitalize="characters"
                placeholderTextColor="#71717a"
                className="bg-zinc-950 border border-zinc-800 text-white font-bold rounded-2xl px-4 py-3 mb-2"
              />
              <BottomSheetFlatList
                data={cryptoSuggestions}
                keyExtractor={(i) => i.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => selectCryptoOption(item.code)}
                    className={`px-3 py-3 rounded-xl mb-1 ${crypto === item.code ? 'bg-zinc-800' : ''}`}
                  >
                    <Text className="text-sm font-bold text-white">{item.code}</Text>
                    <Text className="text-xs text-zinc-500">{item.label}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Fiat</Text>
              <BottomSheetTextInput
                value={fiatInput}
                onChangeText={handleFiatText}
                autoCapitalize="characters"
                placeholderTextColor="#71717a"
                className="bg-zinc-950 border border-zinc-800 text-white font-bold rounded-2xl px-4 py-3 mb-2"
              />
              <BottomSheetFlatList
                data={fiatSuggestions}
                keyExtractor={(i) => i.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => selectFiatOption(item.code)}
                    className={`px-3 py-3 rounded-xl mb-1 ${fiat === item.code ? 'bg-zinc-800' : ''}`}
                  >
                    <Text className="text-sm font-bold text-white">{item.code}</Text>
                    <Text className="text-xs text-zinc-500">{item.label}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>



        </View>
      </BottomSheetModal>
      <AlertSetupModal
        modalRef={alertSetupModalRef}
        fiat={fiat}
        crypto={crypto}
        tradeType={tradeType}
        activeExchanges={activeExchanges}
        alerts={alerts}
        onAlertsChange={setAlerts}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}
