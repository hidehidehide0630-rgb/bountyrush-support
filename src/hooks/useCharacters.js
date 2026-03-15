import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const STORAGE_KEY = 'bounty-rush-owned-characters';
const USER_ID_STORAGE_KEY = 'bounty-rush-user-id';

export function useCharacters(selectedTags = []) {
    const [characters, setCharacters] = useState([]);
    const [ownedIds, setOwnedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ 
        attr: ['全て'], 
        style: ['全て'], 
        rarity: ['全て'], 
        keyword: '' 
    });
    
    // Auth status
    const [user, setUser] = useState(() => {
        const savedId = localStorage.getItem(USER_ID_STORAGE_KEY);
        return savedId ? { id: savedId, isFallback: true } : null;
    });
    const [syncStatus, setSyncStatus] = useState('未実行');

    const isInitialLoad = useRef(true);
    const syncTimeoutRef = useRef(null);

    // Load characters and handle auth session
    useEffect(() => {
        // 1. キャラクターデータのロード
        fetch('./characters_data.json')
            .then(res => {
                if (!res.ok) throw new Error('データの読み込みに失敗しました');
                return res.json();
            })
            .then(data => {
                setCharacters(data);
                // データロード完了
            })
            .catch(err => {
                setError(err.message);
            });

        // 2. 認証状態の鉄壁チェック
        const initSession = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const newUser = session?.user ?? null;
            setUser(newUser);

            if (newUser) {
                localStorage.setItem(USER_ID_STORAGE_KEY, newUser.id);
                // ログイン済みならDBから強制取得（LocalStorageは無視）
                await fetchFromCloud(newUser.id);
            } else {
                setLoading(false); // ゲストなら解除
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const newUser = session?.user ?? null;
            setUser(newUser);
            if (newUser) {
                localStorage.setItem(USER_ID_STORAGE_KEY, newUser.id);
                await fetchFromCloud(newUser.id);
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem(USER_ID_STORAGE_KEY);
                setOwnedIds(new Set()); // ログアウト時はクリア
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 【鉄壁】クラウドからデータを取得（DBを絶対的正解とする）
    const fetchFromCloud = async (userId) => {
        setSyncStatus('DB取得中...');
        try {
            const { data, error } = await supabase
                .from('user_characters')
                .select('character_ids')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data && data.character_ids) {
                // DBにデータがあれば LocalStorage を上書き
                const dbIds = new Set(data.character_ids);
                setOwnedIds(dbIds);
                saveOwned(dbIds); // Localはミラーとしてのみ利用
                setSyncStatus('DB同期完了');
                console.log('✅ DBから復元成功:', userId);
            } else {
                setSyncStatus('DB空(初期状態)');
            }
        } catch (err) {
            console.error('❌ DB取得エラー:', err);
            setSyncStatus('DB取得失敗');
        } finally {
            setLoading(false);
        }
    };

    // 【鉄壁】クラウドへ保存（実行時にセッションを物理確認）
    const syncToCloud = useCallback((ids) => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        
        setSyncStatus('保存待機...');
        syncTimeoutRef.current = setTimeout(async () => {
            setSyncStatus('DB保存中...');
            try {
                // 実行の瞬間にセッションを再確認（絶対条件）
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    console.warn('保存スキップ: セッションなし');
                    return;
                }

                const userId = session.user.id;
                const { error } = await supabase
                    .from('user_characters')
                    .upsert({ 
                        user_id: userId, 
                        character_ids: Array.from(ids),
                        updated_at: new Date().toISOString()
                    });
                
                if (error) throw error;
                
                setSyncStatus('保存成功');
                console.log('✅ DB保存成功:', userId);
                // デバッグ用通知（ユーザーの要望）
                // alert('✅ データがサーバーに保存されました');
            } catch (err) {
                console.error('❌ DB保存エラー:', err);
                setSyncStatus('保存失敗');
                alert('❌ サーバーへの保存に失敗しました');
            }
        }, 2000); 
    }, []);

    // Load owned status from localStorage (ゲスト用)
    useEffect(() => {
        if (characters.length === 0 || user) return; // ログイン済みならDBを待つのでスキップ

        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setOwnedIds(new Set(JSON.parse(saved)));
            } else {
                const allIds = new Set(characters.map(c => c.id));
                setOwnedIds(allIds);
                localStorage.setItem(STORAGE_KEY, JSON.stringify([...allIds]));
            }
        } catch (e) {
            console.warn('ゲストデータの読み込みに失敗:', e);
        }
    }, [characters, user]);

    // Save owned status to localStorage
    const saveOwned = useCallback((newOwnedIds) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...newOwnedIds]));
        } catch (e) {
            console.warn('所持データの保存に失敗:', e);
        }
    }, []);

    // Toggle ownership
    const toggleOwned = useCallback((id) => {
        setOwnedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            saveOwned(next);
            syncToCloud(next);
            return next;
        });
    }, [saveOwned, syncToCloud]);

    // Bulk set all as owned
    const setAllOwned = useCallback(() => {
        const allIds = new Set(characters.map(c => c.id));
        setOwnedIds(allIds);
        saveOwned(allIds);
        syncToCloud(allIds);
    }, [characters, saveOwned, syncToCloud]);

    // Bulk set all as not owned
    const clearAllOwned = useCallback(() => {
        const empty = new Set();
        setOwnedIds(empty);
        saveOwned(empty);
        syncToCloud(empty);
    }, [saveOwned, syncToCloud]);


    // Generate Share URL
    const generateShareUrl = useCallback(() => {
        try {
            const idsStr = JSON.stringify([...ownedIds]);
            const encoded = btoa(idsStr);
            const url = new URL(window.location.href);
            url.searchParams.set('owned', encoded);
            return url.toString();
        } catch (e) {
            console.error('URL生成失敗', e);
            return '';
        }
    }, [ownedIds]);

    // Filter characters
    const filteredCharacters = characters.filter(c => {
        // Keyword filter
        if (filter.keyword && !c.name.includes(filter.keyword)) return false;

        // Attribute filter (Multi-select)
        if (!filter.attr.includes('全て')) {
            if (!filter.attr.includes(c.attr)) return false;
        }

        // Style filter (Multi-select)
        if (!filter.style.includes('全て')) {
            if (!filter.style.includes(c.style)) return false;
        }

        // Rarity filter (Multi-select)
        if (!filter.rarity.includes('全て')) {
            const hasMatch = filter.rarity.some(r => {
                const filterRarityNum = parseInt(r.replace('★', ''), 10);
                return c.rarity === filterRarityNum;
            });
            if (!hasMatch) return false;
        }

        // Tag filter (OR search)
        if (selectedTags.length > 0) {
            const hasAnyTag = selectedTags.some(tag => c.tags.includes(tag));
            if (!hasAnyTag) return false;
        }

        return true;
    });

    // Get all unique tags
    const allTags = [...new Set(characters.flatMap(c => c.tags))].sort();

    // Get all unique attrs (exclude 不明)
    const allAttrs = [...new Set(characters.map(c => c.attr))].filter(a => a !== '不明');

    // Get all unique styles (exclude 不明)
    const allStyles = [...new Set(characters.map(c => c.style))].filter(s => s !== '不明');

    return {
        characters,
        filteredCharacters,
        ownedIds,
        loading,
        error,
        filter,
        setFilter,
        toggleOwned,
        setAllOwned,
        clearAllOwned,
        generateShareUrl,
        user,
        syncStatus,
        allTags,
        allAttrs,
        allStyles,
    };
}
