/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  collectCoverageFrom: ["src/**/*.js"],
  coveragePathIgnorePatterns: ["node_modules/"],
};
