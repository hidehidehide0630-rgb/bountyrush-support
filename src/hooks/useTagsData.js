import { useState, useEffect } from 'react';

export function useTagsData() {
    const [tagsData, setTagsData] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(true);
    const [tagsError, setTagsError] = useState(null);

    useEffect(() => {
        fetch('./tags_data.json')
            .then(res => {
                if (!res.ok) throw new Error('タグデータの読み込みに失敗しました');
                return res.json();
            })
            .then(data => {
                setTagsData(data);
                setTagsLoading(false);
            })
            .catch(err => {
                setTagsError(err.message);
                setTagsLoading(false);
            });
    }, []);

    return { tagsData, tagsLoading, tagsError };
}
