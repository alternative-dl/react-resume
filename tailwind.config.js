// eslint-disable-next-line no-undef
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,css,scss}'],
  // darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        // Neo-brutalism: flat paper, black structure, one signal accent
        paper: '#f5f1e8',
        ink: '#0a0a0a',
        signal: '#ff4d00',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        blink: 'blink 1.1s step-end infinite',
        'grid-pan': 'grid-pan 8s linear infinite',
        marquee: 'marquee 24s linear infinite',
        'pop-in': 'pop-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      boxShadow: {
        brutal: '6px 6px 0 0 #0a0a0a',
        'brutal-sm': '4px 4px 0 0 #0a0a0a',
        'brutal-lg': '10px 10px 0 0 #0a0a0a',
      },
      keyframes: {
        blink: {
          '0%, 100%': {opacity: '1'},
          '50%': {opacity: '0'},
        },
        'grid-pan': {
          '0%': {backgroundPosition: '0 0'},
          '100%': {backgroundPosition: '44px 44px'},
        },
        marquee: {
          '0%': {transform: 'translateX(0%)'},
          '100%': {transform: 'translateX(-50%)'},
        },
        'pop-in': {
          '0%': {opacity: '0', transform: 'translateY(28px)'},
          '100%': {opacity: '1', transform: 'translateY(0)'},
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
