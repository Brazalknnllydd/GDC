import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AiChat } from '../ui/AiChat';

export function Layout() {
  const location = useLocation();

  if (!localStorage.getItem('token')) {
    return <Navigate to="/login" />;
  }

  const pageTitles: Record<string, { title: string, description: string }> = {
    '/': { title: 'Dashboard', description: '' },
    '/products': { title: 'Products & Inventory', description: 'Manage your catalog, categories, and inventory levels.' },
    '/categories': { title: 'Categories', description: 'Organize products into groups and types.' },
    '/customers': { title: 'Customers', description: 'Manage customer accounts and details.' },
    '/sales': { title: 'Sales History', description: 'View past transactions and receipts.' },
    '/shifts': { title: 'Shifts', description: 'Monitor staff working hours and cash registers.' },
    '/reports': { title: 'Reports', description: 'Analyze business performance and trends.' },
    '/settings': { title: 'Settings', description: 'Configure system preferences.' },
  };

  const currentPage = pageTitles[location.pathname] || pageTitles['/'];

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header title={currentPage.title} description={currentPage.description} />
        <main className="p-8 animate-fade-in">
          <Outlet />
        </main>
        <AiChat />
      </div>
    </div>
  );
}
