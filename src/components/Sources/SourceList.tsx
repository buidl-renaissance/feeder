import styled from 'styled-components';
import { useState, useEffect } from 'react';
import SourceForm from './SourceForm';
import { Source } from '@/db/schema';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #1e293b;
  margin: 0;
`;

const AddButton = styled.button`
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
`;

const SourcesGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
`;

const SourceCard = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SourceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const SourceName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const SourceType = styled.span<{ type: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.type) {
      case 'RSS': return '#dbeafe';
      case 'YOUTUBE': return '#fecaca';
      case 'API': return '#dcfce7';
      case 'FILE': return '#fef3c7';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'RSS': return '#1e40af';
      case 'YOUTUBE': return '#dc2626';
      case 'API': return '#166534';
      case 'FILE': return '#92400e';
      default: return '#64748b';
    }
  }};
`;

const SourceUrl = styled.p`
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
  word-break: break-all;
`;

const SourceStatus = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatusBadge = styled.span<{ enabled: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => props.enabled ? '#dcfce7' : '#fecaca'};
  color: ${props => props.enabled ? '#166534' : '#dc2626'};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
          &:hover {
            background-color: #2563eb;
          }
        `;
      case 'danger':
        return `
          background-color: #dc2626;
          color: white;
          border-color: #dc2626;
          &:hover {
            background-color: #b91c1c;
          }
        `;
      default:
        return `
          background-color: #f8fafc;
          color: #64748b;
          border-color: #d1d5db;
          &:hover {
            background-color: #f1f5f9;
          }
        `;
    }
  }}
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

const RefreshAllButton = styled.button`
  background-color: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #059669;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const RefreshButton = styled.button`
  background-color: #6366f1;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #4f46e5;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const RefreshRate = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #f1f5f9;
  color: #64748b;
`;

const LastFetch = styled.p`
  color: #64748b;
  font-size: 0.75rem;
  margin: 0 0 1rem 0;
`;

export default function SourceList() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set());
  const [refreshingAll, setRefreshingAll] = useState(false);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/sources');
      if (!response.ok) throw new Error('Failed to fetch sources');
      const data = await response.json();
      setSources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    
    try {
      const response = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete source');
      await fetchSources();
    } catch (err) {
      alert('Failed to delete source');
    }
  };

  const handleToggle = async (source: Source) => {
    try {
      const response = await fetch(`/api/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !source.enabled }),
      });
      if (!response.ok) throw new Error('Failed to update source');
      await fetchSources();
    } catch (err) {
      alert('Failed to update source');
    }
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSource(null);
    fetchSources();
  };

  const handleRefresh = async (sourceId: string) => {
    setRefreshing(prev => new Set(prev).add(sourceId));
    
    try {
      const response = await fetch(`/api/sources/${sourceId}/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to refresh source');
      }

      // Refresh the sources list to get updated timestamps
      await fetchSources();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refresh source');
    } finally {
      setRefreshing(prev => {
        const newSet = new Set(prev);
        newSet.delete(sourceId);
        return newSet;
      });
    }
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    
    try {
      const response = await fetch('/api/sources/refresh-all', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to refresh all sources');
      }

      // Refresh the sources list to get updated timestamps
      await fetchSources();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refresh all sources');
    } finally {
      setRefreshingAll(false);
    }
  };

  if (loading) {
    return <LoadingState>Loading sources...</LoadingState>;
  }

  if (error) {
    return (
      <ErrorState>
        <h3>Error loading sources</h3>
        <p>{error}</p>
        <Button onClick={fetchSources}>Try Again</Button>
      </ErrorState>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Sources</Title>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <RefreshAllButton 
            onClick={handleRefreshAll}
            disabled={refreshingAll}
          >
            {refreshingAll ? 'Refreshing...' : 'Refresh All'}
          </RefreshAllButton>
          <AddButton onClick={() => setShowForm(true)}>
            Add Source
          </AddButton>
        </div>
      </Header>

      {showForm && (
        <SourceForm
          source={editingSource}
          onClose={handleFormClose}
        />
      )}

      <SourcesGrid>
        {sources.map(source => (
          <SourceCard key={source.id}>
            <SourceHeader>
              <SourceName>{source.name}</SourceName>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SourceType type={source.type}>{source.type}</SourceType>
                <RefreshRate>{source.refreshRate || 10}min</RefreshRate>
              </div>
            </SourceHeader>
            
            {source.url && <SourceUrl>{source.url}</SourceUrl>}
            
            {source.lastFetchedAt && (
              <LastFetch>
                Last fetched: {new Date(source.lastFetchedAt).toLocaleString()}
              </LastFetch>
            )}
            
            <SourceStatus>
              <StatusBadge enabled={source.enabled}>
                {source.enabled ? 'Enabled' : 'Disabled'}
              </StatusBadge>
              <Actions>
                <RefreshButton 
                  onClick={() => handleRefresh(source.id)}
                  disabled={refreshing.has(source.id)}
                >
                  {refreshing.has(source.id) ? 'Refreshing...' : 'Refresh Now'}
                </RefreshButton>
                <Button onClick={() => handleToggle(source)}>
                  {source.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button variant="primary" onClick={() => handleEdit(source)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(source.id)}>
                  Delete
                </Button>
              </Actions>
            </SourceStatus>
          </SourceCard>
        ))}
      </SourcesGrid>
    </Container>
  );
}
