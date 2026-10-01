export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/storage/**', '**/uploads/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
];
