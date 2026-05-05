const fs = require('fs');
const path = require('path');
const filePath = 'c:/Users/dell/sagethon/PrepWise-AI/app/dashboard/reports/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let j = 0; j < line.length; j++) {
        let char = line[j];
        if (char === '{') stack.push({ char, line: i + 1 });
        else if (char === '}') {
            if (stack.length === 0 || stack[stack.length - 1].char !== '{') {
                console.log(`Unmatched } at line ${i + 1}`);
            } else {
                stack.pop();
            }
        }
        else if (char === '(') stack.push({ char, line: i + 1 });
        else if (char === ')') {
            if (stack.length === 0 || stack[stack.length - 1].char !== '(') {
                console.log(`Unmatched ) at line ${i + 1}`);
            } else {
                stack.pop();
            }
        }
    }
}

if (stack.length > 0) {
    console.log('Unclosed items:');
    stack.forEach(item => console.log(`${item.char} at line ${item.line}`));
} else {
    console.log('Braces and parentheses are balanced!');
}
