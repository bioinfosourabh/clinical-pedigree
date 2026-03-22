/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Keep clinical/surface aliases so rendering layer doesn't break
        clinical: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
          300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6',
          600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af',
          900: '#1e3a8a', 950: '#172554',
        },
        surface: {
          0: '#ffffff', 50: '#f8fafc', 100: '#f1f5f9',
          200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
          500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },
      fontSize: { '2xs': ['0.625rem', { lineHeight: '0.9rem' }] },
      borderRadius: { sm: '4px', DEFAULT: '6px', md: '8px', lg: '10px', xl: '14px' },
      boxShadow: {
        panel: '0 1px 3px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)',
        card:  '0 4px 8px rgb(0 0 0 / 0.07), 0 2px 4px rgb(0 0 0 / 0.04)',
        modal: '0 24px 48px rgb(0 0 0 / 0.12), 0 8px 16px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
