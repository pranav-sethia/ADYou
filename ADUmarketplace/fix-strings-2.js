const fs = require('fs');
const path = require('path');

const files = [
    'app/dashboard/listings/new/page.tsx',
    'app/not-found.tsx',
    'app/page.tsx',
    'components/dashboard/ListingTable.tsx',
    'components/dashboard/SavedListingsGrid.tsx',
    'components/feasibility/FeasibilityReport.tsx',
    'components/marketplace/ListingGrid.tsx'
];

for (const file of files) {
    const filePath = path.join('/Users/pranai/IrvineHacks2026/adubase', file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/''/g, "'");

    fs.writeFileSync(filePath, content);
    console.log('Fixed quotes in', file);
}
