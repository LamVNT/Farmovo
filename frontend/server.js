import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Health check endpoint for Azure
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router routes - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Use the port that Azure provides or default to 8080 (Azure requirement)
const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`💡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check available at: http://localhost:${port}/health`);
});
