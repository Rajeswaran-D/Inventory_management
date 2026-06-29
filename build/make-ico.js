const { default: pngToIco } = require('png-to-ico');
const path = require('path');
const fs = require('fs');

// __dirname is d:\Inventory_management\build, so we go up one level for the project root
const root = path.join(__dirname, '..');
const src  = path.join(root, 'build', 'icon.png');
const dest = path.join(root, 'build', 'icon.ico');

console.log('Converting:', src);

pngToIco(src)
  .then(buf => {
    fs.writeFileSync(dest, buf);
    console.log('✅ icon.ico created at', dest, `(${buf.length} bytes)`);
  })
  .catch(err => {
    console.error('❌ Failed to create icon.ico:', err.message);
    process.exit(1);
  });
