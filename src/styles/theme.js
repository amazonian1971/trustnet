export const theme = {
  colors: {
    primary: {
      dark: '#2A0066',
      light: '#7B42F5'
    },
    secondary: {
      coral: '#FF6B6B',
      blue: '#4ECDC4',
      gold: '#FFD166'
    },
    background: {
      dark: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      light: 'linear-gradient(135deg, #f5f7fa, #e4edf5)'
    }
  },
  glass: (darkMode) => ({
    background: darkMode 
      ? 'rgba(42, 0, 102, 0.3)' 
      : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: darkMode 
      ? '1px solid rgba(123, 66, 245, 0.2)' 
      : '1px solid rgba(200, 200, 200, 0.2)',
    borderRadius: '16px'
  })
};