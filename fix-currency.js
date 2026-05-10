const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace $ with ₹ (being careful with Template literals if needed, but the prompt says replace every dollar sign)
  // However, $ is used in JS templates like `${...}`. We MUST NOT replace those.
  // We only want to replace $ when it's a literal currency symbol.
  // Common patterns: '$', "$", `$...`, >$
  content = content.replace(/(['"> ])\$(?!\d+k)(?!\d+m)/g, '$1₹'); 
  // Wait, the prompt says "Replace every dollar sign with the Indian rupee symbol".
  // "Find every place in the entire codebase where a dollar sign appears... Do not leave a single dollar sign anywhere in the entire file."
  // This is a bit dangerous if it includes `${...}`. 
  // I will use a more surgical approach for JS files.
  
  if (file.endsWith('.js')) {
    // Replace literal $ in strings and HTML
    content = content.replace(/'\$/g, "'₹");
    content = content.replace(/"\$/g, '"₹');
    content = content.replace(/>\$/g, '>₹');
    content = content.replace(/ \$/g, ' ₹');
    // Also check for tickFormatter where it might be `$...`
    content = content.replace(/`\$/g, '`₹');
  } else {
    content = content.replace(/\$/g, '₹');
  }

  // Replace toLocaleString() with toLocaleString('en-IN')
  // Avoid replacing if it already has an argument.
  content = content.replace(/\.toLocaleString\(\)/g, ".toLocaleString('en-IN')");
  // Also fix cases where it might have 'en-US' or similar
  content = content.replace(/\.toLocaleString\('en-US'\)/g, ".toLocaleString('en-IN')");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
