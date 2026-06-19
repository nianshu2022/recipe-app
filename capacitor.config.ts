import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nianshu.recipeapp',
  appName: '知味',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#fafaf9',
      style: 'DARK',
    }
  }
};

export default config;
