import 'react-native-get-random-values';
import 'text-encoding';
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SimplePool, generateSecretKey, getPublicKey, finalizeEvent, nip04 } from 'nostr-tools';

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex: string): Uint8Array {
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

const RELAYS = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.primal.net'
];

const pool = new SimplePool();

export interface NostrMessage {
    id: string;
    pubkey: string;
    content: string;
    created_at: number;
    username: string;
    targetPubkey?: string;
}

export function useNostrEngine(fiatTicker: string = 'USD') {
    const [messages, setMessages] = useState<NostrMessage[]>([]);
    const [dmMessages, setDmMessages] = useState<NostrMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [username, setUsernameState] = useState<string | null>(null);
    const [isRestoredAccount, setIsRestoredAccount] = useState(false);
    const [keys, setKeys] = useState<{ secret: string | null; public: string | null }>({ secret: null, public: null });

    const activeSockets = useRef<WebSocket[]>([]);

    useEffect(() => {
        initializeKeys();
        return () => {
            activeSockets.current.forEach(ws => ws.close());
        };
    }, []);

    useEffect(() => {
        if (keys.public) {
            subscribeToChannel(fiatTicker);
        }
    }, [keys.public, fiatTicker]);

    const initializeKeys = async () => {
        const storedName = await AsyncStorage.getItem('otc_username');
        if (storedName) setUsernameState(storedName);

        const storedKey = await AsyncStorage.getItem('nostr_burner_key');
        const keyType = await AsyncStorage.getItem('otc_key_type');

        if (storedKey) {
            const skBytes = hexToBytes(storedKey);
            setKeys({ secret: storedKey, public: getPublicKey(skBytes) });
            if (keyType === 'restored') {
                setIsRestoredAccount(true);
            }
        } else {
            const skBytes = generateSecretKey();
            const hexSecret = bytesToHex(skBytes);
            setKeys({ secret: hexSecret, public: getPublicKey(skBytes) });
            await AsyncStorage.setItem('nostr_burner_key', hexSecret);
            await AsyncStorage.setItem('otc_key_type', 'burner');
        }
    };

    const setUsername = async (name: string) => {
        setUsernameState(name);
        await AsyncStorage.setItem('otc_username', name);
    };

    const createOfficialAccount = async (name: string) => {
        await setUsername(name);
        await AsyncStorage.setItem('otc_key_type', 'restored');
        setIsRestoredAccount(true);
    };

    const restoreFromKey = async (key: string) => {
        try {
            const cleanKey = key.trim();
            const skBytes = hexToBytes(cleanKey);
            const pubKey = getPublicKey(skBytes);
            
            setKeys({ secret: cleanKey, public: pubKey });
            await AsyncStorage.setItem('nostr_burner_key', cleanKey);
            await AsyncStorage.setItem('otc_key_type', 'restored');
            setIsRestoredAccount(true);
            
            setUsernameState(null);
            await AsyncStorage.removeItem('otc_username');
            
            subscribeToChannel(fiatTicker);
            return true;
        } catch(e) {
            return false;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('nostr_burner_key');
        await AsyncStorage.removeItem('otc_key_type');
        await AsyncStorage.removeItem('otc_username');
        setKeys({ secret: null, public: null });
        setMessages([]);
        setDmMessages([]);
        initializeKeys();
    };

    const handleIncomingEvent = useCallback(async (event: any) => {
        if (event.kind === 1) {
            setMessages(prev => {
                if (prev.some(m => m.id === event.id)) return prev;
                
                let parsedName = "Anon";
                let parsedContent = event.content;
                if (event.content.includes(':|:')) {
                    const parts = event.content.split(':|:');
                    parsedName = parts[0];
                    parsedContent = parts.slice(1).join(':|:');
                }

                if (event.pubkey === keys.public && !username && parsedName !== "Anon") {
                    setUsername(parsedName);
                }

                const newMessage: NostrMessage = {
                    id: event.id, pubkey: event.pubkey, created_at: event.created_at,
                    username: parsedName, content: parsedContent
                };
                return [...prev, newMessage].sort((a, b) => b.created_at - a.created_at);
            });
        } 
        else if (event.kind === 4) {
            try {
                const isSender = event.pubkey === keys.public;
                const targetPubkey = isSender ? event.tags.find((t: any[]) => t[0] === 'p')[1] : event.pubkey;
                
                const skBytes = hexToBytes(keys.secret!);
                const decrypted = await nip04.decrypt(skBytes, targetPubkey, event.content);
                
                setDmMessages(prev => {
                    if (prev.some(m => m.id === event.id)) return prev;
                    const newMessage: NostrMessage = {
                        id: event.id, pubkey: event.pubkey, created_at: event.created_at,
                        username: isSender ? "You" : "VIP", content: decrypted, targetPubkey: targetPubkey
                    };
                    return [...prev, newMessage].sort((a, b) => a.created_at - b.created_at);
                });
            } catch(e) {}
        }
    }, [keys, username]);

    const subscribeToChannel = (ticker: string) => {
        const hashtag = `p2potc_${ticker.toLowerCase()}`;
        
        activeSockets.current.forEach(ws => ws.close());
        activeSockets.current = [];
        setMessages([]);
        setDmMessages([]);

        if (!keys.public) return;

        const subId = `otc-sub-${Math.floor(Math.random() * 10000)}`;
        const reqPayload = JSON.stringify([
            "REQ", subId, 
            { kinds: [1], '#t': [hashtag], limit: 100 },
            { kinds: [4], '#p': [keys.public], limit: 50 },
            { kinds: [4], authors: [keys.public], limit: 50 }
        ]);

        RELAYS.forEach(url => {
            try {
                const ws = new WebSocket(url);
                ws.onopen = () => { ws.send(reqPayload); setIsConnected(true); };
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data[0] === "EVENT" && data[1] === subId) {
                        handleIncomingEvent(data[2]);
                    }
                };
                activeSockets.current.push(ws);
            } catch (err) {}
        });
    };

    const sendMessage = async (content: string) => {
        if (!keys.secret) return;
        const hashtag = `p2potc_${fiatTicker.toLowerCase()}`;
        const skBytes = hexToBytes(keys.secret);
        const safeName = username || "Anon";
        const finalContent = `${safeName}:|:${content}`;

        let eventTemplate = { kind: 1, created_at: Math.floor(Date.now() / 1000), tags: [['t', hashtag]], content: finalContent };
        const signedEvent = finalizeEvent(eventTemplate, skBytes);
        
        try {
            const safeRelays = JSON.parse(JSON.stringify(RELAYS));
            pool.publish(safeRelays, signedEvent);
            handleIncomingEvent(signedEvent);
        } catch (err) {}
    };

    const sendDM = async (targetPubkey: string, content: string) => {
        if (!keys.secret) return;
        const skBytes = hexToBytes(keys.secret);
        
        const encryptedContent = await nip04.encrypt(skBytes, targetPubkey, content);
        let eventTemplate = { kind: 4, created_at: Math.floor(Date.now() / 1000), tags: [['p', targetPubkey]], content: encryptedContent };
        const signedEvent = finalizeEvent(eventTemplate, skBytes);

        try {
            const safeRelays = JSON.parse(JSON.stringify(RELAYS));
            pool.publish(safeRelays, signedEvent);
            handleIncomingEvent(signedEvent); 
        } catch (err) {}
    };

    return {
        messages,
        dmMessages,
        isConnected,
        username,
        isRestoredAccount,
        keys,
        setUsername,
        createOfficialAccount,
        restoreFromKey,
        logout,
        sendMessage,
        sendDM
    };
}
