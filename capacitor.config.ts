import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.growmexa.pbf',
  appName: 'GrowMexa PBF',
  webDir: 'out',
  server: {
    url: 'https://growmexa.com/?platform=android',
    cleartext: true
  }
};

export default config;
