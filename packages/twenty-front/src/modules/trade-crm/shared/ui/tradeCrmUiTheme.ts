export const tradeCrmUiTheme = {
  colors: {
    page: '#f7f4ed',
    surface: '#fcfbf8',
    surfaceMuted: 'rgba(28, 28, 28, 0.03)',
    surfaceInteractive: 'rgba(28, 28, 28, 0.04)',
    ink: '#1c1c1c',
    inkMuted: '#5f5f5d',
    inkSoft: 'rgba(28, 28, 28, 0.62)',
    inkFaint: 'rgba(28, 28, 28, 0.4)',
    border: '#eceae4',
    borderInteractive: 'rgba(28, 28, 28, 0.18)',
    borderStrong: 'rgba(28, 28, 28, 0.4)',
    inverted: '#fcfbf8',
    focusRing: 'rgba(59, 130, 246, 0.5)',
  },
  shadow: {
    inset:
      'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px',
    focus: 'rgba(0,0,0,0.1) 0px 4px 12px',
    soft: '0 8px 24px rgba(28, 28, 28, 0.04)',
  },
  radius: {
    card: '16px',
    panel: '20px',
    pill: '9999px',
    control: '10px',
  },
  typography: {
    display:
      "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
  },
} as const;
