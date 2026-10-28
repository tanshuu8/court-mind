/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Landing-page design tokens ───────────────────────────────── */
        page:    '#0B0907',
        surface: '#16110D',
        card:    '#1C1510',
        bronze: {
          DEFAULT: '#C99A6B',
          light:   '#D9A66E',
          pale:    '#E8C9A0',
          dim:     'rgba(232,201,160,0.16)',
        },
        cream: '#F3E3C8',
        ltext: {
          DEFAULT: '#F4EBDD',
          muted:   '#D3C7B3',
          faint:   '#C9BBA6',
        },
        /* ── Existing brand colors (kept intact) ──────────────────────── */
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
          950: '#031726',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '1120px',
      },
      spacing: {
        section: '96px',
      },
    },
  },
  plugins: [],
}
