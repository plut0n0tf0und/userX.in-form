import { createTheme, alpha } from '@mui/material/styles';

const brandPrimary = '#B512B8';
const backgroundDefault = '#FAFAFA';
const backgroundSurface = '#FFFFFF';
const borderColor = '#E2E8F0';

const theme = createTheme({
  palette: {
    primary: {
      main: brandPrimary,
      light: alpha(brandPrimary, 0.8),
      dark: '#8B0A8E',
    },
    success: {
      main: '#059669', // Accessible green
    },
    error: {
      main: '#DC2626', // Accessible red
    },
    warning: {
      main: '#D97706', // Accessible amber
    },
    background: {
      default: backgroundDefault,
      paper: backgroundSurface,
    },
    text: {
      primary: '#1E293B',
      secondary: '#475569',
    },
    divider: borderColor,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Google Sans Text", sans-serif',
    fontSize: 14,
    body1: {
      fontSize: '16px',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '14px',
      lineHeight: 1.57,
    },
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: backgroundDefault,
          color: '#1E293B',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '16px',
          transition: 'all 200ms ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(181, 18, 184, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        sizeLarge: {
          padding: '14px 28px',
          fontSize: '18px',
        },
        contained: {
          '&:hover': {
            boxShadow: '0 6px 16px rgba(181, 18, 184, 0.25)',
          },
        },
        outlined: {
          borderColor: borderColor,
          color: '#1E293B',
          '&:hover': {
            backgroundColor: '#F8FAFC',
            borderColor: '#CBD5E1',
            boxShadow: 'none',
            transform: 'none',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: backgroundSurface,
            borderRadius: '12px',
            transition: 'all 150ms ease-in-out',
            '& fieldset': {
              borderColor: borderColor,
              transition: 'border-color 150ms ease-in-out',
            },
            '&:hover fieldset': {
              borderColor: '#94A3B8',
            },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              boxShadow: `0 0 0 3px ${alpha(brandPrimary, 0.15)}`,
              '& fieldset': {
                borderColor: brandPrimary,
                borderWidth: '2px',
              },
            },
            '&.Mui-error fieldset': {
              borderColor: '#DC2626',
            },
          },
          '& .MuiInputBase-input': {
            padding: '16px',
            fontSize: '16px',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: backgroundSurface,
          borderRadius: '12px',
          transition: 'all 150ms ease-in-out',
          '& fieldset': {
            borderColor: borderColor,
            transition: 'border-color 150ms ease-in-out',
          },
          '&:hover fieldset': {
            borderColor: '#94A3B8',
          },
          '&.Mui-focused': {
            backgroundColor: '#FFFFFF',
            boxShadow: `0 0 0 3px ${alpha(brandPrimary, 0.15)}`,
            '& fieldset': {
              borderColor: brandPrimary,
              borderWidth: '2px',
            },
          },
          '&.Mui-error fieldset': {
            borderColor: '#DC2626',
          },
        },
        input: {
          padding: '16px',
          fontSize: '16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 200ms ease-in-out',
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: '#CBD5E1',
          '&.Mui-active': {
            color: brandPrimary,
          },
          '&.Mui-completed': {
            color: brandPrimary,
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          marginTop: '6px',
          marginLeft: 0,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          color: '#1E293B',
          marginBottom: '6px',
          position: 'relative',
          transform: 'none',
          fontSize: '14px',
          '&.Mui-focused': {
            color: '#1E293B',
          }
        },
      },
    },
  },
});

export default theme;
