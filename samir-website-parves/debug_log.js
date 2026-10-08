const fs = require('fs');

const logPath = 'C:/Users/Parves Mosarof new/.gemini/antigravity-ide/brain/cae01bca-b88e-487c-be3c-e420ac68497d/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

const fileLines = {};
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'VIEW_FILE' && obj.content.includes('app/dashboard/page.tsx') && obj.step_index < 200) {
      const parts = obj.content.split('\n');
      for (const part of parts) {
        const match = part.match(/^(\d+): (.*)$/);
        if (match) {
          const lineNum = parseInt(match[1], 10);
          const lineContent = match[2];
          fileLines[lineNum] = lineContent;
        }
      }
    }
  } catch (e) {}
}

const lineKeys = Object.keys(fileLines).map(Number);
const maxLine = Math.max(...lineKeys);
console.log('Max line:', maxLine);

// Print lines 150-180
console.log('Lines 150-180:');
for (let i = 150; i <= 180; i++) {
  if (fileLines[i] !== undefined) console.log(`${i}: ${fileLines[i]}`);
}

// Print lines 2370-2401
console.log('Lines 2370-2401:');
for (let i = 2370; i <= 2401; i++) {
  if (fileLines[i] !== undefined) console.log(`${i}: ${fileLines[i]}`);
}
