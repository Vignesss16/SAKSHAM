
import fs from 'fs';

const content = fs.readFileSync('c:/Users/dell/sagethon/PrepWise-AI/app/dashboard/daily/page.tsx', 'utf8');

let braceStack = [];
let parenStack = [];
let bracketStack = [];

const lines = content.split('\n');

for (let lineNum = 0; lineNum < lines.length; lineNum++) {
  const line = lines[lineNum];
  for (let col = 0; col < line.length; col++) {
    const char = line[col];
    if (char === '{') braceStack.push({ line: lineNum + 1, col: col + 1 });
    if (char === '}') {
      if (braceStack.length === 0) console.log(`Extra } at ${lineNum + 1}:${col + 1}`);
      else braceStack.pop();
    }
    if (char === '(') parenStack.push({ line: lineNum + 1, col: col + 1 });
    if (char === ')') {
      if (parenStack.length === 0) console.log(`Extra ) at ${lineNum + 1}:${col + 1}`);
      else parenStack.pop();
    }
    if (char === '[') bracketStack.push({ line: lineNum + 1, col: col + 1 });
    if (char === ']') {
      if (bracketStack.length === 0) console.log(`Extra ] at ${lineNum + 1}:${col + 1}`);
      else bracketStack.pop();
    }
  }
}

console.log('Unclosed Braces:', braceStack);
console.log('Unclosed Parens:', parenStack);
console.log('Unclosed Brackets:', bracketStack);
