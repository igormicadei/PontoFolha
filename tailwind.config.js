/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  // data-theme="dark" on <html> drives dark mode; "sys" is resolved to
  // dark/light in JS before being written as data-theme, so selector strategy suffices.
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Monochrome chrome
        primary: '#000000',
        'on-primary': '#ffffff',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        canvas: 'var(--bg)',
        card: 'var(--card)',
        hairline: 'var(--line)',
        'hairline-soft': 'var(--line-soft)',
        'surface-soft': 'var(--surface-soft)',
        // Accent (single-shot use)
        'accent-magenta': '#ff3d8b',
        // Color blocks
        'block-lime': 'var(--block-lime)',
        'block-lilac': 'var(--block-lilac)',
        'block-cream': '#f4ecd6',
        'block-pink': '#efd4d4',
        'block-mint': '#c8e6cd',
        'block-coral': '#f3c9b6',
        'block-navy': '#1f1d3d',
        // Semantic (app extension, tuned to pastel family)
        success: 'var(--green)',
        'success-tint': 'var(--green-tint)',
        error: 'var(--red)',
        'error-tint': 'var(--red-tint)',
        warn: 'var(--amber)',
        'warn-tint': 'var(--amber-tint)'
      },
      borderRadius: {
        xs: '2px',
        sm: '6px',
        md: '8px',
        lg: '24px',
        xl: '32px',
        pill: '50px',
        full: '9999px'
      },
      spacing: {
        hair: '1px',
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '96px'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
