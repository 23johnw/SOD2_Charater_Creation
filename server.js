// Simple HTTP server for SOD2 Character Generator
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.xml': 'application/xml'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Remove query string and decode URL
    let filePath = decodeURIComponent(req.url.split('?')[0]);
    
    // Default to index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Get full file path
    const fullPath = path.join(__dirname, filePath);
    
    // Security: prevent directory traversal
    if (!fullPath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        
        // Read and serve file
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Server error');
                return;
            }
            
            // Get MIME type
            const ext = path.extname(fullPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`\n✓ Server running at http://localhost:${PORT}`);
    console.log(`✓ Open http://localhost:${PORT} in your browser\n`);
    console.log('Press Ctrl+C to stop the server\n');
});

