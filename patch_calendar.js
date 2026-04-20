const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'app.js');
let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// Remove pointer-events:none and change opacity 0→0.01 so showPicker() anchors near the button
// Replace all two occurrences (start date + end date buttons)
const oldStyle = "picker.style.cssText = `position:fixed;opacity:0;pointer-events:none;top:${_r0.top}px;left:${_r0.left}px;width:${_r0.width}px;height:${_r0.height}px;`;";
const newStyle = "picker.style.cssText = `position:fixed;opacity:0.01;top:${_r0.top}px;left:${_r0.left}px;width:${_r0.width}px;height:${_r0.height}px;`;";

if (!src.includes(oldStyle)) { console.error('MISS: picker style line not found'); process.exit(1); }
src = src.split(oldStyle).join(newStyle);
console.log('OK: picker opacity/pointer-events fixed (' + (src.split(newStyle).length - 1) + ' occurrences)');

// Also improve showPicker call: use try/catch with focus() for better cross-browser support
const oldShow = "picker.showPicker ? picker.showPicker() : picker.click();";
const newShow = "try { picker.showPicker(); } catch(ex) { picker.focus(); picker.click(); }";
if (!src.includes(oldShow)) { console.error('MISS: showPicker line not found'); process.exit(1); }
src = src.split(oldShow).join(newShow);
console.log('OK: showPicker call improved (' + (src.split(newShow).length - 1) + ' occurrences)');

fs.writeFileSync(file, src.replace(/\n/g, '\r\n'), 'utf8');
console.log('Done');
