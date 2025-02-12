
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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
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
