/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', 'sans-serif'],
        serif: ['"Playfair Display"', '"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Reference Color Palette
        beige: {
          DEFAULT: '#F7F4D5',
          light: '#FBF9E7',
          canvas: '#F7F4D5',
          card: '#FCFBF0',
          dark: '#EDE8BD',
          border: '#E3DC9E',
        },
        darkgreen: {
          DEFAULT: '#0A3323',
          ink: '#0A3323',
          dark: '#051E14',
          muted: '#1E4A37',
          surface: '#0F402D',
          hover: '#144F38',
        },
        midnight: {
          DEFAULT: '#105666',
          interactive: '#105666',
          hover: '#166E83',
          light: '#237B90',
          dark: '#0B3F4B',
          tint: '#E5F1F4',
        },
        moss: {
          DEFAULT: '#839958',
          accent: '#839958',
          hover: '#95AC68',
          muted: '#6F8349',
          light: '#A5BC7B',
          tint: '#EFF4E3',
        },
        rosy: {
          DEFAULT: '#D3968C',
          accent: '#D3968C',
          hover: '#DCABA3',
          dark: '#B7776C',
          tint: '#FBF1EF',
          burn: '#C66C5E',
        },
      },
      boxShadow: {
        'warm-xs': '0 1px 2px rgba(10, 51, 35, 0.05)',
        'warm-sm': '0 2px 5px rgba(10, 51, 35, 0.07), 0 1px 2px rgba(10, 51, 35, 0.04)',
        'warm': '0 4px 16px rgba(10, 51, 35, 0.08), 0 1px 4px rgba(10, 51, 35, 0.04)',
        'warm-md': '0 8px 24px rgba(10, 51, 35, 0.10), 0 2px 8px rgba(10, 51, 35, 0.05)',
        'warm-lg': '0 16px 36px rgba(10, 51, 35, 0.12), 0 4px 12px rgba(10, 51, 35, 0.06)',
        'warm-xl': '0 24px 50px rgba(10, 51, 35, 0.16), 0 6px 16px rgba(10, 51, 35, 0.08)',
        'inner-warm': 'inset 0 2px 4px rgba(10, 51, 35, 0.06)',
      },
      keyframes: {
        pulseFast: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(1.03)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-5px)' },
          '40%, 80%': { transform: 'translateX(5px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
        }
      },
      animation: {
        'pulse-fast': 'pulseFast 0.8s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
        'fade-in': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'gentle-float': 'gentleFloat 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
