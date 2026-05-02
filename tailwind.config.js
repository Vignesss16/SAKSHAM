/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0e1417',
        'surface-dim': '#0e1417',
        'surface-container-lowest': '#090f12',
        'surface-container-low': '#161d1f',
        'surface-container': '#1a2123',
        'surface-container-high': '#242b2e',
        'surface-container-highest': '#2f3639',
        'surface-variant': '#2f3639',
        'surface-bright': '#333a3d',
        'on-surface': '#dde3e7',
        'on-surface-variant': '#bbc9cf',
        outline: '#859399',
        'outline-variant': '#3c494e',
        primary: '#a4e6ff',
        'on-primary': '#003543',
        'primary-container': '#00d1ff',
        'on-primary-container': '#00566a',
        'primary-fixed': '#b7eaff',
        'primary-fixed-dim': '#4cd6ff',
        'on-primary-fixed': '#001f28',
        secondary: '#44e2cd',
        'on-secondary': '#003731',
        'secondary-container': '#03c6b2',
        tertiary: '#ecd3ff',
        'tertiary-container': '#d9afff',
        error: '#ffb4ab',
        background: '#0e1417',
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
