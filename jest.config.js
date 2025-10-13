module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/js/vendor/**/*.js'
    ],
    coverageThreshold: {
        global: {
            statements: 90,
            branches: 85,
            functions: 90,
            lines: 90
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    }
};