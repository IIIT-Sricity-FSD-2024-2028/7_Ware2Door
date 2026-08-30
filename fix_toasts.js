const fs = require('fs');
const files = [
  'FRONTEND/WAREHOUSE/warehouse.js',
  'FRONTEND/TRANSIT_HUB/hub.js',
  'FRONTEND/LOCAL_AGENCY/agency.js',
  'FRONTEND/SUPER_USER/superuser.js'
];
files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  let newText = text.split('showToast("Backend connection failed.", true)').join('showToast(e.message || "Backend connection failed.", true)');
  if(text !== newText) {
    fs.writeFileSync(f, newText);
    console.log('Fixed', f);
  }
});
