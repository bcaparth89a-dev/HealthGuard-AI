/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#eef2ff',
          500: '#3f51b5', // Premium Clinical Indigo/Deep Blue
          600: '#303f9f',
          700: '#1a237e',
        },
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#0ea5e9', // Vibrant Healthcare Cyan/Teal
          600: '#0284c7',
          700: '#0369a1',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(63, 81, 181, 0.08), 0 2px 8px -1px rgba(0, 0, 0, 0.04)',
        'premium-hover': '0 10px 25px -3px rgba(63, 81, 181, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
