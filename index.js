const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const socket = io('http://127.0.0.1:3000');

const filePath = path.join(__dirname, 'theFile.zip');
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

fs.stat(filePath, (err, stats) => {
    if (err) {
        return console.error('Error reading file stats:', err);
    }

    const fileSize = stats.size;
    const fileName = path.basename(filePath);
    let offset = 0;

    socket.emit('start-upload', { fileName });

    const readStream = fs.createReadStream(filePath, { highWaterMark: CHUNK_SIZE });

    readStream.on('data', (chunk) => {
        socket.emit('upload-chunk', { chunk: Array.from(chunk) }); // Convert to array for socket.io
        offset += chunk.length;
        console.log(`Progress: ${(offset / fileSize * 100).toFixed(2)}%`);
    });

    readStream.on('end', () => {
        socket.emit('end-upload');
    });
});

socket.on('chunk-received', (data) => {
    console.log(`Chunk received: ${data.receivedSize} bytes`);
});

socket.on('file-upload-status', (status) => {
    if (status.success) {
        console.log('File uploaded successfully:', status.message);
    } else {
        console.error('File upload failed:', status.message);
    }
});
