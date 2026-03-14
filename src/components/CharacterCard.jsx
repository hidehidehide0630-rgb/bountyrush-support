import { memo } from 'react';

const ATTR_COLORS = {
    '赤': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400', glow: 'shadow-red-500/20' },
    '青': { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    '緑': { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400', glow: 'shadow-green-500/20' },
    '黒': { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    '白': { bg: 'bg-stone-100', border: 'border-stone-100', text: 'text-stone-300', glow: 'shadow-stone-100/20' },
    '不明': { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-400', glow: 'shadow-slate-500/20' },
};

const STYLE_ICONS = {
    'アタッカー': <img src="./attacker.png" alt="アタッカー" className="w-4 h-4 object-contain inline-block drop-shadow-md" />,
    'ディフェンダー': <img src="./defender.png" alt="ディフェンダー" className="w-4 h-4 object-contain inline-block drop-shadow-md" />,
    'ゲッター': <img src="./getter.png" alt="ゲッター" className="w-4 h-4 object-contain inline-block drop-shadow-md" />,
    '不明': '❓',
};

function CharacterCard({ character, isOwned, onToggle }) {
    const colors = ATTR_COLORS[character.attr] || ATTR_COLORS['不明'];

    return (
        <div
            id={`char-${character.id}`}
            className={`char-card relative cursor-pointer rounded-xl border-2 overflow-hidden
        ${isOwned ? `owned ${colors.border} shadow-lg ${colors.glow}` : 'not-owned border-slate-700/50'}
      `}
            onClick={() => onToggle(character.id)}
            title={`${character.name}\n${character.attr} / ${character.style}\nタグ: ${character.tags.join(', ')}`}
        >


            {/* Style badge */}
            <div className="absolute top-1.5 right-1.5 z-10 text-sm">
                {STYLE_ICONS[character.style] || '❓'}
            </div>

            {/* Character icon */}
            <div className="aspect-square bg-slate-800/60 flex items-center justify-center overflow-hidden">
                <img
                    src={character.icon}
                    alt={character.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    crossOrigin="anonymous"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
                <div className="hidden w-full h-full items-center justify-center text-2xl text-slate-500">
                    {character.name[0]}
                </div>
            </div>

            {/* Name */}
            <div className="px-1.5 py-1.5 text-center">
                <p className="text-[11px] font-semibold leading-tight truncate text-slate-200">
                    {character.name}
                </p>
            </div>

            {/* Ownership indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 
        ${isOwned ? colors.bg : 'bg-transparent'}`}
            />
        </div>
    );
}

export default memo(CharacterCard);
