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
    content = content.replace(/&apos;/g, "'"); // First undo the bad replace
    content = content.replace(/apos;/g, "'"); // Catch any remaining ones from the second sed
    // Now safely escape the specific apostrophes in text
    // We'll just replace specific strings we know caused issues based on the lint output
    content = content.replace(/Type your address/g, "Type your address"); // No apostrophe here
    content = content.replace(/You haven't/g, "You haven&apos;t");
    content = content.replace(/What would you like to improve\?/g, "What would you like to improve?");
    content = content.replace(/I've built/g, "I&apos;ve built");
    content = content.replace(/You can't/g, "You can&apos;t");
    content = content.replace(/what you're/g, "what you&apos;re");
    content = content.replace(/page you're/g, "page you&apos;re");
    content = content.replace(/Don't list/g, "Don&apos;t list");
    content = content.replace(/how you'd/g, "how you&apos;d");
    content = content.replace(/That's/g, "That&apos;s");

    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
}
