export default function TagSelector({ allTags, tagsData, selectedTags, onToggle, onClear }) {
    // Group tags dynamically using category from tagsData
    const categoriesMap = new Map();
    // Pre-initialize preferred order categories
    categoriesMap.set('スタイル', []);
    categoriesMap.set('エリア', []);

    allTags.forEach(tag => {
        let categoryName = 'その他';
        if (tagsData) {
            const tagObj = tagsData.find(t => t.name === tag);
            if (tagObj && tagObj.category && tagObj.category.trim() !== '') {
                categoryName = tagObj.category;
            }
        }

        if (!categoriesMap.has(categoryName)) {
            categoriesMap.set(categoryName, []);
        }
        categoriesMap.get(categoryName).push(tag);
    });

    const tagGroups = [];
    const preferredOrder = ['スタイル', 'エリア'];

    // Add preferred categories first
    preferredOrder.forEach(cat => {
        if (categoriesMap.has(cat) && categoriesMap.get(cat).length > 0) {
            tagGroups.push({ label: cat, tags: [...categoriesMap.get(cat)] });
        }
        categoriesMap.delete(cat);
    });

    // Extract "その他" to put it at the very end
    const otherTags = categoriesMap.has('その他') ? categoriesMap.get('その他') : [];
    categoriesMap.delete('その他');

    // Add remaining categories in alphabetical order
    Array.from(categoriesMap.keys()).sort().forEach(cat => {
        if (categoriesMap.get(cat).length > 0) {
            tagGroups.push({ label: cat, tags: [...categoriesMap.get(cat)] });
        }
    });

    if (otherTags.length > 0) {
        tagGroups.push({ label: 'その他', tags: [...otherTags] });
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    重視するタグ（スタイル等は1つまで）
                </label>
                {selectedTags.length > 0 && (
                    <button
                        onClick={onClear}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        クリア ({selectedTags.length})
                    </button>
                )}
            </div>

            {tagGroups.map(group => (
                group.tags.length > 0 && (
                    <div key={group.label} className="space-y-1.5">
                        <p className="text-[10px] font-medium text-slate-500 pl-1">{group.label}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {group.tags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => onToggle(tag)}
                                    className={`tag-chip px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200
                    ${selectedTags.includes(tag)
                                            ? 'selected'
                                            : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/80 border border-slate-600/40'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}
