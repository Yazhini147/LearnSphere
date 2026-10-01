/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design system tokens from specification
        background: '#F8F9FB',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#4263D5',
          soft: '#E9EDFF',
          hover: '#3452c7',
          active: '#2942b8',
        },
        text: {
          deep: '#202635',
          muted: '#667085',
          placeholder: '#9CA3AF',
        },
        border: {
          DEFAULT: '#DCE1EA',
          strong: '#B0BBCC',
        },
        soft: '#F1F3F7',
        success: {
          DEFAULT: '#16A34A',
          soft: '#DCFCE7',
          muted: '#4ADE80',
        },
        warning: {
          DEFAULT: '#D97706',
          soft: '#FEF3C7',
          muted: '#FCD34D',
        },
        error: {
          DEFAULT: '#DC2626',
          soft: '#FEE2E2',
          muted: '#F87171',
        },
        info: {
          DEFAULT: '#2563EB',
          soft: '#DBEAFE',
          muted: '#60A5FA',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        DEFAULT: '0.375rem',   // 6px — base
        sm: '0.25rem',         // 4px
        md: '0.5rem',          // 8px
        lg: '0.75rem',         // 12px
        xl: '1rem',            // 16px
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        // Neo-brutalist offset shadow (used sparingly)
        brutal: '2px 2px 0px 0px #202635',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};
