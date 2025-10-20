import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { Workflow } from '@/db/schema';

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

const WorkflowsGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
`;

const WorkflowCard = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const WorkflowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const WorkflowName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const StatusBadge = styled.span<{ enabled: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => props.enabled ? '#dcfce7' : '#fecaca'};
  color: ${props => props.enabled ? '#166534' : '#dc2626'};
`;

const StepsList = styled.div`
  margin-bottom: 1rem;
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.875rem;
  color: #64748b;
`;

const StepType = styled.span<{ enabled: boolean }>`
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => props.enabled ? '#f1f5f9' : '#fecaca'};
  color: ${props => props.enabled ? '#475569' : '#dc2626'};
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

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    
    try {
      const response = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete workflow');
      await fetchWorkflows();
    } catch (err) {
      alert('Failed to delete workflow');
    }
  };

  const handleToggle = async (workflow: Workflow) => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !workflow.enabled }),
      });
      if (!response.ok) throw new Error('Failed to update workflow');
      await fetchWorkflows();
    } catch (err) {
      alert('Failed to update workflow');
    }
  };

  if (loading) {
    return <LoadingState>Loading workflows...</LoadingState>;
  }

  if (error) {
    return (
      <ErrorState>
        <h3>Error loading workflows</h3>
        <p>{error}</p>
        <Button onClick={fetchWorkflows}>Try Again</Button>
      </ErrorState>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Workflows</Title>
        <AddButton onClick={() => alert('Workflow builder coming soon!')}>
          Add Workflow
        </AddButton>
      </Header>

      <WorkflowsGrid>
        {workflows.map(workflow => (
          <WorkflowCard key={workflow.id}>
            <WorkflowHeader>
              <WorkflowName>{workflow.name}</WorkflowName>
              <StatusBadge enabled={workflow.enabled}>
                {workflow.enabled ? 'Enabled' : 'Disabled'}
              </StatusBadge>
            </WorkflowHeader>
            
            <StepsList>
              {workflow.steps?.map((step: any, index: number) => (
                <StepItem key={index}>
                  <StepType enabled={step.enabled}>
                    {step.type}
                  </StepType>
                  <span>{step.name}</span>
                </StepItem>
              ))}
            </StepsList>
            
            <Actions>
              <Button onClick={() => handleToggle(workflow)}>
                {workflow.enabled ? 'Disable' : 'Enable'}
              </Button>
              <Button variant="primary" onClick={() => alert('Edit workflow coming soon!')}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => handleDelete(workflow.id)}>
                Delete
              </Button>
            </Actions>
          </WorkflowCard>
        ))}
      </WorkflowsGrid>
    </Container>
  );
}
