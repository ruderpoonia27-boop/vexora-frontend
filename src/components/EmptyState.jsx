
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const EmptyState = ({ icon: Icon, title, message, actionText, onAction, className }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center p-12 text-center bg-card/30 rounded-3xl border border-dashed border-border/50", className)}
    >
      {Icon && (
        <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mb-6 text-muted-foreground">
          <Icon className="w-8 h-8 opacity-50" />
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-8">{message}</p>
      
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-2.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
