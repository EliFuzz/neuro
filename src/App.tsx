import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import BottomIcons from "./features/footer/BottomIcons";
import InfiniteList from "./features/list/InfiniteList";
import SearchInput from "./features/search/SearchInput";

function App() {
  const [theme, setTheme] = useState('dark');
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const allItems = useRef<string[]>([]);

  useEffect(() => {
    document.body.className = theme === 'dark' ? '' : 'light-theme';
  }, [theme]);

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const generateItems = (count: number, offset: number) => {
      return Array.from({ length: count }, (_, i) => `Item ${i + offset}`);
    };
    allItems.current = generateItems(1000, 1);

    setItems(allItems.current.slice(0, 50));
  }, []);

  const filteredItems = items.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <SearchInput searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <InfiniteList
        items={filteredItems}
        loading={loading}
        onScrollEnd={loadMoreItems}
      />
      <BottomIcons onToggleTheme={toggleTheme} />
    </main>
  );
}

export default App;
