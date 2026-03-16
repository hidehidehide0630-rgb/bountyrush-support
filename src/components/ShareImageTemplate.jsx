import { forwardRef } from 'react';

// ========================================
// 属性カラー定義（インラインスタイル用）
// ========================================
const ATTR_BORDER_COLORS = {
    '赤': '#ef4444',
    '青': '#3b82f6',
    '緑': '#22c55e',
    '黒': '#a855f7',
    '白': '#d6d3d1',
    '不明': '#64748b',
};

const STYLE_ICONS = {
    'アタッカー': '👊',
    'ディフェンダー': '🛡️',
    'ゲッター': '👟'
};

const ShareImageTemplate = forwardRef(({ team, tagEffects, battleCharacters = [], characters = [] }, ref) => {
    if (!team || team.length === 0) return null;

    // バトルキャラのオブジェクトを取得
    const battleChars = battleCharacters.map(id =>
        id ? characters.find(c => c.id === id) : null
    );

    // Lv.600に到達しているタグ（stage 5 = 最大レベル）のみフィルタ
    const maxLevelTags = tagEffects
        ? tagEffects.filter(t => t.level >= 600)
        : [];

    return (
        <div
            ref={ref}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: -50,
                width: '1200px',
                height: '900px',
                transform: 'translateX(-9999px)',
                overflow: 'hidden',
                fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
            }}
        >
            {/* 全体コンテナ */}
            <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #0c0e1a 0%, #1a1c2e 40%, #0f1117 100%)',
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
            }}>
                {/* ===== ヘッダー帯 ===== */}
                <div style={{
                    background: 'linear-gradient(90deg, #d97706, #f59e0b, #d97706)',
                    padding: '12px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '3px solid #92400e',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '28px' }}>🏴‍☠️</span>
                        <span style={{ fontSize: '22px', fontWeight: 900, color: '#1c1917', letterSpacing: '1px' }}>
                            パーティ編成
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#422006' }}>
                            発動タグ: {tagEffects ? tagEffects.length : 0}個
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#422006' }}>
                            ／ Lv.600: {maxLevelTags.length}個
                        </span>
                    </div>
                </div>

                {/* ===== バトルキャラセクション ===== */}
                <div style={{ padding: '16px 32px 8px', flex: '0 0 auto' }}>
                    {/* セクションラベル */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(90deg, #d97706, #b45309)',
                        padding: '4px 16px',
                        borderRadius: '6px 6px 0 0',
                        marginBottom: '-1px',
                    }}>
                        <span style={{ fontSize: '12px' }}>⚔️</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>バトルキャラ</span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        background: 'rgba(30, 30, 50, 0.8)',
                        border: '2px solid #d97706',
                        borderRadius: '0 12px 12px 12px',
                        padding: '16px',
                    }}>
                        {[0, 1].map(idx => {
                            const bc = battleChars[idx];
                            const borderColor = bc ? (ATTR_BORDER_COLORS[bc.attr] || ATTR_BORDER_COLORS['不明']) : '#475569';
                            const styleIcon = bc ? (STYLE_ICONS[bc.style] || '') : '';
                            const dispName = bc ? (bc.original_name || bc.name) : '';

                            return (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    background: 'rgba(15, 15, 30, 0.6)',
                                    border: `2px solid ${borderColor}`,
                                    borderRadius: '12px',
                                    padding: '12px',
                                    position: 'relative',
                                }}>
                                    {/* ラベル */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '-1px',
                                        left: '12px',
                                        background: '#d97706',
                                        padding: '2px 10px',
                                        borderRadius: '0 0 6px 6px',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        color: '#fff',
                                    }}>
                                        バトルキャラ{idx + 1}
                                    </div>

                                    {bc ? (
                                        <>
                                            {/* アイコン */}
                                            <div style={{
                                                width: '100px',
                                                height: '100px',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                border: `3px solid ${borderColor}`,
                                                flexShrink: 0,
                                                boxShadow: `0 0 15px ${borderColor}40`,
                                                position: 'relative',
                                            }}>
                                                <img
                                                    src={bc.icon}
                                                    alt={dispName}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    crossOrigin="anonymous"
                                                />
                                                {styleIcon && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '2px',
                                                        right: '2px',
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        background: 'rgba(0,0,0,0.8)',
                                                        border: '1px solid #475569',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px',
                                                    }}>
                                                        {styleIcon}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 情報 */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontSize: '18px',
                                                    fontWeight: 900,
                                                    color: '#f1f5f9',
                                                    marginTop: '8px',
                                                    lineHeight: 1.3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {dispName}
                                                </p>
                                                <p style={{
                                                    fontSize: '11px',
                                                    color: '#94a3b8',
                                                    marginTop: '4px',
                                                    fontWeight: 600,
                                                }}>
                                                    {bc.style || ''} ／ {bc.attr || ''}属性
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#475569',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            paddingTop: '12px',
                                        }}>
                                            未設定
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== サポートキャラセクション ===== */}
                <div style={{ padding: '8px 32px 8px', flex: '0 0 auto' }}>
                    {/* セクションラベル */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(90deg, #d97706, #b45309)',
                        padding: '4px 16px',
                        borderRadius: '6px 6px 0 0',
                        marginBottom: '-1px',
                    }}>
                        <span style={{ fontSize: '12px' }}>👥</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>サポートキャラ</span>
                    </div>

                    <div style={{
                        background: 'rgba(30, 30, 50, 0.8)',
                        border: '2px solid #d97706',
                        borderRadius: '0 12px 12px 12px',
                        padding: '12px 16px',
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '8px',
                        }}>
                            {team.map((c, i) => {
                                const borderColor = ATTR_BORDER_COLORS[c.attr] || ATTR_BORDER_COLORS['不明'];
                                const dispName = c.original_name || c.name;

                                return (
                                    <div key={c.id} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}>
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            border: `2px solid ${borderColor}`,
                                            position: 'relative',
                                            boxShadow: `0 0 8px ${borderColor}30`,
                                            background: '#1e1e30',
                                        }}>
                                            {/* 順番バッジ */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '2px',
                                                left: '2px',
                                                zIndex: 10,
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.8)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                color: '#fbbf24',
                                            }}>
                                                {i + 1}
                                            </div>
                                            <img
                                                src={c.icon}
                                                alt={dispName}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                crossOrigin="anonymous"
                                            />
                                        </div>
                                        <p style={{
                                            fontSize: '9px',
                                            fontWeight: 700,
                                            color: '#cbd5e1',
                                            textAlign: 'center',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            width: '88px',
                                            lineHeight: 1.2,
                                        }}>
                                            {dispName}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ===== Lv.600タグ効果テキストセクション ===== */}
                {maxLevelTags.length > 0 && (
                    <div style={{ padding: '4px 32px 16px', flex: '1 1 auto', overflow: 'hidden' }}>
                        {/* セクションラベル */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(90deg, #7c3aed, #6d28d9)',
                            padding: '4px 16px',
                            borderRadius: '6px 6px 0 0',
                            marginBottom: '-1px',
                        }}>
                            <span style={{ fontSize: '12px' }}>✨</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Lv.600到達タグ効果</span>
                        </div>

                        <div style={{
                            background: 'rgba(30, 30, 50, 0.8)',
                            border: '2px solid #7c3aed',
                            borderRadius: '0 12px 12px 12px',
                            padding: '10px 16px',
                            maxHeight: '200px',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '6px 16px',
                            }}>
                                {maxLevelTags.map((tag, i) => (
                                    <div key={`${tag.name}-${i}`} style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'flex-start',
                                        padding: '4px 0',
                                        borderBottom: '1px solid rgba(124, 58, 237, 0.15)',
                                    }}>
                                        <div style={{
                                            background: tag.isSelected
                                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                                : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            color: '#fff',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                            lineHeight: '18px',
                                        }}>
                                            {tag.name}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: '#cbd5e1',
                                            lineHeight: 1.5,
                                            flex: 1,
                                        }}>
                                            {tag.description.split('[partition][/partition]').map((part, pi) => (
                                                <span key={pi}>
                                                    {pi > 0 && <br />}
                                                    {part}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== フッター ===== */}
                <div style={{
                    padding: '8px 32px',
                    borderTop: '1px solid rgba(100, 116, 139, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                }}>
                    <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                        ※全キャラフル育成想定（Lv100/スキルLv5/★9メダル3枚/ブースト2）
                    </p>
                    <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                        バウンティラッシュ サポート編成シミュレーター
                    </p>
                </div>
            </div>
        </div>
    );
});

ShareImageTemplate.displayName = 'ShareImageTemplate';

export default ShareImageTemplate;
