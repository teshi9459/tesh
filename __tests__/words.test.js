const path = require("node:path");
const words = require(path.join(__dirname, "../src/plugins/words.js"));

const { countWords, formatReportTable } = words.__internal;

describe("countWords", () => {
  test("returns 0 for empty strings", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  test("collapses whitespace before counting", () => {
    expect(countWords("hello   world")).toBe(2);
    expect(countWords("multiple\nlines\twith\tspaces"))
      .toBe(3);
  });

  test("trims before counting", () => {
    expect(countWords("  leading and trailing  ")).toBe(3);
  });
});

describe("formatReportTable", () => {
  test("renders table with all columns", () => {
    const table = formatReportTable([
      {
        id: 1,
        username: "Tester",
        user_id: "123",
        word_count: 4,
        status: "open",
        channel_id: "999",
      },
    ]);
    expect(table).toContain("ID");
    expect(table).toContain("Tester");
    expect(table).toContain("<#999>");
  });
});
