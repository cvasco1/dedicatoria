/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:    { DEFAULT: '#08060F', mid: '#0F0B1C', light: '#1A1430' },
        grape:  { DEFAULT: '#2A1548', mid: '#3D1F6A', light: '#5A2E9C' },
        rose:   { DEFAULT: '#E8407A', light: '#F472A0', dark: '#B02D5C', muted: 'rgba(232,64,122,0.12)' },
        gold:   { DEFAULT: '#F0C060', light: '#F8D890', dark: '#B08020', muted: 'rgba(240,192,96,0.12)' },
        pearl:  { DEFAULT: '#FDF8FF', dim: '#B8A8CC', mute: 'rgba(253,248,255,0.15)' },
        teal:   { DEFAULT: '#40C8C8', muted: 'rgba(64,200,200,0.12)' },
      },
      fontFamily: {
        display: ['"Playfair Display"','Georgia','serif'],
        body:    ['"Crimson Pro"','Georgia','serif'],
        sign:    ['"Great Vibes"','cursive'],
        ui:      ['"DM Sans"','system-ui','sans-serif'],
      },
      animation: {
        'fall':      'fall linear infinite',
        'shimmer':   'shimmer 3s linear infinite',
        'heartbeat': 'heartbeat 2s ease-in-out infinite',
        'float':     'float 7s ease-in-out infinite',
        'glow-pulse':'glowPulse 2.5s ease-in-out infinite',
        'draw':      'draw 2s ease forwards',
        'reveal':    'reveal 0.6s ease forwards',
        'spin-slow': 'spin 25s linear infinite',
      },
      keyframes: {
        fall:      { '0%':{ transform:'translateY(-10px) rotate(0deg)', opacity:'1' }, '100%':{ transform:'translateY(105vh) rotate(720deg)', opacity:'0' } },
        shimmer:   { '0%':{ backgroundPosition:'-300% 0' }, '100%':{ backgroundPosition:'300% 0' } },
        heartbeat: { '0%,100%':{ transform:'scale(1)' }, '15%':{ transform:'scale(1.18)' }, '30%':{ transform:'scale(1)' }, '45%':{ transform:'scale(1.08)' }, '60%':{ transform:'scale(1)' } },
        float:     { '0%,100%':{ transform:'translateY(0px) rotate(-1deg)' }, '50%':{ transform:'translateY(-18px) rotate(1deg)' } },
        glowPulse: { '0%,100%':{ opacity:'0.4' }, '50%':{ opacity:'1' } },
        draw:      { '0%':{ strokeDashoffset:'800' }, '100%':{ strokeDashoffset:'0' } },
        reveal:    { '0%':{ clipPath:'inset(0 100% 0 0)' }, '100%':{ clipPath:'inset(0 0% 0 0)' } },
      },
      boxShadow: {
        'rose-glow': '0 0 40px rgba(232,64,122,0.45), 0 0 80px rgba(232,64,122,0.15)',
        'gold-glow': '0 0 30px rgba(240,192,96,0.4)',
        'card':      '0 8px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)',
        'polaroid':  '0 4px 12px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.5)',
        'inner':     'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
}
