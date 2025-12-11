// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/tailwind.config.cjs

module.exports = {
  // DÜZELTME: v4 için 'class' yerine 'selector' kullanıyoruz.
  darkMode: "selector", 
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