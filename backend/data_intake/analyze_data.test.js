const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { calculateStats, runAnalysis } = require('./analyze_data');

// Mocks
const tempDir = path.join(__dirname, 'temp_exports');
const tempInput = path.join(__dirname, 'temp_fixture.json');

// Test calculateStats
function testCalculateStats() {
  const result = calculateStats([10, 20, 30, 40, 50]);
  assert.strictEqual(result.min, 10);
  assert.strictEqual(result.max, 50);
  assert.strictEqual(result.mean, 30);
  assert.strictEqual(result.median, 30);
  
  const result2 = calculateStats([10, 20, 30, 40]);
  assert.strictEqual(result2.median, 25);
  console.log('testCalculateStats passed');
}

// Test aggregation and missing dates
function testAggregationAndMissingDates() {
  const mockData = [
    { Monument_ID: 'M1', Date: '2025-01-01', Hour: 9, Visitor_Count: 100 },
    { Monument_ID: 'M1', Date: '2025-01-01', Hour: 10, Visitor_Count: 150 },
    { Monument_ID: 'M1', Date: '2025-01-03', Hour: 9, Visitor_Count: 200 }
  ];
  
  fs.writeFileSync(tempInput, JSON.stringify(mockData));
  
  runAnalysis(tempInput, tempDir);
  
  const dailyAggregatePath = path.join(tempDir, 'daily_aggregate.csv');
  const reportPath = path.join(tempDir, 'analysis_report.md');
  
  assert(fs.existsSync(dailyAggregatePath), 'Daily aggregate output should exist');
  
  const dailyOutput = fs.readFileSync(dailyAggregatePath, 'utf8');
  const dailyLines = dailyOutput.trim().split('\n');
  assert.strictEqual(dailyLines.length, 3); // Header + 2025-01-01 + 2025-01-03
  
  assert.match(dailyLines[1], /M1,2025-01-01,250/); // 100 + 150
  assert.match(dailyLines[2], /M1,2025-01-03,200/);

  const report = fs.readFileSync(reportPath, 'utf8');
  assert.match(report, /Missing\/Closure Days: 1/); // Jan 2 is missing
  assert.match(report, /Valid Observations \(Days\): 2/);
  assert.match(report, /Min Daily Visitors: 200/);
  assert.match(report, /Max Daily Visitors: 250/);

  console.log('testAggregationAndMissingDates passed');
  
  // Clean up
  fs.unlinkSync(tempInput);
  fs.unlinkSync(dailyAggregatePath);
  fs.unlinkSync(path.join(tempDir, 'hourly_aggregate.csv'));
  fs.unlinkSync(reportPath);
  fs.rmdirSync(tempDir);
}

try {
  testCalculateStats();
  testAggregationAndMissingDates();
  console.log("All data intake tests passed.");
} catch (err) {
  console.error("Test failed:", err);
  process.exit(1);
}
