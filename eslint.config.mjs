import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,tsx}"] }, // Add TSX file support
  {
    languageOptions: {
      globals: globals.node,
      ecmaVersion: "latest", // Use the latest ECMAScript version for React
      sourceType: "module",
      parser: "@typescript-eslint/parser", // Use TypeScript parser for TSX files
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing
        },
      },
    },
    plugins: {
      react: eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
    },
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-useless-escape": "off",
      "react/react-in-jsx-scope": "off", // Not needed with React 17+
      "react/prop-types": "off", // Not needed with TypeScript
      "react-hooks/rules-of-hooks": "error", // Enforce Hooks rules
      "react-hooks/exhaustive-deps": "warn", // Warn about missing dependencies
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettier,
];
