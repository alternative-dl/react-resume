// eslint-disable-next-line no-undef
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,css,scss}'],
  // darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        yellow: '#efc603',
        primary: '#8CDFFA',
        // Digital brutalism palette
        paper: '#f5f1e8',
        ink: '#0a0a0a',
        acid: '#ffe600',
        flare: '#ff5c7c',
        sky: '#4dd4e8',
        lime: '#b4ff3d',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        brutal: '6px 6px 0 0 #0a0a0a',
        'brutal-sm': '4px 4px 0 0 #0a0a0a',
        'brutal-lg': '10px 10px 0 0 #0a0a0a',
        'brutal-acid': '6px 6px 0 0 #ffe600',
      },
      keyframes: {
        typing: {
          '0%, 100%': {width: '0%'},
          '30%, 70%': {width: '100%'},
        },
        blink: {
          '0%': {
            opacity: 0,
          },
        },
        'rotate-loader': {
          '0%': {
            transform: 'rotate(0deg)',
            strokeDashoffset: '360%',
          },
          '100%': {
            transform: 'rotate(360deg)',
            strokeDashoffset: '-360%',
          },
        },
      },
      screens: {
        touch: {raw: 'only screen and (pointer: coarse)'},
      },
    },
  },
  // eslint-disable-next-line no-undef
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
