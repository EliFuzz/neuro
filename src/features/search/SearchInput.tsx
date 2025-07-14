import React, { useEffect, useRef } from 'react';

interface SearchInputProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ searchTerm, onSearchChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);
 
    return (
        <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchTerm}
            onChange={({target: {value}}) => onSearchChange(value)}
        />
    );
};

export default SearchInput;
