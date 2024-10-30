import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        chibi: ['Chibi', 'bold'],
        easvhs: ['EasVhs', 'bold'],
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      'light', // Standard DaisyUI Themes
      'dark',
      'cupcake',
      'night',
      'sunset',
      'halloween'
      // Weitere Themes hinzufügen oder benutzerdefinierte Themes hier definieren
    ],
  },
};

export default config;
