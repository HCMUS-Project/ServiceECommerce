module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin'],
    "extends": "./tsconfig.json",
    // extends: ['prettier'],
    overrides: [
        {
            files: ['**/*.js'],
            excludedFiles: ["node_modules", "dist", "coverage"],
        },
    ], root: true,
    env: {
        node: true,
        jest: true,
    },
    rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'semi': ['error', 'always'],
        'semi-spacing': ['error', { 'before': false, 'after': true }],
        'newline-before-return': 'error',
        'simple-import-sort/imports': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'indent': 'error',
    }
};
