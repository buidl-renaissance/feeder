import styled from 'styled-components';
import { useState, useEffect } from 'react';
import ContentCard from './ContentCard';
import FilterBar from './FilterBar';
import { ContentObject } from '@/types/content';

const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FeedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1e293b;
  margin: 0;
`;

const RefreshButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const ContentGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #64748b;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #dc2626;
  background-color: #fef2f2;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #64748b;
`;

interface FeedViewProps {
  initialContent?: ContentObject[];
}

export default function FeedView({ initialContent = [] }: FeedViewProps) {
  const [content, setContent] = useState<ContentObject[]>(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    sourceId: '',
    status: '',
  });

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.sourceId) params.append('sourceId', filters.sourceId);
      if (filters.status) params.append('status', filters.status);
      
      const response = await fetch(`/api/content?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch content');
      
      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [filters]);

  // Trigger fetch on page load with debounce
  useEffect(() => {
    const triggerPageLoadFetch = async () => {
      try {
        // Check if we should trigger a fetch (debounce logic)
        const response = await fetch('/api/sources/refresh-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ trigger: 'page-load' }),
        });

        if (response.ok) {
          console.log('Page load fetch triggered');
        }
      } catch (error) {
        console.error('Error triggering page load fetch:', error);
      }
    };

    // Debounce: only trigger if no recent fetch
    const lastFetch = localStorage.getItem('lastPageLoadFetch');
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (!lastFetch || (now - parseInt(lastFetch)) > oneMinute) {
      triggerPageLoadFetch();
      localStorage.setItem('lastPageLoadFetch', now.toString());
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger refresh all sources
      const response = await fetch('/api/sources/refresh-all', {
        method: 'POST',
      });

      if (response.ok) {
        // Wait a moment for the fetch to complete, then refresh content
        setTimeout(async () => {
          await fetchContent();
        }, 2000);
      } else {
        // If refresh all fails, just fetch current content
        await fetchContent();
      }
    } catch (error) {
      console.error('Error refreshing sources:', error);
      // Fallback to just fetching current content
      await fetchContent();
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <FeedContainer>
        <ErrorState>
          <h3>Error loading content</h3>
          <p>{error}</p>
          <RefreshButton onClick={handleRefresh}>Try Again</RefreshButton>
        </ErrorState>
      </FeedContainer>
    );
  }

  return (
    <FeedContainer>
      <FeedHeader>
        <Title>Content Feed</Title>
        <RefreshButton onClick={handleRefresh} disabled={loading || refreshing}>
          {loading ? 'Loading...' : refreshing ? 'Refreshing...' : 'Refresh'}
        </RefreshButton>
      </FeedHeader>
      
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      
      {loading && content.length === 0 ? (
        <LoadingState>Loading content...</LoadingState>
      ) : content.length === 0 ? (
        <EmptyState>
          <h3>No content found</h3>
          <p>Try adjusting your filters or add some sources.</p>
        </EmptyState>
      ) : (
        <ContentGrid>
          {content.map((item) => (
            <ContentCard key={item.id} content={item} />
          ))}
        </ContentGrid>
      )}
    </FeedContainer>
  );
}
