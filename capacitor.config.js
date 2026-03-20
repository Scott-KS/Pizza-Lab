/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'app.pielab',
  appName: 'The Pie Lab',
  webDir: 'www',
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

module.exports = config;
