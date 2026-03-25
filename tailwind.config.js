import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        card: '#ffffff',
        border: '#e2e8f0',
        foreground: '#0f172a',
        accent: '#6366f1',
        'accent-hover': '#4f46e5',
        muted: '#64748b',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [typography],
}
