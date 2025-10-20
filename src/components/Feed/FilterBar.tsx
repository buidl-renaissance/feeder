import styled from 'styled-components';
import { useState, useEffect } from 'react';

const FilterContainer = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
  flex: 1;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ClearButton = styled.button`
  background-color: #f8fafc;
  color: #64748b;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f1f5f9;
    border-color: #94a3b8;
  }
`;

interface FilterBarProps {
  filters: {
    search: string;
    sourceId: string;
    status: string;
  };
  onFiltersChange: (filters: {
    search: string;
    sourceId: string;
    status: string;
  }) => void;
}

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [sources, setSources] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Fetch sources for the dropdown
    fetch('/api/sources')
      .then(res => res.json())
      .then(data => setSources(data))
      .catch(err => console.error('Failed to fetch sources:', err));
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      sourceId: '',
      status: '',
    });
  };

  const hasActiveFilters = filters.search || filters.sourceId || filters.status;

  return (
    <FilterContainer>
      <FilterRow>
        <FilterGroup>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search content..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </FilterGroup>

        <FilterGroup>
          <Label htmlFor="source">Source</Label>
          <Select
            id="source"
            value={filters.sourceId}
            onChange={(e) => handleFilterChange('sourceId', e.target.value)}
          >
            <option value="">All sources</option>
            {sources.map(source => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </Select>
        </FilterGroup>

        <FilterGroup>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </Select>
        </FilterGroup>

        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <ClearButton onClick={clearFilters}>
              Clear Filters
            </ClearButton>
          </div>
        )}
      </FilterRow>
    </FilterContainer>
  );
}
