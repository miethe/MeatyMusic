/**
 * Simple Tabs Component
 *
 * Basic tabs implementation for @meaty/ui design system
 */

'use client';

import React, { useState } from 'react';

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
}>({
  activeTab: '',
  setActiveTab: () => {},
});

export const Tabs: React.FC<TabsProps> = ({ defaultValue = '', value, onValueChange, children, className = '' }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalValue;

  const handleTabChange = (newValue: string) => {
    if (isControlled) {
      onValueChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative inline-flex h-10 items-center justify-center rounded-md bg-mp-panel p-1 text-text-muted shadow-sm transition-shadow duration-150 hover:shadow-md ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = '' }) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-surface text-text-strong shadow-sm font-semibold'
          : 'hover:bg-mp-panel/50 hover:text-text-base hover:scale-105'
      } ${className}`}
      aria-selected={isActive}
      role="tab"
    >
      {isActive && (
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-3/4 rounded-t-full bg-mp-primary animate-slideInBottom"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '' }) => {
  const { activeTab } = React.useContext(TabsContext);

  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fadeIn ${className}`}>
      {children}
    </div>
  );
};

export default Tabs;
