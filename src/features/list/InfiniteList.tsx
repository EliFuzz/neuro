import React, { useEffect, useRef } from 'react';
import './InfiniteList.css';

interface InfiniteListProps {
    items: string[];
    loading: boolean;
    onScrollEnd: () => void;
    selectedItemIndex: number;
    listItemRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
}

const InfiniteList: React.FC<InfiniteListProps> = ({ items, loading, onScrollEnd, selectedItemIndex, listItemRefs }) => {
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

    useEffect(() => {
      listItemRefs.current = listItemRefs.current.slice(0, items.length);
    }, [items]);

    return (
        <div className="list-section" ref={listRef}>
            {items.map((item, index) => (
                <div
                    key={index}
                    className={`list-item ${index === selectedItemIndex ? 'selected' : ''}`}
                    ref={(el) => (listItemRefs.current[index] = el)}
                >
                    {item}
                </div>
            ))}
            {loading && <div className="loading">Loading more items...</div>}
        </div>
    );
};

export default InfiniteList;
