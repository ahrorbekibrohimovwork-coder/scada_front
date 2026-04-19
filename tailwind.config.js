/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        linka: "var(--linka)",
        "mb-can2": "var(--mb-can2)",
        "x-1": "var(--x-1)",
        "x-6iff-c4": "var(--x-6iff-c4)",
      },
    },
  },
  plugins: [],
};
