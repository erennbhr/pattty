module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        bg2: "var(--color-bg-secondary)",
        card: "var(--color-card)",
        text: "var(--color-text)",
        text2: "var(--color-text-secondary)",
        primary: "var(--color-primary)",
        primaryHover: "var(--color-primary-hover)",
        borderColor: "var(--color-border)",
      },
      boxShadow: {
        card: "0px 2px 6px var(--color-shadow)",
      },
    },
  },
  plugins: [],
};
