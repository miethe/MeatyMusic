const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@meatymusic/ui$': '<rootDir>/../../packages/ui/src/index.ts',
    '^@meatymusic/ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/e2e/'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// ESM-only packages that Jest must transform: react-markdown's unified/remark/rehype/mdast/hast
// toolchain (via packages/ui MarkdownEditor) and refractor (via react-syntax-highlighter).
// Resolved from node_modules/.pnpm, since many are transitive and not obvious from package.json.
const esmPackages = [
  'react-markdown', 'remark-gfm', 'remark-parse', 'remark-rehype', 'rehype-sanitize', 'unified',
  'bail', 'is-plain-obj', 'trough', 'vfile', 'vfile-message', 'unist-util-stringify-position',
  'unist-util-visit', 'unist-util-visit-parents', 'unist-util-is', 'unist-util-position',
  'mdast-util-from-markdown', 'mdast-util-to-hast', 'mdast-util-to-string',
  'mdast-util-find-and-replace', 'mdast-util-gfm', 'mdast-util-gfm-autolink-literal',
  'mdast-util-gfm-footnote', 'mdast-util-gfm-strikethrough', 'mdast-util-gfm-table',
  'mdast-util-gfm-task-list-item', 'mdast-util-mdx-expression', 'mdast-util-mdx-jsx',
  'mdast-util-mdxjs-esm', 'mdast-util-phrasing', 'mdast-util-to-markdown', 'micromark',
  'micromark-core-commonmark', 'micromark-factory-destination', 'micromark-factory-label',
  'micromark-factory-space', 'micromark-factory-title', 'micromark-factory-whitespace',
  'micromark-util-character', 'micromark-util-chunked', 'micromark-util-classify-character',
  'micromark-util-combine-extensions', 'micromark-util-decode-numeric-character-reference',
  'micromark-util-decode-string', 'micromark-util-encode', 'micromark-util-html-tag-name',
  'micromark-util-normalize-identifier', 'micromark-util-resolve-all',
  'micromark-util-sanitize-uri', 'micromark-util-subtokenize', 'micromark-util-symbol',
  'micromark-util-types', 'micromark-extension-gfm', 'micromark-extension-gfm-autolink-literal',
  'micromark-extension-gfm-footnote', 'micromark-extension-gfm-strikethrough',
  'micromark-extension-gfm-table', 'micromark-extension-gfm-tagfilter',
  'micromark-extension-gfm-task-list-item', 'decode-named-character-reference',
  'character-entities', 'character-entities-html4', 'character-entities-legacy',
  'character-reference-invalid', 'ccount', 'escape-string-regexp', 'markdown-table', 'zwitch',
  'longest-streak', 'property-information', 'refractor', 'parse-entities', 'is-decimal',
  'is-alphabetical', 'is-alphanumerical', 'is-hexadecimal', 'space-separated-tokens',
  'comma-separated-tokens', 'style-to-object', 'inline-style-parser', 'hast-util-whitespace',
  'hast-util-to-jsx-runtime', 'hast-util-to-html', 'hast-util-sanitize',
  'hast-util-parse-selector', 'hastscript', 'html-url-attributes', 'html-void-elements',
  'web-namespaces', 'trim-lines', 'stringify-entities', 'devlop', 'estree-util-is-identifier-name',
];

// next/jest builds transformIgnorePatterns from next.config.js `transpilePackages` and only lets
// custom config APPEND patterns, so an allowlist in customJestConfig can never un-ignore
// node_modules. Rebuild its two pnpm-aware patterns here with the ESM packages added, which keeps
// these test-only packages out of the production Next build.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  const transpiled = [...require('./next.config.js').transpilePackages, ...esmPackages].join('|');
  config.transformIgnorePatterns = [
    `/node_modules/(?!.pnpm)(?!(${transpiled})/)`,
    `/node_modules/.pnpm/(?!(${transpiled.replace(/\//g, '\\+')})@)`,
    ...config.transformIgnorePatterns.filter((pattern) => !pattern.startsWith('/node_modules/')),
  ];
  return config;
};
