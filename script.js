const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

// Update :root
css = css.replace(':root {', `:root {
  --hover-bg: #f7fafc;
  --alt-bg: #f8f9fa;
  --badge-danger-bg: #fed7d7;
  --badge-danger-text: #742a2a;
  --badge-success-bg: #c6f6d5;
  --badge-success-text: #22543d;`);

// Update body.dark-mode
css = css.replace('body.dark-mode {', `body.dark-mode {
  --hover-bg: #1C2333;
  --alt-bg: #222b40;
  --badge-danger-bg: rgba(239, 68, 68, 0.2);
  --badge-danger-text: #fca5a5;
  --badge-success-bg: rgba(16, 185, 129, 0.2);
  --badge-success-text: #6ee7b7;`);

// Replace hardcoded values
css = css.replace(/background:\s*#(f7fafc|edf2f7)/ig, 'background: var(--hover-bg)');
css = css.replace(/background:\s*#(f8f9fa|fdfdfd)/ig, 'background: var(--alt-bg)');

// Update badges
css = css.replace(/background:\s*#c6f6d5/ig, 'background: var(--badge-success-bg)');
css = css.replace(/color:\s*#22543d/ig, 'color: var(--badge-success-text)');
css = css.replace(/background:\s*#fed7d7/ig, 'background: var(--badge-danger-bg)');
css = css.replace(/color:\s*#742a2a/ig, 'color: var(--badge-danger-text)');

fs.writeFileSync('src/App.css', css);

let indexCss = fs.readFileSync('src/index.css', 'utf8');
indexCss = indexCss.replace(/background-color:\s*#f8f9fa;/ig, 'background-color: var(--bg);');
fs.writeFileSync('src/index.css', indexCss);
