import { useState, useEffect } from 'react';

const STORAGE_KEY = 'bountyrush_saved_teams';

// サポート編成のローカル保存機能を提供するカスタムフック
export function useSavedTeams() {
    const [savedTeams, setSavedTeams] = useState([]);

    // 初期マウント時にローカルストレージから読み込み
    useEffect(() => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                setSavedTeams(JSON.parse(data));
            }
        } catch (error) {
            console.error('保存した編成の読み込みに失敗しました:', error);
        }
    }, []);

    // チームの保存処理
    const saveTeam = (teamInfo) => {
        try {
            const newTeam = {
                id: Date.now().toString(), // 一意のID
                timestamp: new Date().toISOString(),
                team: teamInfo.team,
                tagEffects: teamInfo.tagEffects,
                selectedAttr: teamInfo.selectedAttr || '不明',
                totalSupport: teamInfo.totalSupport || 0,
                tagTotalLevel: teamInfo.tagTotalLevel || 0
            };

            const updatedTeams = [newTeam, ...savedTeams];
            // 最大20件まで保存（古いものから消える）
            const trimmedTeams = updatedTeams.slice(0, 20);

            setSavedTeams(trimmedTeams);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedTeams));
            return true;
        } catch (error) {
            console.error('編成の保存に失敗しました:', error);
            return false;
        }
    };

    // 保存したチームの削除処理
    const deleteTeam = (id) => {
        try {
            const updatedTeams = savedTeams.filter(t => t.id !== id);
            setSavedTeams(updatedTeams);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTeams));
        } catch (error) {
            console.error('編成の削除に失敗しました:', error);
        }
    };

    return {
        savedTeams,
        saveTeam,
        deleteTeam
    };
}
