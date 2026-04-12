import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Minecraft palette
        grass: "#5D8C3E",
        dirt: "#8B6914",
        stone: "#7F7F7F",
        sky: "#87CEEB",
        diamond: "#4AEDD9",
        xpgold: "#FFD700",
        ender: "#8932B8",
        redstone: "#FF0000",
        obsidian: "#1A1A2E",
        nether: "#3D0C02",
        leaf: "#3B6E2A",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        body: ['"VT323"', "monospace"],
      },
      boxShadow: {
        block: "4px 4px 0 0 rgba(0,0,0,0.6)",
        blockSm: "2px 2px 0 0 rgba(0,0,0,0.6)",
        inset: "inset 0 -4px 0 0 rgba(0,0,0,0.35), inset 0 4px 0 0 rgba(255,255,255,0.18)",
      },
      animation: {
        chestpop: "chestpop 0.6s ease-out",
        xpfill: "xpfill 0.8s ease-out",
        wiggle: "wiggle 0.4s ease-in-out",
      },
      keyframes: {
        chestpop: {
          "0%": { transform: "scale(0.4) rotate(-15deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        xpfill: {
          "0%": { width: "0%" },
          "100%": { width: "var(--xp-target, 0%)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
