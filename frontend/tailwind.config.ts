import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Neutrals
        canvas:       'var(--cl-canvas)',
        surface:      'var(--cl-surface)',
        sunken:       'var(--cl-sunken)',
        'border-subtle': 'var(--cl-border-subtle)',
        // Text
        text: {
          DEFAULT:   'var(--cl-text)',
          secondary: 'var(--cl-text-secondary)',
          muted:     'var(--cl-text-muted)',
        },
        // Navy ramp
        navy: {
          50:  'var(--cl-navy-50)',
          100: 'var(--cl-navy-100)',
          600: 'var(--cl-navy-600)',
          700: 'var(--cl-navy-700)',
          800: 'var(--cl-navy-800)',
          900: 'var(--cl-navy-900)',
        },
        // Risk states
        risk: {
          'high-fg':     'var(--cl-risk-high-fg)',
          'high-bg':     'var(--cl-risk-high-bg)',
          'high-border': 'var(--cl-risk-high-border)',
          'med-fg':      'var(--cl-risk-med-fg)',
          'med-bg':      'var(--cl-risk-med-bg)',
          'med-border':  'var(--cl-risk-med-border)',
          'low-fg':      'var(--cl-risk-low-fg)',
          'low-bg':      'var(--cl-risk-low-bg)',
          'low-border':  'var(--cl-risk-low-border)',
        },
      },
      borderColor: {
        DEFAULT: 'var(--cl-border)',
        strong:  'var(--cl-border-strong)',
      },
      borderRadius: {
        sm: 'var(--cl-radius-sm)',
        DEFAULT: 'var(--cl-radius)',
        lg: 'var(--cl-radius-lg)',
      },
      boxShadow: {
        1: 'var(--cl-elev-1)',
        2: 'var(--cl-elev-2)',
        3: 'var(--cl-elev-3)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '2.75rem', fontWeight: '600' }],
        'h1':      ['1.75rem', { lineHeight: '2.125rem', fontWeight: '600' }],
        'h2':      ['1.375rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'h3':      ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1rem',     { lineHeight: '1.625rem', fontWeight: '400' }],
        'body':    ['0.9375rem',{ lineHeight: '1.4375rem', fontWeight: '400' }],
        'caption': ['0.8125rem',{ lineHeight: '1.25rem', fontWeight: '400' }],
        'label':   ['0.75rem',  { lineHeight: '1rem', fontWeight: '600', letterSpacing: '0.06em' }],
        'data':    ['0.875rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        'citation':['0.78125rem',{ lineHeight: '1.25rem', fontWeight: '400' }],
      },
      transitionDuration: {
        instant: '80ms',
        fast:    '140ms',
        base:    '200ms',
        slow:    '320ms',
        entrance:'480ms',
        count:   '700ms',
      },
      maxWidth: {
        'marketing': '1120px',
        'app':       '1320px',
        'prose':     '720px',
      },
      spacing: {
        // 4px base scale additions (Tailwind's defaults cover most)
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}

export default config
