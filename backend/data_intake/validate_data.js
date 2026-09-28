const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node validate_data.js <path_to_json>");
  process.exit(1);
}

try {
  const content = fs.readFileSync(filePath, 'utf8');
  let data = [];
  
  if (filePath.endsWith('.json')) {
    data = JSON.parse(content);
  } else {
    console.error("Validation script currently only supports JSON fixtures for demonstration.");
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error("Error: Expected an array of records.");
    process.exit(1);
  }

  const rowCount = data.length;
  if (rowCount === 0) {
    console.log("File is empty.");
    process.exit(0);
  }

  const columnNames = Object.keys(data[0]);
  
  let missingValueCounts = {};
  let invalidDates = 0;
  let negativeVisitorCounts = 0;
  let impossibleHourValues = 0;
  let duplicateRows = 0;
  
  const typeSet = {};
  const seenRows = new Set();
  
  columnNames.forEach(col => {
    missingValueCounts[col] = 0;
    typeSet[col] = new Set();
  });

  data.forEach(row => {
    // Check for duplicates
    const rowString = JSON.stringify(row);
    if (seenRows.has(rowString)) {
      duplicateRows++;
    } else {
      seenRows.add(rowString);
    }

    columnNames.forEach(col => {
      const val = row[col];
      
      // Missing values
      if (val === null || val === undefined || val === '') {
        missingValueCounts[col]++;
      }
      
      // Data types
      if (val !== null && val !== undefined) {
        typeSet[col].add(typeof val);
      }
    });

    // Domain specific validations
    if (row['Date']) {
      // Basic check for YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row['Date']) || isNaN(Date.parse(row['Date']))) {
        invalidDates++;
      }
    }
    
    if (row['Hour'] !== undefined && row['Hour'] !== null) {
      if (typeof row['Hour'] !== 'number' || row['Hour'] < 0 || row['Hour'] > 23) {
        impossibleHourValues++;
      }
    }

    if (row['Visitor_Count'] !== undefined && row['Visitor_Count'] !== null) {
      if (typeof row['Visitor_Count'] !== 'number' || row['Visitor_Count'] < 0) {
        negativeVisitorCounts++;
      }
    }
  });

  console.log("=== Validation Report ===");
  console.log(`Columns: ${columnNames.join(', ')}`);
  console.log(`Row Count: ${rowCount}`);
  console.log("Data Types:");
  columnNames.forEach(col => {
    const types = Array.from(typeSet[col]).join(', ') || 'unknown';
    console.log(`  - ${col}: ${types}`);
  });
  
  console.log("Missing Value Counts:");
  columnNames.forEach(col => {
    console.log(`  - ${col}: ${missingValueCounts[col]}`);
  });
  
  console.log("\nAnomaly Detection:");
  console.log(`  - Duplicate Rows: ${duplicateRows}`);
  console.log(`  - Invalid Dates: ${invalidDates}`);
  console.log(`  - Negative Visitor Counts: ${negativeVisitorCounts}`);
  console.log(`  - Impossible Hour Values: ${impossibleHourValues}`);

  console.log("\nValidation Complete.");

} catch (err) {
  console.error("Error reading or processing the file:", err.message);
  process.exit(1);
}
