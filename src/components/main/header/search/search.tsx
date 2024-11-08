import React, { useState } from 'react';
import './search.styles.css';

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Пошуковий запит:', query);

  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className={`search-wrapper ${isOpen ? 'open' : ''}`}>
      <input
        type="text"
        className="search-input"
        placeholder="Пошук"
        value={query}
        onChange={handleChange}
        onBlur={() => setIsOpen(false)} 
      />
      <svg
        className="search-icon"
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onClick={handleToggle}
      >
        <path
          d="M21 21L16.65 16.65M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}