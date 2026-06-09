const fs = require('fs');
const path = require('path');

const replacements = {
  'Ã£': 'ã',
  'Ã§': 'ç',
  'Ãµ': 'õ',
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã­': 'í',
  'Ãª': 'ê',
  'Ã´': 'ô',
  'Ã‡': 'Ç',
  'Ãƒ': 'Ã',
  'Ã‰': 'É',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ã‚': 'Â',
  'ÃŠ': 'Ê',
  'Ã ': 'à',
  'Ã¢': 'â',
  'Ã€': 'À',
  'Ã ': 'Í',
  'Ã•': 'Õ',
  'Â ': ' ' // sometimes a non-breaking space gets corrupted to Â 
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  for (const [bad, good] of Object.entries(replacements)) {
    // global replacement
    content = content.split(bad).join(good);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Fixed:', file);
  }
});

console.log(`Finished fixing. ${changedCount} files modified.`);
