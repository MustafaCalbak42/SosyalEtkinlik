export const theme = {
  colors: {
    primary: '#1976d2',
    secondary: '#f50057',
    background: '#f9f9f9',
    surface: '#ffffff',
    error: '#B00020',
    text: '#333333',
    onSurface: '#333333',
    disabled: '#9e9e9e',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f50057',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 4,
    m: 8,
    l: 16,
    xl: 24,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      light: 'System',
      thin: 'System',
    },
    fontSize: {
      xs: 12,
      s: 14,
      m: 16,
      l: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    },
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
  shadow: {
    light: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.2,
      shadowRadius: 5.0,
      elevation: 6,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6.0,
      elevation: 10,
    },
  },
};

export const getThemeColor = (colorName) => {
  return theme.colors[colorName] || theme.colors.primary;
};

export default theme; 