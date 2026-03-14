import { useState } from 'react';

const ATTR_OPTIONS = [
    { value: '全て', label: '全て', color: 'bg-slate-600' },
    { value: '赤', label: '赤', color: 'bg-red-500' },
    { value: '青', label: '青', color: 'bg-blue-500' },
    { value: '緑', label: '緑', color: 'bg-green-500' },
    { value: '黒', label: '黒', color: 'bg-purple-500' },
    { value: '白', label: '白', color: 'bg-stone-200 !text-gray-800' },
];

const STYLE_OPTIONS = [
    { value: '全て', label: '全て', icon: '🎯' },
    { value: 'アタッカー', label: 'アタッカー', icon: <img src="./attacker.png" alt="アタッカー" className="w-3.5 h-3.5 object-contain" /> },
    { value: 'ディフェンダー', label: 'ディフェンダー', icon: <img src="./defender.png" alt="ディフェンダー" className="w-3.5 h-3.5 object-contain" /> },
    { value: 'ゲッター', label: 'ゲッター', icon: <img src="./getter.png" alt="ゲッター" className="w-3.5 h-3.5 object-contain" /> },
];

export default function FilterBar({ filter, setFilter, totalCount, filteredCount, ownedCount, onShareUrl }) {
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
        const url = onShareUrl();
        if (url) {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    return (
        <div className="glass-strong rounded-2xl p-4 space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-baseline sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <h2 className="text-lg font-bold text-slate-100">
                        キャラクター一覧
                    </h2>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-400">
                            全 <span className="font-bold text-white">{totalCount}</span> 体
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400">
                            所持 <span className="font-bold text-indigo-400">{ownedCount}</span> 体
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400">
                            表示 <span className="font-bold text-slate-200">{filteredCount}</span> 体
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                        onClick={handleShare}
                        className="px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                    >
                        {copied ? '✓ URLコピー完了' : '🔗 所持状況を共有'}
                    </button>
                </div>
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">キャラクター名で検索</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">🔍</span>
                    <input
                        type="text"
                        value={filter.keyword}
                        onChange={(e) => setFilter(prev => ({ ...prev, keyword: e.target.value }))}
                        placeholder="例：ルフィ、カイドウ..."
                        className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Attribute filter */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">属性</label>
                <div className="flex flex-wrap gap-2">
                    {ATTR_OPTIONS.map(opt => {
                        const isActive = filter.attr.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                id={`filter-attr-${opt.value}`}
                                onClick={() => {
                                    setFilter(prev => {
                                        let next = [...prev.attr];
                                        if (opt.value === '全て') {
                                            next = ['全て'];
                                        } else {
                                            if (next.includes(opt.value)) {
                                                next = next.filter(v => v !== opt.value);
                                                if (next.length === 0) next = ['全て'];
                                            } else {
                                                next = next.filter(v => v !== '全て');
                                                next.push(opt.value);
                                            }
                                        }
                                        return { ...prev, attr: next };
                                    });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
                                    ${isActive
                                        ? `${opt.color} text-white shadow-lg scale-105`
                                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/80'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Style filter */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">スタイル</label>
                <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map(opt => {
                        const isActive = filter.style.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                id={`filter-style-${opt.value}`}
                                onClick={() => {
                                    setFilter(prev => {
                                        let next = [...prev.style];
                                        if (opt.value === '全て') {
                                            next = ['全て'];
                                        } else {
                                            if (next.includes(opt.value)) {
                                                next = next.filter(v => v !== opt.value);
                                                if (next.length === 0) next = ['全て'];
                                            } else {
                                                next = next.filter(v => v !== '全て');
                                                next.push(opt.value);
                                            }
                                        }
                                        return { ...prev, style: next };
                                    });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5
                                    ${isActive
                                        ? 'bg-indigo-500 text-white shadow-lg scale-105'
                                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/80'
                                    }`}
                            >
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Rarity filter */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">初期レア</label>
                <div className="flex flex-wrap gap-2">
                    {[{ value: '全て', label: '全て' }, { value: '★4', label: '★4' }, { value: '★3', label: '★3' }, { value: '★2', label: '★2' }].map(opt => {
                        const isActive = filter.rarity.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                id={`filter-rarity-${opt.value}`}
                                onClick={() => {
                                    setFilter(prev => {
                                        let next = [...prev.rarity];
                                        if (opt.value === '全て') {
                                            next = ['全て'];
                                        } else {
                                            if (next.includes(opt.value)) {
                                                next = next.filter(v => v !== opt.value);
                                                if (next.length === 0) next = ['全て'];
                                            } else {
                                                next = next.filter(v => v !== '全て');
                                                next.push(opt.value);
                                            }
                                        }
                                        return { ...prev, rarity: next };
                                    });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
                                    ${isActive
                                        ? 'bg-amber-500 text-white shadow-lg scale-105'
                                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/80'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
