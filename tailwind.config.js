/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderColor: {
        DEFAULT: 'var(--border-color)',
      },
      ringColor: {
        DEFAULT: 'var(--border-color)',
      },
      fontFamily: {
        serif: ['Newsreader', 'Source Serif 4', 'Charter', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
        quattro: ['Literata', 'Georgia', 'sans-serif'],
      },
      colors: {
        aura: {
          paper: {
            bg: '#FAF8F5',
            surface: '#F3EFEA',
            border: '#E8E2D8',
            text: '#22201E',
            muted: '#857F77',
            accent: '#B45309',
            selection: 'rgba(217, 119, 6, 0.18)'
          },
          white: {
            bg: '#FFFFFF',
            surface: '#F8F9FA',
            border: '#ECEFF1',
            text: '#111827',
            muted: '#6B7280',
            accent: '#2563EB',
            selection: 'rgba(59, 130, 246, 0.15)'
          },
          dark: {
            bg: '#141414',
            surface: '#1E1E1E',
            border: '#2C2C2C',
            text: '#ECECEC',
            muted: '#8E8E8E',
            accent: '#38BDF8',
            selection: 'rgba(56, 189, 248, 0.22)'
          },
          oled: {
            bg: '#000000',
            surface: '#0A0A0A',
            border: '#1E1E1E',
            text: '#FAFAFA',
            muted: '#737373',
            accent: '#60A5FA',
            selection: 'rgba(96, 165, 250, 0.25)'
          },
          slate: {
            bg: '#0F172A',
            surface: '#1E293B',
            border: '#334155',
            text: '#F8FAFC',
            muted: '#94A3B8',
            accent: '#38BDF8',
            selection: 'rgba(56, 189, 248, 0.22)'
          },
          hcLight: {
            bg: '#FFFFFF',
            surface: '#F0F0F0',
            border: '#000000',
            text: '#000000',
            muted: '#333333',
            accent: '#0000EE',
            selection: 'rgba(0, 0, 238, 0.2)'
          },
          hcDark: {
            bg: '#000000',
            surface: '#111111',
            border: '#FFFFFF',
            text: '#FFFFFF',
            muted: '#CCCCCC',
            accent: '#FFFF00',
            selection: 'rgba(255, 255, 0, 0.25)'
          }
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fadeOut: 'fadeOut 140ms ease forwards',
        slideDown: 'slideDown 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideUp: 'slideUp 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideInLeft: 'slideInLeft 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideInRight: 'slideInRight 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        scaleUp: 'scaleUp 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        zoomIn: 'zoomIn 160ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        popIn: 'popIn 160ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
