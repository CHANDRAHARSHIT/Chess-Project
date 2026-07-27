/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NOTE: these all resolve through CSS custom properties defined in
        // src/index.css (`:root` / `:root[data-theme="light"]`), so they
        // automatically track the active Theme setting instead of being
        // pinned to the dark palette. The `rgb(var(...) / <alpha-value>)`
        // form is required (rather than plain var()) so Tailwind's opacity
        // modifiers (e.g. bg-brand-bg/50) keep working.
        brand: {
          bg:        'rgb(var(--obsidian-rgb) / <alpha-value>)',
          surface:   'rgb(var(--obsidian-mid-rgb) / <alpha-value>)',
          accent:    'rgb(var(--gold-bright-rgb) / <alpha-value>)',
          text:      'rgb(var(--text-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
          border:    'var(--glass-border-gold)',
        },
        gold: {
          DEFAULT: '#D4AF6E',
          bright:  '#D4AF6E',
          mid:     '#B8934A',
          dim:     '#8B6F3A',
        },
        obsidian: {
          DEFAULT: 'rgb(var(--obsidian-rgb) / <alpha-value>)',
          mid:     'rgb(var(--obsidian-mid-rgb) / <alpha-value>)',
          light:   'rgb(var(--obsidian-light-rgb) / <alpha-value>)',
        },
        ivory: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
