/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#1A1D23',
        'sidebar-hover': '#252830',
        'sidebar-active': '#2E3440',
        toolbar: '#23262E',
        accent: '#4F9EFF',
        'accent-hover': '#3D8AE8',
        canvas: '#F5F5F5'
      }
    }
  },
  plugins: []
}
