/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
        retro: ['"VT323"', '"Courier New"', 'monospace'],
        sans: ['"Segoe UI"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        apple: {
          beige: '#E3DCBE',
          case: '#D8D3BC',
          darkCase: '#B0A98F',
          border: '#8F896F',
          shadow: '#4A4638',
          greenPhosphor: '#33FF33',
          greenGlow: '#00AA00',
          amberPhosphor: '#FFB000',
          whitePhosphor: '#F0F0F0',
          crtBg: '#0A0E0A',
          ledRed: '#FF2A2A',
          ledGreen: '#2AFF2A',
          ledAmber: '#FFAA00'
        }
      }
    },
  },
  plugins: [],
}
