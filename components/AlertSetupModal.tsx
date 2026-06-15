import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { PriceAlert, addAlert, removeAlert } from '../src/lib/alerts';

interface AlertSetupModalProps {
  modalRef: React.RefObject<BottomSheetModal>;
  fiat: string;
  crypto: string;
  tradeType: 'buy' | 'sell';
  activeExchanges: string[];
  alerts: PriceAlert[];
  onAlertsChange: (alerts: PriceAlert[]) => void;
  isDark: boolean;
}

export default function AlertSetupModal({
  modalRef, fiat, crypto, tradeType, activeExchanges, alerts, onAlertsChange, isDark
}: AlertSetupModalProps) {
  const [selectedExchange, setSelectedExchange] = useState<string>(activeExchanges[0] || 'binance');
  const [targetPriceStr, setTargetPriceStr] = useState('');

  const handleAddAlert = async () => {
    const price = parseFloat(targetPriceStr);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid target price.');
      return;
    }
    const newAlert = await addAlert({
      exchange: selectedExchange,
      fiat,
      crypto,
      tradeType,
      targetPrice: price,
    });
    onAlertsChange([...alerts, newAlert]);
    setTargetPriceStr('');
    Alert.alert('Alert Set', `You will be notified when ${selectedExchange} hits ${price} ${fiat}.`);
  };

  const handleRemove = async (id: string) => {
    await removeAlert(id);
    onAlertsChange(alerts.filter(a => a.id !== id));
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={['70%']}
      enablePanDownToClose={true}
      detached={true}
      bottomInset={100}
      style={{ marginHorizontal: 16 }}
      backgroundComponent={({ style }) => (
        <View style={[style, { 
          overflow: 'hidden', 
          borderRadius: 24,
          backgroundColor: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)'
        }]} />
      )}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={isDark ? 0.7 : 0.4} />
      )}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#52525b' : '#d4d4d8', width: 40 }}
    >
      <View className="flex-1 px-5 pt-2">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Price Alerts</Text>
          <TouchableOpacity onPress={() => modalRef.current?.dismiss()} className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 items-center justify-center">
            <Ionicons name="close" size={18} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">Add New Alert</Text>
        
        <View className="bg-white/60 dark:bg-zinc-900/60 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 mb-6">
          <Text className="text-[11px] font-bold text-zinc-500 mb-2">Select Exchange</Text>
          <BottomSheetScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {activeExchanges.map(ex => (
              <TouchableOpacity
                key={ex}
                onPress={() => setSelectedExchange(ex)}
                className={`w-12 h-12 rounded-2xl mr-3 border-2 items-center justify-center shadow-sm ${selectedExchange === ex ? 'bg-emerald-50 border-emerald-400 dark:bg-emerald-900/30' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}
              >
                <Image 
                  source={{ uri: `https://www.google.com/s2/favicons?domain=${ex.toLowerCase()}.com&sz=128` }} 
                  style={{ width: 24, height: 24, borderRadius: 6 }} 
                  className={selectedExchange !== ex ? 'opacity-60' : 'opacity-100'}
                />
              </TouchableOpacity>
            ))}
          </BottomSheetScrollView>

          <Text className="text-[11px] font-bold text-zinc-500 mb-2">Target Price ({fiat})</Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={targetPriceStr}
              onChangeText={setTargetPriceStr}
              keyboardType="decimal-pad"
              placeholder={`Enter price (e.g. 1.05)`}
              placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 font-bold text-base"
            />
            <TouchableOpacity onPress={handleAddAlert} className="bg-indigo-500 w-12 h-12 rounded-xl items-center justify-center shadow-md shadow-indigo-500/30">
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-zinc-500 mt-2 italic">
            You will be notified when {tradeType === 'buy' ? 'price drops below' : 'price rises above'} this target.
          </Text>
        </View>

        <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">Active Alerts</Text>
        <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {alerts.length === 0 ? (
            <Text className="text-zinc-400 dark:text-zinc-500 text-center text-sm py-4">No active alerts.</Text>
          ) : (
            alerts.map((alert) => (
              <View key={alert.id} className="bg-white/80 dark:bg-zinc-900/80 rounded-xl p-3 mb-2 flex-row items-center justify-between border border-zinc-100 dark:border-zinc-800/80">
                <View>
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Text className="text-xs font-black uppercase text-zinc-900 dark:text-white">{alert.exchange}</Text>
                    <View className={`px-1.5 py-0.5 rounded ${alert.tradeType === 'buy' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                      <Text className={`text-[9px] font-black uppercase tracking-widest ${alert.tradeType === 'buy' ? 'text-emerald-500' : 'text-rose-500'}`}>{alert.tradeType}</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                    {alert.tradeType === 'buy' ? '<=' : '>='} <Text className="text-zinc-900 dark:text-white">{alert.targetPrice} {alert.fiat}</Text>
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemove(alert.id)} className="w-8 h-8 bg-rose-500/10 rounded-full items-center justify-center">
                  <Ionicons name="trash" size={14} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}
