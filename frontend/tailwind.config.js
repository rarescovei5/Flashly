/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors');

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
    colors: {
      'c-dark': '#131313',
      'c-light': '#212121',
      'c-primary': '#FBE87E',
      'c-blue': '#1A87EC',
      'c-green': '#71F65A',
      'c-orange': '#FF7F3B',
      'c-pink': '#FD4798',
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      red: colors.red,
      emerald: colors.emerald,
      indigo: colors.indigo,
      yellow: colors.yellow,
      stone: colors.stone,
      sky: colors.sky,
      neutral: colors.neutral,
      gray: colors.gray,
      slate: colors.slate,
    },
  },
  plugins: [],
};
