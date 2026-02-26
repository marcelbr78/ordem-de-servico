/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.spec.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.json',
        }],
    },
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverage: false,
    coverageDirectory: 'coverage',
};
