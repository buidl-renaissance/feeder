import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { Source } from '@/db/schema';

const FormOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
`;

const FormContainer = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  padding: 0;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #d1d5db;
  background-color: #f9fafb;
  border-radius: 0.75rem 0.75rem 0 0;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  background-color: white;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background-color: white;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    border-color: #d1d5db;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background-color: white;
  color: #111827;
  transition: all 0.2s;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background-color: white;
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    border-color: #d1d5db;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
  background-color: white;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background-color: white;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 2px solid #d1d5db;
`;

const Checkbox = styled.input`
  width: 1.125rem;
  height: 1.125rem;
  accent-color: #3b82f6;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;

  ${props => {
    if (props.variant === 'primary') {
      return `
        background-color: #3b82f6;
        color: white;
        border: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        &:hover {
          background-color: #2563eb;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        &:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
      `;
    }
    return `
      background-color: white;
      color: #374151;
      border: 2px solid #d1d5db;
      &:hover {
        background-color: #f9fafb;
        border-color: #9ca3af;
        color: #111827;
      }
    `;
  }}
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 2px solid #fca5a5;
  border-radius: 0.5rem;
  font-weight: 500;
  margin-top: 0.5rem;
`;

interface SourceFormProps {
  source?: Source | null;
  onClose: () => void;
}

export default function SourceForm({ source, onClose }: SourceFormProps) {
  const [formData, setFormData] = useState({
    type: 'RSS' as 'RSS' | 'YOUTUBE' | 'API' | 'FILE',
    name: '',
    url: '',
    channelId: '',
    config: '',
    enabled: true,
    refreshRate: 10, // default 10 minutes
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source) {
      setFormData({
        type: source.type as 'RSS' | 'YOUTUBE' | 'API' | 'FILE',
        name: source.name,
        url: source.url || '',
        channelId: source.config?.channelId || '',
        config: source.config ? JSON.stringify(source.config, null, 2) : '',
        enabled: source.enabled,
        refreshRate: source.refreshRate || 10,
      });
    }
  }, [source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let config = {};
      if (formData.config.trim()) {
        config = JSON.parse(formData.config);
      }

      let payload: any = {
        type: formData.type,
        name: formData.name,
        config,
        enabled: formData.enabled,
        refreshRate: formData.refreshRate,
      };

      if (formData.type === 'YOUTUBE') {
        payload.url = `https://www.youtube.com/feeds/videos.xml?channel_id=${formData.channelId}`;
        payload.config = { ...config, channelId: formData.channelId };
      } else {
        payload.url = formData.url || undefined;
      }

      const url = source ? `/api/sources/${source.id}` : '/api/sources';
      const method = source ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save source');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save source');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <FormOverlay onClick={onClose}>
      <FormContainer onClick={(e) => e.stopPropagation()}>
        <FormHeader>
          <FormTitle>{source ? 'Edit Source' : 'Add Source'}</FormTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </FormHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="type">Type</Label>
            <Select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              required
            >
              <option value="RSS">RSS Feed</option>
              <option value="YOUTUBE">YouTube Channel</option>
              <option value="API">API</option>
              <option value="FILE">File Upload</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </FormGroup>

          {formData.type === 'YOUTUBE' ? (
            <FormGroup>
              <Label htmlFor="channelId">YouTube Channel ID</Label>
              <Input
                id="channelId"
                type="text"
                value={formData.channelId || ''}
                onChange={(e) => handleChange('channelId', e.target.value)}
                placeholder="UCqlYzSgsh5jdtWYfVIBoTDw"
              />
              <small style={{ color: '#374151', fontSize: '0.75rem' }}>
                Find your channel ID in your YouTube channel URL or channel settings
              </small>
            </FormGroup>
          ) : (
            <FormGroup>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder={formData.type === 'FILE' ? 'Not applicable for file uploads' : 'https://example.com/feed.xml'}
                disabled={formData.type === 'FILE'}
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="config">Configuration (JSON)</Label>
            <Textarea
              id="config"
              value={formData.config}
              onChange={(e) => handleChange('config', e.target.value)}
              placeholder='{"headers": {"Authorization": "Bearer token"}}'
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="refreshRate">Refresh Rate</Label>
            <Select
              id="refreshRate"
              value={formData.refreshRate}
              onChange={(e) => handleChange('refreshRate', parseInt(e.target.value))}
            >
              <option value={1}>1 minute</option>
              <option value={10}>10 minutes</option>
              <option value={60}>60 minutes</option>
            </Select>
            <small style={{ color: '#374151', fontSize: '0.75rem' }}>
              How often to automatically fetch new content from this source
            </small>
          </FormGroup>

          <CheckboxGroup>
            <Checkbox
              id="enabled"
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </CheckboxGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : source ? 'Update' : 'Create'}
            </Button>
          </ButtonGroup>
        </Form>
      </FormContainer>
    </FormOverlay>
  );
}
