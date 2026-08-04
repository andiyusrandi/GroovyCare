import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.groovycare.pbf',
  appName: 'GroovyCare',
  webDir: 'out',
  server: {
    // Gantilah url dengan alamat IP lokal Mac Anda (misal: http://192.168.1.5:3002) 
    // jika ingin menguji langsung di handphone fisik lewat Wi-Fi yang sama
    url: 'https://growmexa.com/?platform=android',

    cleartext: true
  }
};

export default config;
