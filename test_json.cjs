const fs = require('fs');
const path = 'c:\\Users\\Jean Bertin\\.codeium\\windsurf\\mcp_config.json';

try {
    const content = fs.readFileSync(path, 'utf8');
    console.log('Content length:', content.length);
    console.log('First 20 chars:', JSON.stringify(content.substring(0, 20)));
    JSON.parse(content);
    console.log('JSON is valid');
} catch (e) {
    console.error('JSON Error:', e.message);
}
