import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AccountSetupModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  isRestoredAccount: boolean;
  keys: { public: string | null, secret: string | null };
  username: string | null;
  createOfficialAccount: (name: string) => Promise<void>;
  restoreFromKey: (key: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export default function AccountSetupModal({
  visible, onClose, isDark, isRestoredAccount, keys, username, createOfficialAccount, restoreFromKey, logout
}: AccountSetupModalProps) {
  const [loginNameInput, setLoginNameInput] = useState('');
  const [restoreKeyInput, setRestoreKeyInput] = useState('');
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [showKey, setShowKey] = useState(false);

  const toggleKeyVisibility = () => {
    setShowKey(!showKey);
  };

  const handleCreate = async () => {
    if (loginNameInput.trim().length < 2) return;
    await createOfficialAccount(loginNameInput.trim());
    onClose();
  };

  const handleRestore = async () => {
    if (restoreKeyInput.trim().length < 60) return;
    const success = await restoreFromKey(restoreKeyInput.trim());
    if (success) {
      onClose();
    } else {
      Alert.alert('Error', 'Invalid private key. Please check and try again.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure? Make sure you have your Private Key saved before logging out!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            onClose();
          } 
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className={`w-full rounded-t-3xl pt-5 pb-10 px-5 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}
          style={{ maxHeight: '85%' }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Account</Text>
            <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 items-center justify-center">
              <Ionicons name="close" size={18} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

        {isRestoredAccount ? (
          <View>
            <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm items-center justify-center bg-blue-500">
                  <Text className="text-lg font-black text-white">{(username || 'A').charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{username || 'Syncing...'}</Text>
                  <Text className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">🔒 Verified Account</Text>
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 ml-1">Your Private Key (Master Password)</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={keys.secret || ''}
                  readOnly={true}
                  selectTextOnFocus={true}
                  secureTextEntry={!showKey}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3.5 text-xs font-mono"
                />
                <TouchableOpacity onPress={toggleKeyVisibility} className="px-5 bg-blue-100 dark:bg-blue-900/30 rounded-xl justify-center shadow-sm">
                  <Text className="text-blue-700 dark:text-blue-400 text-xs font-bold">{showKey ? 'Hide' : 'Reveal'}</Text>
                </TouchableOpacity>
              </View>
              <View className="mt-3 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50">
                <Text className="text-[10px] text-rose-700 dark:text-rose-400 font-medium leading-relaxed">
                  <Text className="font-bold">⚠️ Do not lose this!</Text> You will need this key to log in on other devices or to recover your account if you uninstall the app.
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity onPress={handleLogout} className="flex-1 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 items-center">
                <Text className="text-sm font-bold text-rose-600 dark:text-rose-400">Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <View className="flex-row bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl mb-6 shadow-inner">
              <TouchableOpacity onPress={() => setMode('signup')} className={`flex-1 py-2.5 rounded-xl items-center ${mode === 'signup' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}>
                <Text className={`text-xs font-bold ${mode === 'signup' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('signin')} className={`flex-1 py-2.5 rounded-xl items-center ${mode === 'signin' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}>
                <Text className={`text-xs font-bold ${mode === 'signin' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Restore Key</Text>
              </TouchableOpacity>
            </View>

            {mode === 'signup' ? (
              <View className="space-y-4">
                <View className="mb-4">
                  <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">No email or password needed. We instantly generate a highly secure Web3 identity for you on the Nostr network.</Text>
                </View>
                <View className="mb-6">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 ml-1">Choose an Account ID</Text>
                  <TextInput
                    value={loginNameInput}
                    onChangeText={setLoginNameInput}
                    placeholder="e.g. BinanceWhale"
                    placeholderTextColor="#94a3b8"
                    maxLength={15}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3.5 text-sm font-black"
                  />
                </View>
                <TouchableOpacity 
                  onPress={handleCreate} 
                  disabled={loginNameInput.trim().length < 2} 
                  className={`py-3.5 rounded-2xl items-center shadow-md ${loginNameInput.trim().length >= 2 ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-800'}`}
                >
                  <Text className="text-white text-sm font-bold">Generate Keys</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="space-y-4">
                <View className="mb-4">
                  <Text className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">Paste your 64-character Private Key hex below to restore your account, username, and encrypted chats.</Text>
                </View>
                <View className="mb-6">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 ml-1">Private Key Hex</Text>
                  <TextInput
                    value={restoreKeyInput}
                    onChangeText={setRestoreKeyInput}
                    placeholder="Paste 64-character hex key..."
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3.5 text-xs font-mono"
                  />
                </View>
                <TouchableOpacity 
                  onPress={handleRestore} 
                  disabled={restoreKeyInput.trim().length < 60} 
                  className={`py-3.5 rounded-2xl items-center shadow-md ${restoreKeyInput.trim().length >= 60 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-800'}`}
                >
                  <Text className={`text-sm font-bold ${restoreKeyInput.trim().length >= 60 ? 'text-white dark:text-zinc-900' : 'text-zinc-500'}`}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
