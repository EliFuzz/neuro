import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import BottomIcons from "./features/footer/BottomIcons";
import InfiniteList from "./features/list/InfiniteList";
import SearchInput from "./features/search/SearchInput";

function App() {
  const [theme, setTheme] = useState('dark');
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setSelectedItemIndex(-1);
  };
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const allItems = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const listItemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const filteredItems = items.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    document.body.className = theme === 'dark' ? '' : 'light-theme';
  }, [theme]);

  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.focus();
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const win = getCurrentWindow();
    let unlistenFn: (() => void) | undefined;

    win.onFocusChanged(() =>{}).then((unlistener) => {
      unlistenFn = unlistener;
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchTerm('');
        win.hide();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (filteredItems.length > 0) {
          setSelectedItemIndex((prevIndex) => {
            const nextIndex = Math.min(prevIndex + 1, filteredItems.length - 1);
            setTimeout(() => {
              listItemRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 0);
            return nextIndex;
          });
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedItemIndex((prevIndex) => {
          const nextIndex = Math.max(prevIndex - 1, -1);
          if (nextIndex === -1 && inputRef.current) {
            inputRef.current.focus();
          } else {
            setTimeout(() => {
              listItemRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 0);
          }
          return nextIndex;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredItems]);

  useEffect(() => {
    const generateItems = (count: number, offset: number) => {
      return Array.from({ length: count }, (_, i) => `Item ${i + offset}`);
    };
    allItems.current = generateItems(1000, 1);

    setItems(allItems.current.slice(0, 50));
  }, []);

  const loadMoreItems = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const currentLength = items.length;
      const nextBatch = allItems.current.slice(currentLength, currentLength + 20);
      setItems((prevItems) => [...prevItems, ...nextBatch]);
      setLoading(false);
    }, 500);
  }, [loading, items]);

  return (
    <main className="container">
      <SearchInput searchTerm={searchTerm} onSearchChange={handleSearchChange} inputRef={inputRef} />
      <InfiniteList
        items={filteredItems}
        loading={loading}
        onScrollEnd={loadMoreItems}
        selectedItemIndex={selectedItemIndex}
        listItemRefs={listItemRefs}
      />
      <BottomIcons onToggleTheme={toggleTheme} />
    </main>
  );
}

export default App;
