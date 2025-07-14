import React, { useEffect, useRef } from 'react';

interface InfiniteListProps {
    items: string[];
    loading: boolean;
    onScrollEnd: () => void;
}

const InfiniteList: React.FC<InfiniteListProps> = ({ items, loading, onScrollEnd }) => {
    const listRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (listRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 50 && !loading) {
                onScrollEnd();
            }
        }
    };

    useEffect(() => {
        const listElement = listRef.current;
        if (listElement) {
            listElement.addEventListener("scroll", handleScroll);
            return () => {
                listElement.removeEventListener("scroll", handleScroll);
            };
        }
    }, [items, loading, onScrollEnd]);

    return (
        <div className="list-section" ref={listRef}>
            {items.map((item, index) => (
                <div key={index} className="list-item">
                    {item}
                </div>
            ))}
            {loading && <div className="loading">Loading more items...</div>}
        </div>
    );
};

export default InfiniteList;
