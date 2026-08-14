import { Bell } from 'lucide-react';
import './layout.css';

type HeaderProps = {
  title: string;
  description: string;
};

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="top-header">
      <div className="header-title">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="header-actions">
        <button className="icon-btn">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
