'use client';

import { ReactNode } from 'react';
import { Shield, Menu, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  children?: ReactNode;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
  showMenuButton?: boolean;
}

export function Navbar({
  children,
  onMenuToggle,
  isMenuOpen = false,
  showMenuButton = false
}: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
        >
          <Shield
            size={28}
            style={{
              color: '#F7931A',
              filter: 'drop-shadow(0 0 10px rgba(247, 147, 26, 0.6))'
            }}
          />
        </motion.div>
        <span className="navbar-logo">NEXUS</span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-heading)',
          marginLeft: -4
        }}>
          Intelligence
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {children}

        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                >
                  <Menu size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
