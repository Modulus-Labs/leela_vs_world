/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pageElements/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      desktop: { max: '1460px' },
      laptop: { max: '1024px' },
      tablet: { max: '768px' },
      mobile: { max: '480px' },
    },
    extend: {
      fontSize: {
        '8xl': ['5rem', '5rem'],
        '9xl': ['7rem', '7rem'],
        '10xl': ['9rem', '9rem'],
      },
      width: {
        'width-clamp': 'var(--width-clamp)',
      },
      margin: {
        'width-clamp': 'calc((100% - var(--width-clamp)) / 2)',
      },
      padding: {
        'width-clamp': 'calc((100% - var(--width-clamp)) / 2)',
      },
      colors: {
        'emerald-green': 'var(--emerald-green)',
        'off-black': 'var(--off-black)',
        'off-white': 'var(--off-white)',
        gray: 'var(--gray)',
        'light-gray': 'var(--light-gray)',
        'dark-gray': 'var(--dark-gray)',
        'error-color': 'var(--error-color)',
      },
      gridTemplateRows: {
        8: 'repeat(8, minmax(0, 8fr))',
      },
      gridRowStart: {
        8: '8',
      },
    },
  },
  plugins: [],
};
