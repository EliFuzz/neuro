import React from 'react';
import './SearchInput.css';

interface SearchInputProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

const SearchInput: React.FC<SearchInputProps> = ({ searchTerm, onSearchChange, inputRef }) => { 
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
