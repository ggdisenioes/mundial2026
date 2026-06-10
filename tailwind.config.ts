import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tw: {
          navy:  "#030F33",
          green: "#74F9C0",
          grey:  "#C5C6C7",
          light: "#F7F7F7",
        },
      },
    },
  },
  plugins: [],
};
export default config;
