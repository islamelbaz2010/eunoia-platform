import { FlatCompat } from '@eslint/eslintrc'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const config = [
  {
    ignores: [
      '.next/**',
      'lib/prisma/generated/**',
      'node_modules/**',
      'tsconfig.tsbuildinfo',
      'eunoia-worker.js',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]

export default config
