'use client';

import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';

interface CreateCaseButtonProps {
  onClick: () => void;
  variant?: 'floating' | 'inline';
  label?: string;
}

export function CreateCaseButton({
  onClick,
  variant = 'floating',
  label = 'Create New Investigation'
}: CreateCaseButtonProps) {
  if (variant === 'inline') {
    return (
      <motion.button
        onClick={onClick}
        className="btn-primary"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Plus size={18} />
        {label}
      </motion.button>
    );
  }

  return (
    <div className="create-button-float">
      <motion.button
        onClick={onClick}
        className="btn-create"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 12px 40px rgba(59, 130, 246, 0.5)'
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: [0, 90, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Plus size={20} />
        </motion.div>
        {label}
        <Sparkles size={16} style={{ opacity: 0.7 }} />
      </motion.button>
    </div>
  );
}

export default CreateCaseButton;
