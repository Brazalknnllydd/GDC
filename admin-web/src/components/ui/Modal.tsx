import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
};

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = '500px' }: ModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div className="card" style={{ width: '100%', maxWidth, padding: 0, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-between items-center p-6" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-base)', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
