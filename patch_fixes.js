const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'app.js');
let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
let count = 0;

function patch(from, to, label) {
  if (!src.includes(from)) { console.error('MISS [' + label + ']:', JSON.stringify(from.slice(0, 80))); process.exit(1); }
  src = src.replace(from, to);
  count++;
  console.log('OK:', label);
}

// Fix createElement to handle 'disabled' like 'checked'
patch(
  `    } else if (key === 'checked') {\n      el.checked = Boolean(value);\n    } else {`,
  `    } else if (key === 'checked' || key === 'disabled') {\n      el[key] = Boolean(value);\n    } else {`,
  'createElement disabled support'
);

// #2: render() - save/restore window scroll position (stops settings panel jumping to top)
patch(
  `  render() {\n    if (this.currentScreen === 'loading' || this.currentScreen === 'error') window.scrollTo(0, 0);`,
  `  render() {\n    const _wsy = (this.currentScreen !== 'loading' && this.currentScreen !== 'error') ? window.scrollY : 0;\n    if (this.currentScreen === 'loading' || this.currentScreen === 'error') window.scrollTo(0, 0);`,
  'render save scroll'
);

patch(
  `    if (_savedScroll > 0) { requestAnimationFrame(() => { const _ns = this.container.querySelector('.settings-sidebar'); if (_ns) _ns.scrollTop = _savedScroll; }); }\n  }`,
  `    if (_savedScroll > 0) { requestAnimationFrame(() => { const _ns = this.container.querySelector('.settings-sidebar'); if (_ns) _ns.scrollTop = _savedScroll; }); }\n    if (_wsy > 0) requestAnimationFrame(() => window.scrollTo(0, _wsy));\n  }`,
  'render restore scroll'
);

// #4 + #4a: renderLineup() new header structure (topbar with Teams left / Print right) + disabled sort toggle
patch(
  `    return createElement('div', { className: 'lineup-screen' },\n      createElement('div', { className: 'lineup-header' },\n        createElement('button', { className: 'back-btn', onclick: () => this.showTeamSelect() }, '← Teams'),\n        createElement('h1', {}, \`\${this.selectedTeam} Lineup\`),\n        createElement('span', { className: 'info-bubble' }, \`\${lineup.length} batters\`),\n        createElement('button', { className: 'print-btn', onclick: () => this.printLineup() }, 'Print Lineup')\n      ),\n      createElement('div', { className: 'sort-container' },\n        createElement('select', {\n          className: 'sort-select',\n          onchange: (e) => { self.sortBy = e.target.value; self.render(); }\n        },\n          ...sortOptions.map(opt => createElement('option', { value: opt.value, ...(self.sortBy === opt.value ? { selected: true } : {}) }, opt.label))\n        ),\n        createElement('button', {\n          className: \`sort-toggle-btn\${self.sortOrder === 'desc' ? ' active' : ''}\`,\n          onclick: () => { self.sortOrder = self.sortOrder === 'asc' ? 'desc' : 'asc'; self.render(); }\n        }, '⇅')\n      ),`,
  `    return createElement('div', { className: 'lineup-screen' },\n      createElement('div', { className: 'lineup-header' },\n        createElement('div', { className: 'lineup-header__topbar' },\n          createElement('button', { className: 'back-btn', onclick: () => this.showTeamSelect() }, '← Teams'),\n          createElement('button', { className: 'print-btn', onclick: () => this.printLineup() }, 'Print Lineup')\n        ),\n        createElement('h1', {}, \`\${this.selectedTeam} Lineup\`),\n        createElement('div', { style: { textAlign: 'center', marginBottom: '8px' } },\n          createElement('span', { className: 'info-bubble' }, \`\${lineup.length} batters\`)\n        )\n      ),\n      createElement('div', { className: 'sort-container' },\n        createElement('select', {\n          className: 'sort-select',\n          onchange: (e) => { self.sortBy = e.target.value; self.render(); }\n        },\n          ...sortOptions.map(opt => createElement('option', { value: opt.value, ...(self.sortBy === opt.value ? { selected: true } : {}) }, opt.label))\n        ),\n        createElement('button', {\n          className: \`sort-toggle-btn\${self.sortOrder === 'desc' ? ' active' : ''}\`,\n          disabled: self.sortBy === 'number',\n          onclick: () => { self.sortOrder = self.sortOrder === 'asc' ? 'desc' : 'asc'; self.render(); }\n        }, '⇅')\n      ),`,
  'renderLineup header + disabled toggle'
);

// #5: start date calendar picker - position near button so calendar opens near the icon
patch(
  `                onclick: () => {\n                  const picker = document.createElement('input');\n                  picker.type = 'date';\n                  picker.style.cssText = 'position:fixed;opacity:0;pointer-events:none;top:0;left:0;';\n                  const cur = document.getElementById('startDate').value;`,
  `                onclick: (e) => {\n                  const picker = document.createElement('input');\n                  picker.type = 'date';\n                  const _r0 = e.currentTarget.getBoundingClientRect();\n                  picker.style.cssText = \`position:fixed;opacity:0;pointer-events:none;top:\${_r0.top}px;left:\${_r0.left}px;width:\${_r0.width}px;height:\${_r0.height}px;\`;\n                  const cur = document.getElementById('startDate').value;`,
  'start date picker position'
);

// #5: end date calendar picker
patch(
  `                onclick: () => {\n                  const picker = document.createElement('input');\n                  picker.type = 'date';\n                  picker.style.cssText = 'position:fixed;opacity:0;pointer-events:none;top:0;left:0;';\n                  const cur = document.getElementById('endDate').value;`,
  `                onclick: (e) => {\n                  const picker = document.createElement('input');\n                  picker.type = 'date';\n                  const _r0 = e.currentTarget.getBoundingClientRect();\n                  picker.style.cssText = \`position:fixed;opacity:0;pointer-events:none;top:\${_r0.top}px;left:\${_r0.left}px;width:\${_r0.width}px;height:\${_r0.height}px;\`;\n                  const cur = document.getElementById('endDate').value;`,
  'end date picker position'
);

fs.writeFileSync(file, src.replace(/\n/g, '\r\n'), 'utf8');
console.log(`\nDone: ${count} patches applied`);
