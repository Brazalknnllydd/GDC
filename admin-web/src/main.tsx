import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Categories } from './pages/Categories';
import { Sales } from './pages/Sales';
import { Shifts } from './pages/Shifts';
import { Login } from './pages/Login';
import './index.css';

// Placeholder Pages
const Reports = () => <div className="card">Reports Page (Coming soon)</div>;
const Settings = () => <div className="card">Settings Page (Coming soon)</div>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="customers" element={<Customers />} />
          <Route path="sales" element={<Sales />} />
          <Route path="shifts" element={<Shifts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
