import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.pielab',
  appName: 'The Pie Lab',
  webDir: '.',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#f3ebe2',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#8c3524',
    },
    StatusBar: {
      backgroundColor: '#8c3524',
      style: 'LIGHT',
    },
  },
};

export default config;
