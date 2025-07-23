# Download Service

A comprehensive download service for the Electron application that provides batch downloading capabilities with progress tracking, retry logic, and concurrency control.

## Features

- **Sequential Downloads**: Download files one after another
- **Concurrent Downloads**: Download multiple files simultaneously with configurable concurrency
- **Retry Logic**: Automatic retry with exponential backoff for failed downloads
- **Progress Tracking**: Real-time progress updates via IPC
- **Cancellation**: Cancel all active downloads
- **Statistics**: Get download statistics and active download count

## Usage

### From Renderer Process

```typescript
// Sequential download
const result = await window.downloadAPI.downloadBatchSequential(
  ['https://example.com/file1.jpg', 'https://example.com/file2.jpg'],
  {
    outputDirectory: './downloads',
    retryLimit: 3,
    timeout: 30000
  }
);

// Concurrent download
const result = await window.downloadAPI.downloadBatchConcurrent(
  ['https://example.com/file1.jpg', 'https://example.com/file2.jpg'],
  {
    outputDirectory: './downloads',
    maxConcurrency: 2,
    retryLimit: 3,
    timeout: 30000
  }
);

// Listen for progress updates
const removeListener = window.downloadAPI.onDownloadProgress((progress) => {
  console.log(`${progress.filename}: ${progress.percent}%`);
  console.log(`Status: ${progress.status}`);
});

// Cancel all downloads
await window.downloadAPI.cancelAllDownloads();

// Get statistics
const stats = await window.downloadAPI.getDownloadStats();
```

### From Main Process

```typescript
import { getDownloadService } from '../modules/DownloadServiceModule.js';

const downloadService = getDownloadService();

// Sequential download
const results = await downloadService.downloadBatchSequential(urls, options);

// Concurrent download
const results = await downloadService.downloadBatchConcurrent(urls, options);
```

## Configuration Options

```typescript
interface DownloadOptions {
  maxConcurrency?: number;    // Max concurrent downloads (default: 3)
  retryLimit?: number;        // Max retry attempts (default: 3)
  timeout?: number;           // Timeout in ms (default: 30000)
  retryDelay?: number;        // Initial retry delay in ms (default: 1000)
  outputDirectory?: string;   // Output directory (default: './downloads')
}
```

## Progress Events

The download service emits progress events with the following structure:

```typescript
interface DownloadProgress {
  index: number;              // Current file index (1-based)
  total: number;              // Total number of files
  filename: string;           // Current filename
  url: string;                // Current file URL
  transferred: number;        // Bytes transferred
  totalSize?: number;         // Total file size (if available)
  percent: number;            // Progress percentage
  status: 'downloading' | 'completed' | 'failed' | 'retrying';
  error?: string;             // Error message (if failed)
}
```

## Error Handling

The service includes comprehensive error handling:

- Network errors are automatically retried with exponential backoff
- File system errors are reported in the results
- Invalid URLs are handled gracefully
- Timeout errors trigger retry logic

## Architecture

The download service is implemented as a singleton module that:

1. **DownloadService**: Core service class with download logic
2. **DownloadServiceModule**: Electron module for initialization
3. **downloadHandlers**: IPC handlers for renderer communication
4. **downloadAPI**: Preload script API for renderer access

## File Structure

```
src/
├── services/
│   └── downloadService.ts          # Core download service
├── modules/
│   └── DownloadServiceModule.ts     # Electron module
├── ipc/handlers/
│   └── downloadHandlers.ts          # IPC handlers
├── types/
│   └── downloadTypes.ts             # TypeScript interfaces
packages/preload/src/
└── download.ts                      # Preload API
packages/renderer/src/
├── types/
│   └── electron.d.ts                # Type declarations
└── examples/
    └── downloadExample.ts           # Usage examples
```