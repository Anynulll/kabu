import React, { useState, useEffect, useCallback } from 'react';
import { NewsItem, NewsCategory } from './types';
import NewsList from './components/NewsList';
import FilterBar from './components/FilterBar';
import { Globe, TrendingUp } from 'lucide-react';

const API_URL = '/api/top-headlines?country=us&category=business';
const POLLING_INTERVAL = 60000; // 1 minute
const MAX_CACHED_NEWS = 50;

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}&apiKey=${import.meta.env.VITE_NEWS_API_KEY}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const formattedNews: NewsItem[] = data.articles.map((article: any, index: number) => ({
        id: article.url,
        title: article.title,
        description: article.description,
        url: article.url,
        country: article.source.name || 'Unknown',
        category: mapToNewsCategory(article.source.category),
        symbol: extractSymbol(article.title),
        date: new Date(article.publishedAt).toLocaleDateString(),
      }));

      setNews((prevNews) => {
        const newNews = formattedNews.filter((item) => !prevNews.some((prevItem) => prevItem.id === item.id));
        const updatedNews = [...newNews, ...prevNews].slice(0, MAX_CACHED_NEWS);
        return updatedNews;
      });

      setLastUpdated(new Date());

      const uniqueCountries = Array.from(new Set(formattedNews.map((item) => item.country)));
      const uniqueCategories = Array.from(new Set(formattedNews.map((item) => item.category))) as NewsCategory[];
      const uniqueSymbols = Array.from(new Set(formattedNews.map((item) => item.symbol).filter(Boolean)));

      setCountries(uniqueCountries);
      setCategories(uniqueCategories);
      setSymbols(uniqueSymbols as string[]);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Failed to fetch news. Displaying previous news.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const intervalId = setInterval(fetchNews, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchNews]);

  useEffect(() => {
    setFilteredNews(news);
  }, [news]);

  const handleFilterChange = (type: 'country' | 'category' | 'symbol', value: string) => {
    setFilteredNews(news.filter((item) => {
      if (type === 'country' && value !== '') {
        return item.country === value;
      }
      if (type === 'category' && value !== '') {
        return item.category === value;
      }
      if (type === 'symbol' && value !== '') {
        return item.symbol === value;
      }
      return true;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Globe className="mr-2" />
            <TrendingUp className="mr-2" />
            <h1 className="text-2xl font-bold">Global Investment News</h1>
          </div>
          {lastUpdated && (
            <div className="text-sm">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto py-8">
        <FilterBar
          countries={countries}
          categories={categories}
          symbols={symbols}
          onFilterChange={handleFilterChange}
        />
        {isLoading && news.length === 0 ? (
          <div className="text-center">Loading...</div>
        ) : error ? (
          <div>
            <div className="text-center text-red-500 mb-4">{error}</div>
            {news.length > 0 && <NewsList news={filteredNews} />}
          </div>
        ) : (
          <NewsList news={filteredNews} />
        )}
      </main>
    </div>
  );
};

const mapToNewsCategory = (category: string): NewsCategory => {
  const categoryMap: { [key: string]: NewsCategory } = {
    'business': 'Stocks',
    'economy': 'Bonds',
    'commodities': 'Commodities',
    'forex': 'Forex',
    'cryptocurrency': 'Crypto',
  };
  return categoryMap[category.toLowerCase()] || 'Stocks';
};

const extractSymbol = (title: string): string | undefined => {
  const symbolRegex = /\(([A-Z]+)\)/;
  const match = title.match(symbolRegex);
  return match ? match[1] : undefined;
};

export default App;