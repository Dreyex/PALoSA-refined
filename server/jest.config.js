export default {
    testEnvironment: "node",
    verbose: true,
    testMatch: [
        // Muster für Testdateien
        "**/__tests__/**/*.js",
        "**/?(*.)+(spec|test).js",
    ],
    // Transform problematische ES modules
    transformIgnorePatterns: [
        "node_modules/(?!(pseudonymous-id-generator)/)"
    ],
    // Module name mapping für bessere Kompatibilität
    moduleNameMapper: {
        "^(.{1,2}/.*).js$": "$1",
        "^pseudonymous-id-generator$": "<rootDir>/__mocks__/pseudonymous-id-generator.js"
    },
    // Explicit transform configuration
    transform: {
        "^.+.js$": "babel-jest"
    }
};
