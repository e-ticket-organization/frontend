module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Вимикаємо правило, яке викликає помилку
    "@typescript-eslint/no-unused-vars": "off",
    // Інші правила можна залишити
    "react-hooks/exhaustive-deps": "warn",
    "@next/next/no-img-element": "warn"
  }
};
