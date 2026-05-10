const fs = require('fs');
const glob = require('fs').readdirSync('src/components').map(f => 'src/components/' + f).filter(f => f.endsWith('.js'));

glob.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Colors to replace with variables
  content = content.replace(/'#fff1f0'/g, "'var(--badge-danger-bg)'");
  content = content.replace(/'#ffa39e'/g, "'var(--red)'");
  content = content.replace(/'#cf1322'/g, "'var(--badge-danger-text)'");
  content = content.replace(/'white'/g, "'var(--card)'");
  content = content.replace(/'#f5f5f5'/g, "'var(--hover-bg)'");
  content = content.replace(/'#ccc'/g, "'var(--border)'");
  content = content.replace(/'#eaeaea'/g, "'var(--border)'");
  content = content.replace(/'#eee'/g, "'var(--border)'");
  content = content.replace(/'#f0f0f0'/g, "'var(--hover-bg)'");
  content = content.replace(/'#f7fafc'/g, "'var(--hover-bg)'");
  content = content.replace(/'#c6f6d5'/g, "'var(--badge-success-bg)'");
  content = content.replace(/'#fed7d7'/g, "'var(--badge-danger-bg)'");
  content = content.replace(/'#f9f9f9'/g, "'var(--alt-bg)'");
  content = content.replace(/'#0A1628'/g, "'var(--primary)'");
  content = content.replace(/'#ff4d4f'/g, "'var(--red)'");
  content = content.replace(/'#52c41a'/g, "'var(--green)'");
  content = content.replace(/'#fff5f5'/g, "'var(--badge-danger-bg)'");
  content = content.replace(/'#fc8181'/g, "'var(--red)'");
  content = content.replace(/'#c53030'/g, "'var(--badge-danger-text)'");

  // Fix up specific issues where color: 'white' was replaced by color: 'var(--card)'
  // We want color: 'var(--text)' instead or just remove the hardcoded color if it's primary text.
  // We'll leave it as var(--card) for now if it's text over primary, but wait, text over primary should be var(--text) if the text variable changed?
  // Let's do a more precise replacement for color: 'white'
  content = content.replace(/color:\s*'var\(--card\)'/g, "color: 'var(--text)'");

  fs.writeFileSync(file, content);
});
