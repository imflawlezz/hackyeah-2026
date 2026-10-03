/** @type {import("prettier").Config & { tailwindStylesheet?: string }} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/app/globals.css",
};

export default config;
