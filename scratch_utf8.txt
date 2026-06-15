import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import storage from '../../lib/storage';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdCard from '../../components/AdCard';
import CompareCard from '../../components/CompareCard';

const API_BASE = 'https://p2pcompanion.com/api';
const EXCHANGES = ['binance', 'okx', 'bybit', 'bitget', 'mexc', 'kucoin', 'remitano'];
const DEFAULT_CRYPTO = 'USDT';
const DEFAULT_FIAT = 'USD';

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
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [reminderThreshold, setReminderThreshold] = useState('');
  const [reminderActive, setReminderActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'ledger'>('grid');
  const initialFetchSkippedRef = useRef(false);

  const CRYPTO_OPTIONS = [
    { code: 'USDT', label: 'Tether' },
    { code: 'BTC', label: 'Bitcoin' },
    { code: 'ETH', label: 'Ethereum' },
    { code: 'BNB', label: 'Binance Coin' },
    { code: 'SOL', label: 'Solana' },
    { code: 'ADA', label: 'Cardano' },
    { code: 'BUSD', label: 'Binance USD' },
  ];

  const FIAT_OPTIONS = [
    { code: 'USD', label: 'US Dollar' },
    { code: 'EUR', label: 'Euro' },
    { code: 'GBP', label: 'British Pound' },
    { code: 'NGN', label: 'Naira' },
    { code: 'ARS', label: 'Argentine Peso' },
    { code: 'TRY', label: 'Turkish Lira' },
    { code: 'PHP', label: 'Philippine Peso' },
    { code: 'VND', label: 'Vietnam Dong' },
    { code: 'INR', label: 'Indian Rupee' },
    { code: 'RUB', label: 'Russian Ruble' },
    { code: 'BRL', label: 'Brazil Real' },
    { code: 'IDR', label: 'Indonesian Rupiah' },
    { code: 'AUD', label: 'Australian Dollar' },
    { code: 'CAD', label: 'Canadian Dollar' },
  ];

  const fiatAliases: Record<string, string> = {
    usd: 'USD', dollar: 'USD', dollars: 'USD', '$': 'USD',
    eur: 'EUR', euro: 'EUR', euros: 'EUR', '€': 'EUR',
    gbp: 'GBP', pound: 'GBP', pounds: 'GBP', '£': 'GBP',
    ngn: 'NGN', naira: 'NGN', '₦': 'NGN',
    ars: 'ARS', 'argentine peso': 'ARS',
    php: 'PHP', 'philippine peso': 'PHP', '₱': 'PHP',
    try: 'TRY', lira: 'TRY', '₺': 'TRY',
    vnd: 'VND', dong: 'VND', '₫': 'VND',
    inr: 'INR', rupee: 'INR', '₹': 'INR',
    rub: 'RUB', ruble: 'RUB', '₽': 'RUB',
    brl: 'BRL', real: 'BRL', 'r$': 'BRL',
    idr: 'IDR', rupiah: 'IDR', 'rp': 'IDR',
    aud: 'AUD', 'australian dollar': 'AUD',
    cad: 'CAD', 'canadian dollar': 'CAD',
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

  // Apply client-side filtering and sorting per section to mirror web terminal behavior
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
      }))
      .filter((s) => s.data && s.data.length > 0);
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

  const toggleExchangeCb = useCallback(toggleExchange, [setSelectedExchanges]);

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
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch ads from exchanges.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Debounce auto-fetch when valid search inputs change
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

      // load saved reminder if any
      try {
        const saved = await storage.getItem('terminalReminder');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.crypto === DEFAULT_CRYPTO && parsed?.fiat === detectedFiat) {
            setReminderThreshold(parsed.threshold ?? '');
            setReminderActive(!!parsed.active);
          }
        }
      } catch (e) {
        console.log('Failed to load reminder', e);
      }
      // load view mode
      try {
        const view = await storage.getItem('terminalView');
        if (view === 'ledger' || view === 'grid') setViewMode(view as any);
      } catch (e) {
        // ignore
      }
    };

    initLocationAndFetch();
  }, []);

  const handleSetReminder = () => {
    const parsed = Number(reminderThreshold);
    if (!parsed || parsed <= 0) {
      Alert.alert('Invalid price', 'Enter a valid reminder price.');
      return;
    }

    setReminderActive(true);
    Alert.alert(
      'Reminder saved',
      `We'll remember ${crypto}/${fiat} at ${parsed.toFixed(2)} for you. Push notifications can be added later.`,
    );

    // persist reminder (safe wrapper handles missing native module)
    try {
      storage.setItem('terminalReminder', JSON.stringify({ crypto, fiat, threshold: parsed, active: true }));
    } catch (e) {
      console.log('Failed to save reminder', e);
    }
  };

  const Header = () => (
    <View className="px-4 pt-6 pb-4">
      <View className="mb-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm p-5">
        <View className="flex-row items-center justify-between mb-5 gap-3">
          <View className="flex-1">
            <Text className="text-4xl font-black text-zinc-900 dark:text-white">Terminal</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed max-w-xl">
              Compare live P2P offers for {crypto}/{fiat} across major global exchanges.
            </Text>
          </View>
          <View className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              LIVE
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              {tradeType === 'buy' ? 'Buying' : 'Selling'} {crypto} for {fiat}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setFiltersOpen((current) => !current)}
            className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-4 py-2"
          >
            <Text className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
              {filtersOpen ? 'Hide filters' : 'Show filters'}
            </Text>
          </TouchableOpacity>
        </View>

        {filtersOpen ? (
          <>
            <View className="rounded-3xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 p-5 mb-4">
              <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                Current search
              </Text>
              <Text className="text-base font-bold text-zinc-900 dark:text-white mb-4">
                {tradeType === 'buy' ? 'Buying' : 'Selling'} {crypto} for {fiat}
              </Text>
              <View className="flex-row gap-3 flex-wrap">
                <View className="rounded-2xl bg-white dark:bg-zinc-950/80 px-3 py-3 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    {totalAds} offers
                  </Text>
                  <Text className="text-sm font-black text-zinc-900 dark:text-white mt-1">
                    {bestOffer ? `${bestOffer.exchange.toUpperCase()} ${bestOffer.price}` : 'No best offer'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setTradeType('buy'); fetchAds('buy'); }}
                  className={`rounded-full px-4 py-3 ${tradeType === 'buy' ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                >
                  <Text className={`font-bold ${tradeType === 'buy' ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    Buy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setTradeType('sell'); fetchAds('sell'); }}
                  className={`rounded-full px-4 py-3 ${tradeType === 'sell' ? 'bg-rose-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                >
                  <Text className={`font-bold ${tradeType === 'sell' ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    Sell
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="rounded-3xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-4">
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                    Asset
                  </Text>
                  <TextInput
                    value={cryptoInput}
                    onChangeText={handleCryptoText}
                    autoCapitalize="characters"
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl px-4 py-3"
                  />
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {cryptoSuggestions.slice(0, 4).map((option) => (
                      <TouchableOpacity
                        key={option.code}
                        onPress={() => selectCryptoOption(option.code)}
                        className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 py-2"
                      >
                        <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{option.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                    Fiat
                  </Text>
                  <TextInput
                    value={fiatInput}
                    onChangeText={handleFiatText}
                    autoCapitalize="characters"
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl px-4 py-3"
                  />
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {fiatSuggestions.slice(0, 4).map((option) => (
                      <TouchableOpacity
                        key={option.code}
                        onPress={() => selectFiatOption(option.code)}
                        className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 py-2"
                      >
                        <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{option.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2 mb-4">
                {EXCHANGES.map((exchange) => {
                  const selected = selectedExchanges.includes(exchange);
                  return (
                    <TouchableOpacity
                      key={exchange}
                      onPress={() => toggleExchange(exchange)}
                      className={`rounded-full border px-4 py-2 ${
                        selected
                          ? 'border-emerald-500 bg-emerald-500/15'
                          : 'border-zinc-200 bg-transparent dark:border-zinc-800'
                      }`}
                    >
                      <Text className={`text-xs font-semibold uppercase tracking-widest ${
                        selected
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {exchange}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="rounded-3xl bg-white dark:bg-zinc-950/90 p-4 border border-zinc-200 dark:border-zinc-800">
                <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                  Watch price later
                </Text>
                <View className="flex-row gap-3 items-center">
                  <TextInput
                    value={reminderThreshold}
                    onChangeText={setReminderThreshold}
                    keyboardType="numeric"
                    placeholder="Enter target price"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-4 py-3"
                  />
                  <TouchableOpacity onPress={handleSetReminder} className="rounded-2xl bg-blue-900 px-4 py-3">
                    <Text className="text-sm font-bold text-white">Set</Text>
                  </TouchableOpacity>
                </View>
                <Text className={`mt-3 text-xs ${reminderActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {reminderActive
                    ? `Reminder active for ${crypto}/${fiat} at ${Number(reminderThreshold).toFixed(2)}.`
                    : 'Set a target price now, and wire notifications later.'}
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );

  const FilterBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3">
      <View className="flex-row items-center gap-3">
        {EXCHANGES.map((exchange) => {
          const selected = selectedExchanges.includes(exchange);
          return (
            <TouchableOpacity
              key={exchange}
              onPress={() => toggleExchange(exchange)}
              className={`px-3 py-2 rounded-full border ${
                selected ? 'bg-emerald-500/15 border-emerald-500' : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Text className={`${selected ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-600 dark:text-zinc-400'} text-xs font-semibold uppercase`}>
                {exchange}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#09090b]" edges={['top']}>
      <FilterBar />
      {viewMode === 'grid' ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAds()} tintColor="#10b981" />}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {Header && <Header />}
          {filteredSections.length === 0 && (
            <View className="px-4 py-16 items-center">
              {isLoading ? (
                <ActivityIndicator size="large" color="#10b981" />
              ) : (
                <Text className="text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  No offers found yet. Adjust your filters and refresh to load the latest P2P results.
                </Text>
              )}
            </View>
          )}

          {filteredSections.map((section: any) => (
            <View key={section.title} className="mb-6">
              <View className="px-4 mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">{section.title.toUpperCase()}</Text>
                <View className="rounded-full px-2 py-1 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                  <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{(section.data || []).length} offers</Text>
                </View>
              </View>

              <FlatList
                data={section.data || []}
                horizontal
                keyExtractor={(item: any, idx) => `${item.id ?? item.advNo ?? item.price}-${idx}`}
                renderItem={({ item }: { item: any }) => (
                  <CompareCard ad={item} fiat={fiat} crypto={crypto} exchange={section.title} />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8 }}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item, index) => `${item.id ?? item.advNo ?? item.price}-${index}`}
          renderItem={({ item, section }) => (
            <AdCard ad={item} fiat={fiat} crypto={crypto} exchange={section.title} />
          )}
          initialNumToRender={8}
          maxToRenderPerBatch={12}
          windowSize={9}
          // disable clipped subviews on Android to avoid view insertion errors
          removeClippedSubviews={false}
          // allow nested scrolling when there are inner scroll views
          nestedScrollEnabled={true}
          stickySectionHeadersEnabled={true}
          renderSectionHeader={({ section: { title, data } }) => (
            <View className="px-4 pt-5 pb-3 bg-transparent">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                  {title.toUpperCase()}
                </Text>
                <View className="rounded-full px-2 py-1 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                  <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{data.length} offers</Text>
                </View>
              </View>
            </View>
          )}
          ListHeaderComponent={Header}
          ListEmptyComponent={
            <View className="px-4 py-16 items-center">
              {isLoading ? (
                <ActivityIndicator size="large" color="#10b981" />
              ) : (
                <Text className="text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  No offers found yet. Adjust your filters and refresh to load the latest P2P results.
                </Text>
              )}
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAds()} tintColor="#10b981" />}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
