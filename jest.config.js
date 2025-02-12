
const now = new Date();
const formattedDateTime = now
  .toISOString()
  .replace(/:/g, '-')
  .split('.')[0];

module.exports = {
  collectCoverage: true,
  coverageDirectory: "./test/coverage",
  coverageReporters: ["json", "lcov", "text", "clover"],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "Bevops Test Report",
        outputPath: `./test/reports/${formattedDateTime}-test-report.html`,
        includeFailureMsg: true,
        includeConsoleLog: true,
      },
    ],
  ],
};
