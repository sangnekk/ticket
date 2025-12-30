/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: '#5865f2',
          'blurple-hover': '#4752c4',
          green: '#23a55a',
          red: '#ed4245',
          yellow: '#fee75c',
          link: '#00aff4',
        },
        dark: {
          primary: '#313338',
          secondary: '#2b2d31',
          tertiary: '#1e1f22',
          hover: '#35373c',
          active: '#404249',
        },
        text: {
          normal: '#dbdee1',
          muted: '#949ba4',
          header: '#f2f3f5',
          'header-secondary': '#b5bac1',
        }
      },
      fontFamily: {
        sans: ['gg sans', 'Noto Sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'Andale Mono', 'monospace'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-out',
        'slideDown': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
