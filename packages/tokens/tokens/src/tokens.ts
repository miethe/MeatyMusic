export interface DesignTokens {
  color: {
    bg: string;
    surface: string;
    panel: string;
    border: string;
    ring: string;
    text: {
      strong: string;
      base: string;
      muted: string;
    };
    primary: string;
    primaryForeground: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    collection?: {
      primary: string;
      secondary: string;
      accent: string;
      purple: string;
      green: string;
      orange: string;
      blue: string;
      red: string;
    };
  };
  badge: {
    default: {
      border: string;
      bg: string;
      text: string;
      hoverBg: string;
      shadow: string;
    };
    secondary: {
      border: string;
      bg: string;
      text: string;
      hoverBg: string;
      shadow: string;
    };
    outline: {
      border: string;
      bg: string;
      text: string;
      hoverBg: string;
      hoverBorder: string;
      shadow: string;
    };
  };
  spacing: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    pill: string;
  };
  elevation: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
  };
  focus?: {
    ringWidth?: string;
  };
  typography: {
    fontFamily: {
      ui: string[];
      mono: string[];
      display: string[];
    };
    fontSize: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
    };
    lineHeight: {
      body: string;
      heading: string;
    };
    letterSpacing: {
      default: string;
      tight: string;
    };
  };
  motion: {
    duration: {
      micro: string;
      ui: string;
      panel: string;
      modal: string;
    };
    easing: {
      enter: string;
      exit: string;
    };
  };
}

export type ThemeName = 'light' | 'dark' | 'ocean' | 'sand' | 'light-hc' | 'dark-hc';

export const themes: Record<ThemeName, Partial<DesignTokens>> = {
  "light": {
    "color": {
      "bg": "#FBFCFE",
      "surface": "#FFFFFF",
      "panel": "#F5F7FB",
      "border": "#E6EAF2",
      "ring": "#7C3AED",
      "text": {
        "strong": "#0B1220",
        "base": "#1F2937",
        "muted": "#6B7280"
      },
      "primary": "#6E56CF",
      "primaryForeground": "#FFFFFF",
      "secondary": "#00B3A4",
      "accent": "#FFB224",
      "success": "#2BA84A",
      "warning": "#F59E0B",
      "danger": "#E5484D",
      "info": "#0091FF",
      "collection": {
        "primary": "#6E56CF",
        "secondary": "#00B3A4",
        "accent": "#FFB224",
        "purple": "#8B5CF6",
        "green": "#10B981",
        "orange": "#F97316",
        "blue": "#3B82F6",
        "red": "#EF4444"
      }
    }
  },
  "dark": {
    "color": {
      "bg": "#0B0F17",
      "surface": "#0F172A",
      "panel": "#111827",
      "border": "#232B3A",
      "ring": "#9B8BFF",
      "text": {
        "strong": "#E6EAF2",
        "base": "#D1D6E0",
        "muted": "#8E96A3"
      },
      "primary": "#8E7CFF",
      "primaryForeground": "#0B0F17",
      "secondary": "#0BD1C5",
      "accent": "#FFD285",
      "success": "#48D26B",
      "warning": "#F8B84E",
      "danger": "#FF7A85",
      "info": "#58AFFF",
      "collection": {
        "primary": "#8E7CFF",
        "secondary": "#0BD1C5",
        "accent": "#FFD285",
        "purple": "#A78BFA",
        "green": "#34D399",
        "orange": "#FB923C",
        "blue": "#60A5FA",
        "red": "#F87171"
      }
    },
    "badge": {
      "default": {
        "border": "#232B3A",
        "bg": "#0F172A",
        "text": "#D1D6E0",
        "hoverBg": "#111827",
        "shadow": "0 1px 2px rgba(0,0,0,.2)"
      },
      "secondary": {
        "border": "#232B3A",
        "bg": "#111827",
        "text": "#8E7CFF",
        "hoverBg": "#1E1B33",
        "shadow": "0 1px 2px rgba(142,124,255,.15)"
      },
      "outline": {
        "border": "#232B3A",
        "bg": "transparent",
        "text": "#D1D6E0",
        "hoverBg": "#111827",
        "hoverBorder": "#8E7CFF",
        "shadow": "none"
      }
    }
  },
  "ocean": {
    "color": {
      "bg": "#F8FEFF",
      "surface": "#FFFFFF",
      "panel": "#F0FDFF",
      "border": "#E0F7FA",
      "ring": "#0891B2",
      "text": {
        "strong": "#0F172A",
        "base": "#1E293B",
        "muted": "#64748B"
      },
      "primary": "#0891B2",
      "primaryForeground": "#FFFFFF",
      "secondary": "#06B6D4",
      "accent": "#0EA5E9",
      "success": "#10B981",
      "warning": "#F59E0B",
      "danger": "#EF4444",
      "info": "#3B82F6",
      "collection": {
        "primary": "#0891B2",
        "secondary": "#06B6D4",
        "accent": "#0EA5E9",
        "purple": "#8B5CF6",
        "green": "#10B981",
        "orange": "#F97316",
        "blue": "#3B82F6",
        "red": "#EF4444"
      }
    }
  },
  "sand": {
    "color": {
      "bg": "#FFFEF7",
      "surface": "#FFFFFF",
      "panel": "#FEF9E7",
      "border": "#F5E6C1",
      "ring": "#D97706",
      "text": {
        "strong": "#1C1917",
        "base": "#44403C",
        "muted": "#78716C"
      },
      "primary": "#D97706",
      "primaryForeground": "#FFFFFF",
      "secondary": "#EA580C",
      "accent": "#F59E0B",
      "success": "#059669",
      "warning": "#DC2626",
      "danger": "#DC2626",
      "info": "#2563EB",
      "collection": {
        "primary": "#D97706",
        "secondary": "#EA580C",
        "accent": "#F59E0B",
        "purple": "#7C3AED",
        "green": "#059669",
        "orange": "#EA580C",
        "blue": "#2563EB",
        "red": "#DC2626"
      }
    }
  },
  "light-hc": {
    "color": {
      "bg": "#FFFFFF",
      "surface": "#FFFFFF",
      "panel": "#F8F9FA",
      "border": "#000000",
      "ring": "#B8860B",
      "text": {
        "strong": "#000000",
        "base": "#000000",
        "muted": "#404040"
      },
      "primary": "#1F1FB8",
      "primaryForeground": "#FFFFFF",
      "secondary": "#006B61",
      "accent": "#B8750A",
      "success": "#1F7A2F",
      "warning": "#8B5500",
      "danger": "#B51E23",
      "info": "#004C99",
      "collection": {
        "primary": "#1F1FB8",
        "secondary": "#006B61",
        "accent": "#B8750A",
        "purple": "#5B21B6",
        "green": "#1F7A2F",
        "orange": "#B85C00",
        "blue": "#1E40AF",
        "red": "#B51E23"
      }
    },
    "focus": {
      "ringWidth": "3px"
    }
  },
  "dark-hc": {
    "color": {
      "bg": "#000000",
      "surface": "#0F0F0F",
      "panel": "#1F1F1F",
      "border": "#FFFFFF",
      "ring": "#FFFF00",
      "text": {
        "strong": "#FFFFFF",
        "base": "#FFFFFF",
        "muted": "#CCCCCC"
      },
      "primary": "#6666FF",
      "primaryForeground": "#000000",
      "secondary": "#33CCBB",
      "accent": "#FFB833",
      "success": "#33CC4D",
      "warning": "#FFD700",
      "danger": "#FF4D4D",
      "info": "#4DA6FF",
      "collection": {
        "primary": "#6666FF",
        "secondary": "#33CCBB",
        "accent": "#FFB833",
        "purple": "#B088FF",
        "green": "#33CC4D",
        "orange": "#FF9933",
        "blue": "#4DA6FF",
        "red": "#FF4D4D"
      }
    },
    "focus": {
      "ringWidth": "3px"
    }
  }
};

export const baseTokens: DesignTokens = {
  "color": {
    "bg": "#FBFCFE",
    "surface": "#FFFFFF",
    "panel": "#F5F7FB",
    "border": "#E6EAF2",
    "ring": "#7C3AED",
    "text": {
      "strong": "#0B1220",
      "base": "#1F2937",
      "muted": "#6B7280"
    },
    "primary": "#6E56CF",
    "primaryForeground": "#FFFFFF",
    "secondary": "#00B3A4",
    "accent": "#FFB224",
    "success": "#2BA84A",
    "warning": "#F59E0B",
    "danger": "#E5484D",
    "info": "#0091FF"
  },
  "badge": {
    "default": {
      "border": "#E6EAF2",
      "bg": "#FFFFFF",
      "text": "#1F2937",
      "hoverBg": "#F5F7FB",
      "shadow": "0 1px 2px rgba(8,15,30,.06)"
    },
    "secondary": {
      "border": "#E6EAF2",
      "bg": "#F5F7FB",
      "text": "#6E56CF",
      "hoverBg": "#EEF2FF",
      "shadow": "0 1px 2px rgba(110,86,207,.1)"
    },
    "outline": {
      "border": "#E6EAF2",
      "bg": "transparent",
      "text": "#1F2937",
      "hoverBg": "#F5F7FB",
      "hoverBorder": "#6E56CF",
      "shadow": "none"
    }
  },
  "spacing": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "24px",
    "6": "32px",
    "7": "40px",
    "8": "56px"
  },
  "radius": {
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "pill": "999px"
  },
  "elevation": {
    "0": "none",
    "1": "0 1px 2px rgba(8,15,30,.06), 0 1px 1px rgba(8,15,30,.04)",
    "2": "0 4px 10px rgba(8,15,30,.08)",
    "3": "0 8px 24px rgba(8,15,30,.12)",
    "4": "0 12px 32px rgba(8,15,30,.16)"
  },
  "typography": {
    "fontFamily": {
      "ui": [
        "Inter",
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Roboto"
      ],
      "mono": [
        "JetBrains Mono",
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Consolas"
      ],
      "display": [
        "Plus Jakarta Sans",
        "Inter",
        "ui-sans-serif",
        "system-ui"
      ]
    },
    "fontSize": {
      "1": "clamp(14px, 0.96vw + 10px, 16px)",
      "2": "clamp(16px, 1.1vw + 12px, 18px)",
      "3": "clamp(18px, 1.2vw + 13px, 22px)",
      "4": "clamp(22px, 1.6vw + 14px, 28px)",
      "5": "clamp(28px, 2.2vw + 16px, 36px)"
    },
    "lineHeight": {
      "body": "1.5",
      "heading": "1.35"
    },
    "letterSpacing": {
      "default": "0",
      "tight": "-0.01em"
    }
  },
  "motion": {
    "duration": {
      "micro": "70ms",
      "ui": "150ms",
      "panel": "250ms",
      "modal": "400ms"
    },
    "easing": {
      "enter": "cubic-bezier(.2,.8,.2,1)",
      "exit": "cubic-bezier(.4,0,.2,1)"
    }
  }
};
