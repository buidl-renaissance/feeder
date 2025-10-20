import styled from 'styled-components';
import { ContentObject } from '@/types/content';

const Card = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
  overflow: hidden;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background-color: #000;
  border-radius: 0.75rem 0.75rem 0 0;
  overflow: hidden;
`;

const VideoIframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
`;

const Content = styled.div`
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.4;
  flex: 1;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background-color: ${props => {
    switch (props.status) {
      case 'COMPLETED': return '#dcfce7';
      case 'PROCESSING': return '#fef3c7';
      case 'FAILED': return '#fecaca';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'COMPLETED': return '#166534';
      case 'PROCESSING': return '#92400e';
      case 'FAILED': return '#dc2626';
      default: return '#64748b';
    }
  }};
`;

const Description = styled.p`
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Metadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background-color: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #64748b;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
`;

const SourceInfo = styled.span`
  font-weight: 500;
`;

const DateInfo = styled.span``;

const Link = styled.a`
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

interface ContentCardProps {
  content: ContentObject;
}

export default function ContentCard({ content }: ContentCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getSourceTypeColor = (type: string) => {
    switch (type) {
      case 'RSS': return '#3b82f6';
      case 'YOUTUBE': return '#dc2626';
      case 'API': return '#10b981';
      case 'FILE': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const isYouTubeVideo = content.url && getYouTubeVideoId(content.url);
  const videoId = isYouTubeVideo ? getYouTubeVideoId(content.url!) : null;

  return (
    <Card>
      {isYouTubeVideo && videoId && (
        <VideoContainer>
          <VideoIframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={content.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </VideoContainer>
      )}
      
      <Content>
        <Header>
          <Title>{content.title}</Title>
          <StatusBadge status={content.status}>{content.status}</StatusBadge>
        </Header>
        
        {content.description && (
          <Description>{content.description}</Description>
        )}
        
        {content.metadata?.aiTags && content.metadata.aiTags.length > 0 && (
          <Metadata>
            {content.metadata.aiTags.map((tag: string, index: number) => (
              <Tag key={index}>{tag}</Tag>
            ))}
          </Metadata>
        )}
        
        <Footer>
          <SourceInfo style={{ color: getSourceTypeColor(content.sourceType) }}>
            {content.sourceType}
          </SourceInfo>
          <DateInfo>{formatDate(content.publishedAt || content.createdAt)}</DateInfo>
        </Footer>
        
        {content.url && !isYouTubeVideo && (
          <div style={{ marginTop: '1rem' }}>
            <Link href={content.url} target="_blank" rel="noopener noreferrer">
              View Original →
            </Link>
          </div>
        )}
      </Content>
    </Card>
  );
}
