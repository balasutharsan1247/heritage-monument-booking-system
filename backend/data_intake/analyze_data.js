const fs = require('fs');
const path = require('path');

function calculateStats(values) {
  if (values.length === 0) return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);
  return { min, max, mean, median, stdDev };
}

function runAnalysis(inputFile, outputDir) {
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  const validRecords = [];
  const excludedRecords = [];
  const correctedRecords = [];
  
  rawData.forEach(record => {
    // Validate record
    let isValid = true;
    let isCorrected = false;

    // missing date or invalid count means exclude or correct
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!record.Date || !dateRegex.test(record.Date)) {
      isValid = false;
      excludedRecords.push({ ...record, reason: 'Invalid or missing Date' });
    }

    if (record.Visitor_Count === null || record.Visitor_Count === undefined || typeof record.Visitor_Count !== 'number' || record.Visitor_Count < 0) {
      isValid = false;
      excludedRecords.push({ ...record, reason: 'Invalid or missing Visitor_Count' });
    }

    if (isValid) {
      validRecords.push(record);
    }
  });

  const dailyData = {}; // { monumentId: { date: count } }
  const hourlyData = {}; // { monumentId: { date_hour: count } }
  const weekdayDist = {}; // { monumentId: { 0: count, 1: count ... 6: count } }
  const holidayDist = {}; // { monumentId: { holiday: count, regular: count } }

  const datesByMonument = {};
  
  validRecords.forEach(record => {
    const { Monument_ID, Date: dateStr, Hour, Visitor_Count, Is_Holiday } = record;
    if (!Monument_ID) return;

    if (!dailyData[Monument_ID]) dailyData[Monument_ID] = {};
    if (!hourlyData[Monument_ID]) hourlyData[Monument_ID] = {};
    if (!weekdayDist[Monument_ID]) weekdayDist[Monument_ID] = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    if (!holidayDist[Monument_ID]) holidayDist[Monument_ID] = { holiday: 0, regular: 0 };
    if (!datesByMonument[Monument_ID]) datesByMonument[Monument_ID] = new Set();

    datesByMonument[Monument_ID].add(dateStr);

    dailyData[Monument_ID][dateStr] = (dailyData[Monument_ID][dateStr] || 0) + Visitor_Count;
    
    if (Hour !== undefined && Hour !== null) {
      const key = `${dateStr}_${Hour}`;
      hourlyData[Monument_ID][key] = (hourlyData[Monument_ID][key] || 0) + Visitor_Count;
    }

    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getUTCDay();
    weekdayDist[Monument_ID][dayOfWeek] += Visitor_Count;

    if (Is_Holiday) {
      holidayDist[Monument_ID].holiday += Visitor_Count;
    } else {
      holidayDist[Monument_ID].regular += Visitor_Count;
    }
  });

  const reportLines = [];
  reportLines.push('# Data Quality Analysis Report');
  reportLines.push(`**Generated at:** ${new Date().toISOString()}`);
  reportLines.push('');
  reportLines.push(`- Total Records: ${rawData.length}`);
  reportLines.push(`- Valid Records (Observed): ${validRecords.length}`);
  reportLines.push(`- Excluded Records: ${excludedRecords.length}`);
  reportLines.push(`- Corrected Records: ${correctedRecords.length}`);
  reportLines.push('');

  // Daily output
  const dailyOutputLines = ['Monument_ID,Date,Total_Visitors'];
  const hourlyOutputLines = ['Monument_ID,Date,Hour,Visitors'];
  
  for (const [monument, datesObj] of Object.entries(dailyData)) {
    const dates = Object.keys(datesObj).sort();
    if (dates.length === 0) continue;

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const counts = dates.map(d => datesObj[d]);
    const stats = calculateStats(counts);

    let missingDays = 0;
    const missingPeriods = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    while (currentDate <= end) {
      const dStr = currentDate.toISOString().split('T')[0];
      if (!datesObj[dStr]) {
        missingDays++;
        missingPeriods.push(dStr);
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    reportLines.push(`## Monument: ${monument}`);
    reportLines.push(`- Data Coverage: ${startDate} to ${endDate}`);
    reportLines.push(`- Valid Observations (Days): ${dates.length}`);
    reportLines.push(`- Missing/Closure Days: ${missingDays}`);
    reportLines.push(`- Min Daily Visitors: ${stats.min}`);
    reportLines.push(`- Max Daily Visitors: ${stats.max}`);
    reportLines.push(`- Mean Daily Visitors: ${stats.mean.toFixed(2)}`);
    reportLines.push(`- Median Daily Visitors: ${stats.median}`);
    reportLines.push(`- Std Dev Daily Visitors: ${stats.stdDev.toFixed(2)}`);
    
    // Weekday distribution
    reportLines.push(`- Weekday Distribution:`);
    reportLines.push(`  - Sun: ${weekdayDist[monument][0]}, Mon: ${weekdayDist[monument][1]}, Tue: ${weekdayDist[monument][2]}, Wed: ${weekdayDist[monument][3]}, Thu: ${weekdayDist[monument][4]}, Fri: ${weekdayDist[monument][5]}, Sat: ${weekdayDist[monument][6]}`);
    
    // Holiday distribution
    reportLines.push(`- Holiday Distribution:`);
    reportLines.push(`  - Holiday Visitors: ${holidayDist[monument].holiday}, Regular Day Visitors: ${holidayDist[monument].regular}`);

    // Flags
    if (dates.length < 30) {
      reportLines.push(`- **FLAG**: Insufficient history for robust forecasting (< 30 days).`);
    }
    if (missingDays / (dates.length + missingDays) > 0.1) {
      reportLines.push(`- **FLAG**: Severe missingness detected (> 10% missing days).`);
    }
    const zScores = counts.map(c => (c - stats.mean) / (stats.stdDev || 1));
    if (zScores.some(z => z > 3 || z < -3)) {
      reportLines.push(`- **FLAG**: Outliers detected (Z-score > 3 or < -3).`);
    }
    if (missingPeriods.length > 0) {
       reportLines.push(`- **FLAG**: Closure or missing-data periods detected: ${missingPeriods.length} days missing.`);
    }
    reportLines.push('');

    dates.forEach(d => {
      dailyOutputLines.push(`${monument},${d},${datesObj[d]}`);
    });
    
    // Write Hourly
    const hoursObj = hourlyData[monument];
    Object.keys(hoursObj).sort().forEach(dh => {
      const [d, h] = dh.split('_');
      hourlyOutputLines.push(`${monument},${d},${h},${hoursObj[dh]}`);
    });
  }

  // Check adequacy for forecasting
  reportLines.push('## Data Adequacy Assessment');
  reportLines.push('This data is NOT claimed to be representative without further context.');
  reportLines.push('Depending on the flags above, the data may or may not be adequate for daily or hourly forecasting. Severe missingness or irregular intervals should be addressed before modeling.');

  fs.writeFileSync(path.join(outputDir, 'daily_aggregate.csv'), dailyOutputLines.join('\n'));
  fs.writeFileSync(path.join(outputDir, 'hourly_aggregate.csv'), hourlyOutputLines.join('\n'));
  fs.writeFileSync(path.join(outputDir, 'analysis_report.md'), reportLines.join('\n'));

  console.log('Analysis complete. Outputs generated in:', outputDir);
}

if (require.main === module) {
  const inputFile = process.argv[2] || path.join(__dirname, 'sample_fixture.json');
  const outputDir = process.argv[3] || path.join(__dirname, 'exports');
  runAnalysis(inputFile, outputDir);
}

module.exports = { runAnalysis, calculateStats };
