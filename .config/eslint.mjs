import parserTs from "@typescript-eslint/parser";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

export default [
  {
    // Globally ignore the following paths
    ignores: [
      "node_modules/",
    ],
  },
  {
    files: ["**/*.ts", "**/*.js", "**/*.mjs"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      ...stylistic.configs.customize({
        "indent": 2,
        "jsx": false,
        "quote-props": "always",
        "semi": true,
        "brace-style": "1tbs",
      }).rules,
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    languageOptions: {
      ecmaVersion: 2022,
      parser: parserTs,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
];
