import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, Users, ReceiptText, FileText, BarChart3, Settings } from 'lucide-react';
import './layout.css';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/' },
  { label: 'Products', icon: Package, route: '/products' },
  { label: 'Categories', icon: Tags, route: '/categories' },
  { label: 'Customers', icon: Users, route: '/customers' },
  { label: 'Sales', icon: ReceiptText, route: '/sales' },
  { label: 'Shifts', icon: FileText, route: '/shifts' },
  { label: 'Reports', icon: BarChart3, route: '/reports' },
  { label: 'Settings', icon: Settings, route: '/settings' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logo.jpg" alt="GDC Logo" className="logo-img" />
          <div className="logo-text">
            <h3>GDC Admin</h3>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.route;
          return (
            <Link key={item.route} to={item.route} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon className="nav-icon" size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p className="version-text">v2.0.0 Web Edition</p>
      </div>
    </aside>
  );
}
