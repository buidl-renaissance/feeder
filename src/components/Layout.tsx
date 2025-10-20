import styled from 'styled-components';
import Link from 'next/link';

const Container = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
`;

const Header = styled.header`
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1e293b;
  margin: 0;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavLink = styled(Link)`
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #1e293b;
  }

  &.active {
    color: #3b82f6;
  }
`;

const Main = styled.main`
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
  background-color: #f8fafc;
  min-height: calc(100vh - 80px);
`;

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function Layout({ children, currentPage }: LayoutProps) {
  return (
    <Container>
      <Header>
        <Nav>
          <Logo>Content Feeder</Logo>
          <NavLinks>
            <NavLink href="/" className={currentPage === 'home' ? 'active' : ''}>
              Feed
            </NavLink>
            <NavLink href="/sources" className={currentPage === 'sources' ? 'active' : ''}>
              Sources
            </NavLink>
            <NavLink href="/workflows" className={currentPage === 'workflows' ? 'active' : ''}>
              Workflows
            </NavLink>
          </NavLinks>
        </Nav>
      </Header>
      <Main>{children}</Main>
    </Container>
  );
}
