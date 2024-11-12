import React, { useState, useRef, useEffect } from 'react';
import './search.styles.css';
import { IPerfomance } from '@/app/types/perfomance';
import { searchPerformances } from '@/app/services/filmService';
import { useRouter } from 'next/navigation';

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IPerfomance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const results = await searchPerformances(query, 'title');
          setSearchResults(results);
        } catch (error) {
          console.error('Помилка пошуку:', error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleIconClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => {
        const input = document.querySelector('.search-input') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    } else {
      setQuery('');
      setSearchResults([]);
    }
  };

  const handleResultClick = (performanceId: number) => {
    router.push(`/performances/${performanceId}`);
    setIsOpen(false);
    setQuery('');
    setSearchResults([]);
  };

  return (
    <div className="search-container" ref={searchContainerRef}>
      <div className={`search-wrapper ${isOpen ? 'open' : ''}`}>
        <input
          type="text"
          className="search-input"
          placeholder="Пошук вистав..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <svg
          className="search-icon"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          onClick={handleIconClick}
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

      {isOpen && query.length >= 2 && (
        <div className="search-results">
          {isLoading ? (
            <div className="search-loading">Пошук...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result) => (
              <div 
                key={result.id} 
                className="search-result-item"
                onClick={() => handleResultClick(Number(result.id))}
              >
                <img src={result.image} alt={result.title} />
                <div className="result-info">
                  <h4>{result.title}</h4>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">Нічого не знайдено</div>
          )}
        </div>
      )}
    </div>
  );
}