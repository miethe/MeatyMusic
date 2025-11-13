'use client';

import * as React from 'react';
import { Monitor, Moon, Sun, Palette, Eye } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../components/Dialog';

interface ThemeSwitcherProps {
  variant?: 'button' | 'select' | 'grid';
  showLabels?: boolean;
  className?: string;
}

const themeIcons = {
  light: Sun,
  dark: Moon,
  ocean: Palette,
  sand: Palette,
  midnight: Moon,
  'high-contrast': Eye,
};

export function ThemeSwitcher({
  variant = 'button',
  showLabels = true,
  className
}: ThemeSwitcherProps) {
  const { currentTheme, availableThemes, setTheme, resetTheme } = useTheme();

  if (variant === 'button') {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={className}
          >
            {React.createElement(themeIcons[currentTheme.name as keyof typeof themeIcons] || Palette, {
              className: "h-4 w-4 mr-2"
            })}
            {showLabels && (
              <span className="capitalize">{currentTheme.name}</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Choose Theme</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {availableThemes.map((theme) => {
              const Icon = themeIcons[theme.name as keyof typeof themeIcons] || Palette;
              const isActive = currentTheme.name === theme.name;
              const isBuiltIn = ['light', 'dark', 'ocean', 'sand', 'midnight', 'high-contrast'].includes(theme.name);

              return (
                <button
                  key={theme.name}
                  onClick={() => setTheme(theme.name)}
                  className={`
                    flex items-center space-x-3 p-3 rounded-md border transition-all
                    ${isActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex-1 text-left">
                    <div className="font-medium capitalize">{theme.name}</div>
                    <div className="flex items-center space-x-1 mt-1">
                      {!isBuiltIn && (
                        <Badge variant="outline" className="text-xs">
                          Custom
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={resetTheme}
              className="flex items-center space-x-2"
            >
              <Monitor className="h-4 w-4" />
              <span>System</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === 'select') {
    return (
      <select
        value={currentTheme.name}
        onChange={(e) => setTheme(e.target.value)}
        className={`
          px-3 py-2 border border-border rounded-md bg-surface text-text-base
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          ${className}
        `}
      >
        {availableThemes.map((theme) => (
          <option key={theme.name} value={theme.name}>
            {theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
          </option>
        ))}
      </select>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {availableThemes.map((theme) => {
          const Icon = themeIcons[theme.name as keyof typeof themeIcons] || Palette;
          const isActive = currentTheme.name === theme.name;

          return (
            <button
              key={theme.name}
              onClick={() => setTheme(theme.name)}
              className={`
                flex items-center justify-center p-3 rounded-md border transition-all
                ${isActive
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              {showLabels && (
                <span className="ml-2 text-sm font-medium capitalize">
                  {theme.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
