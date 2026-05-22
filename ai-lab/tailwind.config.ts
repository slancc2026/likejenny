import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0A0A0A',
          white: '#F5F5F0',
          green: '#2ECC71',
          'green-dark': '#1A8A4A',
          yellow: '#FFD600',
          red: '#FF3333',
          gray: '#E8E8E4',
          'gray-2': '#D0D0CA',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'Space Grotesk', 'sans-serif'],
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
      borderWidth: { '2.5': '2.5px' },
    },
  },
  plugins: [],
}
export default config
