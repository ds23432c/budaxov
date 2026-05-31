/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terra: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#a5d8ff',
          400: '#4db8ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c1b33',
          950: '#06101f',
        },
        gem: {
          gold: '#FFD700',
          emerald: '#00C853',
          ruby: '#E53935',
          sapphire: '#1E88E5',
          amethyst: '#8E24AA',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-terra': 'linear-gradient(135deg, #0c1b33 0%, #0f2744 40%, #1a3a5c 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700, #FFA500)',
        'gradient-gem': 'linear-gradient(135deg, #00C853, #1E88E5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'particle': 'particle 8s linear infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } },
        glow: { '0%': { boxShadow: '0 0 5px #FFD700' }, '100%': { boxShadow: '0 0 20px #FFD700, 0 0 40px #FFD700' } },
        particle: { '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' }, '10%': { opacity: '1' }, '90%': { opacity: '1' }, '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' } },
        slideUp: { '0%': { transform: 'translateY(30px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
