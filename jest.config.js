const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

const { baseUrl, paths } = compilerOptions;

const ignores = [
  '/node_modules/',
  '/__fixtures__/',
  '/fixtures/',
  '/__tests__/helpers/',
  '/__tests__/utils/',
  '__mocks__',
];

module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>'],
  modulePaths: [baseUrl],
  moduleDirectories: ['node_modules'],
  transformIgnorePatterns: [...ignores],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.js?$',
  moduleFileExtensions: ['tsx', 'js', 'json', 'node', 'ts'],
  moduleNameMapper: pathsToModuleNameMapper(paths),
  clearMocks: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  // collectCoverage: true, // todo
  // coverageDirectory: "coverage",  // todo
};
