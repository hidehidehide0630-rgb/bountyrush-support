import { useState, useEffect, useMemo, useRef } from 'react';

const TEAM_SIZE = 10;
const RECOMMENDATION_COUNT = 3;
const INITIAL_TEAM_ITERATIONS = 30;
const MAX_HILL_CLIMBING_ROUNDS = 5;

// ========================================
// サポート％計算用定数
// ========================================
const SUPPORT_PERCENTAGES = {
    4: { match: 16.1, unmatch: 13.4 },
    3: { match: 15.1, unmatch: 12.6 },
    2: { match: 14.1, unmatch: 11.8 },
    // 例外処理用（データ欠損時など）
    default: { match: 15.0, unmatch: 12.0 }
};

// ========================================
// キャラ優先度算出
// ========================================
function getCharPriority(c) {
    if (c.rarity === 4 && c.obtain_type === '恒常') return 4;
    if ((c.rarity === 4 && c.obtain_type === 'フェス限') || c.rarity === 3) return 3;
    if (c.rarity === 2) return 2;
    return 1; // 超フェス等
}

// ========================================
// 評価関数（Score）— フル計算版
// ========================================
function evaluateTeam(team, selectedTags, selectedAttr, selectedTagSet) {
    const tagCounts = {};
    let attrMatchCount = 0;
    let priorityScore = 0;
    let totalTagsCount = 0;
    let supportScore = 0; // 追加: サポート%の合計をスコア化

    for (let i = 0; i < team.length; i++) {
        const c = team[i];
        const tags = c.tags;
        for (let j = 0; j < tags.length; j++) {
            tagCounts[tags[j]] = (tagCounts[tags[j]] || 0) + 1;
        }
        if (c.attr === selectedAttr) {
            attrMatchCount++;
        }

        // サポート%を計算
        const stats = SUPPORT_PERCENTAGES[c.rarity] || SUPPORT_PERCENTAGES.default;
        const pct = (c.attr === selectedAttr) ? stats.match : stats.unmatch;
        supportScore += pct;

        priorityScore += c._priority;
        totalTagsCount += tags.length;
    }

    let selectedTagsMaxed = 0;
    let selectedTagsSum = 0;
    for (let i = 0; i < selectedTags.length; i++) {
        const count = tagCounts[selectedTags[i]] || 0;
        if (count >= 6) selectedTagsMaxed++;
        selectedTagsSum += Math.min(count, 6);
    }

    let unselectedTagsMaxed = 0;
    const allTagKeys = Object.keys(tagCounts);
    for (let i = 0; i < allTagKeys.length; i++) {
        const tag = allTagKeys[i];
        if (!selectedTagSet.has(tag) && tagCounts[tag] >= 6) {
            unselectedTagsMaxed++;
        }
    }

    // supportScore を二次評価基準として追加（少数第一位までの値なので10倍して整数化）
    const score =
        selectedTagsMaxed * 10000000 +
        selectedTagsSum * 1000000 +
        attrMatchCount * 100000 +
        Math.floor(supportScore * 10) * 10000 + // <-- 今回追加：サポート%の高さ
        unselectedTagsMaxed * 1000 +
        totalTagsCount * 10 +
        priorityScore;

    return { score, tagCounts, selectedTagsMaxed, unselectedTagsMaxed, attrMatchCount, priorityScore, totalTagsCount, supportScore };
}

// ========================================
// 差分スコア計算 — Hill Climbing 高速化用
// ========================================
function evaluateSwapDelta(currentTagCounts, currentScore, removedChar, addedChar, selectedTags, selectedTagSet, selectedAttr) {
    // 差分でtagCountsの変化を計算し、スコア変動を算出する
    // 新しいtagCountsを作る代わりに、影響するタグだけ計算する

    // 属性の差分
    let attrDelta = 0;
    if (removedChar.attr === selectedAttr && addedChar.attr !== selectedAttr) attrDelta = -1;
    else if (removedChar.attr !== selectedAttr && addedChar.attr === selectedAttr) attrDelta = 1;

    // 優先度の差分
    const priorityDelta = addedChar._priority - removedChar._priority;

    // タグ数の差分
    const totalTagsDelta = addedChar.tags.length - removedChar.tags.length;

    // 影響するタグを集める（除去キャラのタグ + 追加キャラのタグ）
    const affectedTags = new Set();
    for (const t of removedChar.tags) affectedTags.add(t);
    for (const t of addedChar.tags) affectedTags.add(t);

    // 指定タグMAX数と未指定タグMAX数の差分を計算
    let selectedMaxedDelta = 0;
    let selectedSumDelta = 0;
    let unselectedMaxedDelta = 0;

    for (const tag of affectedTags) {
        const oldCount = currentTagCounts[tag] || 0;
        let newCount = oldCount;

        if (removedChar.tags.includes(tag)) newCount--;
        if (addedChar.tags.includes(tag)) newCount++;

        const wasMaxed = oldCount >= 6;
        const isMaxed = newCount >= 6;

        if (selectedTagSet.has(tag)) {
            if (wasMaxed !== isMaxed) {
                selectedMaxedDelta += isMaxed ? 1 : -1;
            }
            const oldSum = Math.min(oldCount, 6);
            const newSum = Math.min(newCount, 6);
            selectedSumDelta += (newSum - oldSum);
        } else {
            if (wasMaxed !== isMaxed) {
                unselectedMaxedDelta += isMaxed ? 1 : -1;
            }
        }
    }

    // サポートスコアの差分計算
    let supportDelta = 0;
    const removedStats = SUPPORT_PERCENTAGES[removedChar.rarity] || SUPPORT_PERCENTAGES.default;
    const removedPct = (removedChar.attr === selectedAttr) ? removedStats.match : removedStats.unmatch;

    const addedStats = SUPPORT_PERCENTAGES[addedChar.rarity] || SUPPORT_PERCENTAGES.default;
    const addedPct = (addedChar.attr === selectedAttr) ? addedStats.match : addedStats.unmatch;
    supportDelta = addedPct - removedPct;

    const scoreDelta =
        selectedMaxedDelta * 10000000 +
        selectedSumDelta * 1000000 +
        attrDelta * 100000 +
        Math.floor(supportDelta * 10) * 10000 + // <-- 今回追加
        unselectedMaxedDelta * 1000 +
        totalTagsDelta * 10 +
        priorityDelta;

    return currentScore + scoreDelta;
}

// ========================================
// 欲張り法による初期チーム構築
// ========================================
function buildInitialTeam(ownedCharacters, selectedTags, selectedAttr, iterIndex) {
    const team = [];
    const used = new Set();

    const tagNeeds = {};
    selectedTags.forEach(tag => { tagNeeds[tag] = 6; });

    const scoredCandidates = ownedCharacters.map(c => {
        let primaryScore = 0;
        for (let i = 0; i < selectedTags.length; i++) {
            if (c._tagSet.has(selectedTags[i])) primaryScore++;
        }

        const attrBonus = (c.attr === selectedAttr) ? 1 : 0;
        const tagBreadth = c.tags.length;
        const noise = ((c.id * 997 + iterIndex * 31) % 1000) / 10000;

        return {
            char: c,
            sortScore: primaryScore * 10000000 + attrBonus * 100000 + tagBreadth * 1000 + c._priority * 100 + noise,
        };
    });

    scoredCandidates.sort((a, b) => b.sortScore - a.sortScore);

    const shuffleRange = Math.min(20, Math.floor(scoredCandidates.length * 0.3));
    if (iterIndex > 0 && shuffleRange > 2) {
        for (let s = 0; s < shuffleRange - 1; s++) {
            const swapIdx = s + ((iterIndex * 7 + s * 13) % (shuffleRange - s));
            if (swapIdx < scoredCandidates.length && swapIdx !== s) {
                [scoredCandidates[s], scoredCandidates[swapIdx]] =
                    [scoredCandidates[swapIdx], scoredCandidates[s]];
            }
        }
    }

    // Phase 1: 指定属性 + 指定タグ貢献
    for (const { char: c } of scoredCandidates) {
        if (team.length >= TEAM_SIZE) break;
        if (used.has(c.id)) continue;
        if (c.attr !== selectedAttr) continue;
        const contributes = selectedTags.some(tag => (tagNeeds[tag] || 0) > 0 && c._tagSet.has(tag));
        if (!contributes) continue;
        team.push(c);
        used.add(c.id);
        c.tags.forEach(tag => { if (tagNeeds[tag] !== undefined) tagNeeds[tag]--; });
    }

    // Phase 2: 属性問わず指定タグ貢献
    for (const { char: c } of scoredCandidates) {
        if (team.length >= TEAM_SIZE) break;
        if (used.has(c.id)) continue;
        const contributes = selectedTags.some(tag => (tagNeeds[tag] || 0) > 0 && c._tagSet.has(tag));
        if (!contributes) continue;
        team.push(c);
        used.add(c.id);
        c.tags.forEach(tag => { if (tagNeeds[tag] !== undefined) tagNeeds[tag]--; });
    }

    // Phase 3: 残りスロット
    for (const { char: c } of scoredCandidates) {
        if (team.length >= TEAM_SIZE) break;
        if (used.has(c.id)) continue;
        team.push(c);
        used.add(c.id);
    }

    return team;
}

// ========================================
// 局所探索（Hill Climbing）— 差分評価で高速化
// ========================================
function localSearch(initialTeam, ownedCharacters, selectedTags, selectedAttr, selectedTagSet) {
    let currentTeam = [...initialTeam];
    let currentEval = evaluateTeam(currentTeam, selectedTags, selectedAttr, selectedTagSet);
    let currentScore = currentEval.score;
    let currentTagCounts = { ...currentEval.tagCounts };

    const teamIdSet = new Set(currentTeam.map(c => c.id));
    const candidatePool = ownedCharacters.filter(c => !teamIdSet.has(c.id));

    for (let round = 0; round < MAX_HILL_CLIMBING_ROUNDS; round++) {
        let improved = false;

        for (let i = 0; i < currentTeam.length; i++) {
            let bestSwapScore = currentScore;
            let bestSwapCandidate = null;
            const removedChar = currentTeam[i];

            for (let j = 0; j < candidatePool.length; j++) {
                const candidate = candidatePool[j];
                // チームに既にいるか（Setで高速チェック）
                if (teamIdSet.has(candidate.id)) continue;

                const newScore = evaluateSwapDelta(
                    currentTagCounts, currentScore,
                    removedChar, candidate,
                    selectedTags, selectedTagSet, selectedAttr
                );

                if (newScore > bestSwapScore) {
                    bestSwapScore = newScore;
                    bestSwapCandidate = candidate;
                }
            }

            if (bestSwapCandidate) {
                // tagCountsを差分更新
                for (const tag of removedChar.tags) {
                    currentTagCounts[tag]--;
                    if (currentTagCounts[tag] === 0) delete currentTagCounts[tag];
                }
                for (const tag of bestSwapCandidate.tags) {
                    currentTagCounts[tag] = (currentTagCounts[tag] || 0) + 1;
                }

                // IDセットを更新
                teamIdSet.delete(removedChar.id);
                teamIdSet.add(bestSwapCandidate.id);

                // 候補プールを更新
                candidatePool.push(removedChar);
                const candIdx = candidatePool.indexOf(bestSwapCandidate);
                if (candIdx !== -1) candidatePool.splice(candIdx, 1);

                currentTeam[i] = bestSwapCandidate;
                currentScore = bestSwapScore;
                improved = true;
            }
        }

        if (!improved) break;
    }

    // 最終結果はフル評価で正確なスコアを返す
    const finalEval = evaluateTeam(currentTeam, selectedTags, selectedAttr, selectedTagSet);
    return { team: currentTeam, evaluation: finalEval };
}

// ========================================
// メインフック
// ========================================
export function useTeamBuilder(characters, ownedIds, tagsData, selectedAttr, selectedTags) {
    const [recommendations, setRecommendations] = useState([]);
    const abortRef = useRef(null);

    const ownedCharacters = useMemo(() => {
        // _priority と _tagSet をキャッシュ
        return characters.filter(c => ownedIds.has(c.id)).map(c => {
            if (!c._priority) c._priority = getCharPriority(c);
            if (!c._tagSet) c._tagSet = new Set(c.tags);
            return c;
        });
    }, [characters, ownedIds]);

    useEffect(() => {
        if (!ownedCharacters.length || selectedTags.length === 0) {
            setRecommendations([]);
            return;
        }

        // 前回の非同期処理をキャンセル
        if (abortRef.current) abortRef.current.cancelled = true;
        const controller = { cancelled: false };
        abortRef.current = controller;

        const selectedTagSet = new Set(selectedTags);

        // 非同期で実行してUIスレッドを解放
        const timeoutId = setTimeout(() => {
            if (controller.cancelled) return;

            try {
                const results = [];

                for (let i = 0; i < INITIAL_TEAM_ITERATIONS; i++) {
                    const initialTeam = buildInitialTeam(ownedCharacters, selectedTags, selectedAttr, i);
                    if (initialTeam.length === 0) continue;

                    const { team, evaluation } = localSearch(initialTeam, ownedCharacters, selectedTags, selectedAttr, selectedTagSet);

                    const maxedTags = Object.entries(evaluation.tagCounts)
                        .filter(([, count]) => count >= 6)
                        .map(([tag]) => tag)
                        .sort()
                        .join('|');

                    results.push({
                        team,
                        tagCounts: evaluation.tagCounts,
                        score: evaluation.score,
                        selectedTagsMaxed: evaluation.selectedTagsMaxed,
                        unselectedTagsMaxed: evaluation.unselectedTagsMaxed,
                        attrMatchCount: evaluation.attrMatchCount,
                        priorityScore: evaluation.priorityScore,
                        totalTagsCount: evaluation.totalTagsCount,
                        supportScore: evaluation.supportScore, // 算出したサポート%を追加
                        signature: maxedTags,
                    });
                }

                if (controller.cancelled) return;

                const uniqueMap = new Map();
                for (const r of results) {
                    if (!uniqueMap.has(r.signature) || r.score > uniqueMap.get(r.signature).score) {
                        uniqueMap.set(r.signature, r);
                    }
                }

                let uniqueTeams = Array.from(uniqueMap.values());

                if (selectedTags.length > 0) {
                    const validTeams = uniqueTeams.filter(t =>
                        selectedTags.every(tag => (t.tagCounts[tag] || 0) >= 6)
                    );
                    if (validTeams.length > 0) {
                        uniqueTeams = validTeams;
                    }
                }

                uniqueTeams.sort((a, b) => b.score - a.score);
                uniqueTeams = uniqueTeams.slice(0, RECOMMENDATION_COUNT);

                // --- コンソールログ出力 ---
                console.group('🏴‍☠️ サポート編成結果');
                uniqueTeams.forEach((t, idx) => {
                    console.group(`編成案 ${idx + 1} (Score: ${t.score.toLocaleString()}, サポート: ${t.supportScore.toFixed(1)}%)`);
                    console.log(`指定タグ: ${t.selectedTagsMaxed}, 未指定タグ: ${t.unselectedTagsMaxed}, 属性一致: ${t.attrMatchCount}, 総タグ数: ${t.totalTagsCount}, 優先度: ${t.priorityScore}`);
                    console.log('選出キャラ:', t.team.map(c => `${c.name}(${c.attr}/${c.style}/${c.tags.length}tags)`).join(', '));
                    console.table(
                        Object.entries(t.tagCounts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([tag, count]) => ({
                                タグ: tag,
                                カウント: count,
                                'Lv.600達成': count >= 6 ? '✅' : '❌',
                                指定タグ: selectedTagSet.has(tag) ? '⭐' : '',
                            }))
                    );
                    console.groupEnd();
                });
                console.groupEnd();

                // UI表示用フォーマット
                const formattedRecommendations = uniqueTeams.map(t => {
                    const team = t.team;

                    team.forEach(c => {
                        c.matchingTags = selectedTags.filter(tag => c._tagSet.has(tag));
                        c.matchCount = c.matchingTags.length;
                    });

                    const activatedTags = {};
                    team.forEach(member => {
                        member.tags.forEach(tag => {
                            activatedTags[tag] = (activatedTags[tag] || 0) + 100;
                        });
                    });

                    const tagEffects = [];
                    if (tagsData && tagsData.length > 0) {
                        Object.entries(activatedTags).forEach(([tagName, level]) => {
                            const cappedLevel = Math.min(level, 600);
                            const tagInfo = tagsData.find(tg => tg.name === tagName);

                            if (tagInfo && tagInfo.effects && tagInfo.effects.length > 0) {
                                const validEffects = tagInfo.effects.filter(e => e.req_level <= cappedLevel);
                                if (validEffects.length > 0) {
                                    validEffects.sort((a, b) => b.stage - a.stage);
                                    const highestEffect = validEffects[0];

                                    tagEffects.push({
                                        name: tagName,
                                        level: cappedLevel,
                                        stage: highestEffect.stage,
                                        description: highestEffect.description,
                                        isSelected: selectedTagSet.has(tagName),
                                    });
                                }
                            }
                        });

                        tagEffects.sort((a, b) => {
                            if (a.isSelected && !b.isSelected) return -1;
                            if (!a.isSelected && b.isSelected) return 1;
                            if (b.level !== a.level) return b.level - a.level;
                            return a.name.localeCompare(b.name);
                        });
                    }

                    return { team, tagEffects, totalSupportPercent: t.supportScore }; // totalSupportPercentとして返却
                });

                if (!controller.cancelled) {
                    setRecommendations(formattedRecommendations);
                }
            } catch (error) {
                console.error('Team generation failed:', error);
                if (!controller.cancelled) {
                    setRecommendations([]);
                }
            }
        }, 0);

        return () => {
            controller.cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [ownedCharacters, selectedAttr, selectedTags, tagsData]);

    return {
        recommendations,
    };
}
