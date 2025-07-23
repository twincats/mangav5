/**
 * Example usage of the Download Service
 * This file demonstrates how to use the download API from the renderer process
 */

import type { DownloadOptions, DownloadProgress, DownloadResult } from "../../../main/src/types/downloadTypes.js";

/**
 * Example: Sequential batch download
 */
export async function exampleSequentialDownload() {
  const urls = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg'
  ];

  const options: DownloadOptions = {
    outputDirectory: './downloads/sequential',
    retryLimit: 3,
    timeout: 30000,
    retryDelay: 1000
  };

  try {
    // Set up progress listener
    const removeProgressListener = window.downloadAPI.onDownloadProgress((progress: DownloadProgress) => {
      console.log(`Progress: ${progress.filename} - ${progress.percent}% (${progress.index}/${progress.total})`);
      console.log(`Status: ${progress.status}`);
      
      if (progress.error) {
        console.error(`Error: ${progress.error}`);
      }
    });

    // Start sequential download
    const result = await window.downloadAPI.downloadBatchSequential(urls, options);
    
    console.log('Sequential download completed:', result);
    
    // Clean up listener
    removeProgressListener();
    
    return result;
  } catch (error) {
    console.error('Sequential download failed:', error);
    throw error;
  }
}

/**
 * Example: Concurrent batch download
 */
export async function exampleConcurrentDownload() {
  const urls = [
    'https://example.com/file1.zip',
    'https://example.com/file2.zip',
    'https://example.com/file3.zip',
    'https://example.com/file4.zip',
    'https://example.com/file5.zip'
  ];

  const options: DownloadOptions = {
    outputDirectory: './downloads/concurrent',
    maxConcurrency: 2, // Download 2 files at the same time
    retryLimit: 3,
    timeout: 60000, // 60 seconds timeout for larger files
    retryDelay: 2000
  };

  try {
    // Set up progress listener with more detailed logging
    const removeProgressListener = window.downloadAPI.onDownloadProgress((progress: DownloadProgress) => {
      const { index, total, filename, percent, status, transferred, totalSize } = progress;
      
      console.log(`[${index}/${total}] ${filename}:`);
      console.log(`  Status: ${status}`);
      console.log(`  Progress: ${percent}%`);
      
      if (transferred && totalSize) {
        const mbTransferred = (transferred / 1024 / 1024).toFixed(2);
        const mbTotal = (totalSize / 1024 / 1024).toFixed(2);
        console.log(`  Size: ${mbTransferred}MB / ${mbTotal}MB`);
      }
      
      if (progress.error) {
        console.error(`  Error: ${progress.error}`);
      }
      
      console.log('---');
    });

    // Start concurrent download
    const result = await window.downloadAPI.downloadBatchConcurrent(urls, options);
    
    console.log('Concurrent download completed:', result);
    
    // Clean up listener
    removeProgressListener();
    
    return result;
  } catch (error) {
    console.error('Concurrent download failed:', error);
    throw error;
  }
}

/**
 * Example: Download with real-time UI updates
 */
export function setupDownloadUI() {
  // Create a simple progress display
  const progressContainer = document.createElement('div');
  progressContainer.id = 'download-progress';
  progressContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    z-index: 1000;
  `;
  document.body.appendChild(progressContainer);

  // Set up progress listener
  const removeProgressListener = window.downloadAPI.onDownloadProgress((progress: DownloadProgress) => {
    const progressElement = document.getElementById(`progress-${progress.index}`) || 
      (() => {
        const el = document.createElement('div');
        el.id = `progress-${progress.index}`;
        el.style.marginBottom = '5px';
        progressContainer.appendChild(el);
        return el;
      })();

    progressElement.innerHTML = `
      <div><strong>${progress.filename}</strong></div>
      <div>Status: ${progress.status}</div>
      <div>Progress: ${progress.percent}%</div>
      <div style="background: #ddd; height: 10px; border-radius: 5px; overflow: hidden;">
        <div style="background: ${progress.status === 'failed' ? '#f44' : '#4f4'}; height: 100%; width: ${progress.percent}%; transition: width 0.3s;"></div>
      </div>
      ${progress.error ? `<div style="color: red;">Error: ${progress.error}</div>` : ''}
    `;
  });

  // Add download controls
  const controlsContainer = document.createElement('div');
  controlsContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    z-index: 1000;
  `;

  const sequentialBtn = document.createElement('button');
  sequentialBtn.textContent = 'Start Sequential Download';
  sequentialBtn.onclick = () => exampleSequentialDownload();

  const concurrentBtn = document.createElement('button');
  concurrentBtn.textContent = 'Start Concurrent Download';
  concurrentBtn.onclick = () => exampleConcurrentDownload();

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel All Downloads';
  cancelBtn.onclick = async () => {
    const result = await window.downloadAPI.cancelAllDownloads();
    console.log('Cancel result:', result);
  };

  const statsBtn = document.createElement('button');
  statsBtn.textContent = 'Get Stats';
  statsBtn.onclick = async () => {
    const stats = await window.downloadAPI.getDownloadStats();
    console.log('Download stats:', stats);
  };

  controlsContainer.appendChild(sequentialBtn);
  controlsContainer.appendChild(document.createElement('br'));
  controlsContainer.appendChild(concurrentBtn);
  controlsContainer.appendChild(document.createElement('br'));
  controlsContainer.appendChild(cancelBtn);
  controlsContainer.appendChild(document.createElement('br'));
  controlsContainer.appendChild(statsBtn);

  document.body.appendChild(controlsContainer);

  // Return cleanup function
  return () => {
    removeProgressListener();
    progressContainer.remove();
    controlsContainer.remove();
  };
}

/**
 * Example: Manga chapter images download
 */
export async function downloadMangaChapter(chapterImageUrls: string[], mangaTitle: string, chapterNumber: number) {
  const options: DownloadOptions = {
    outputDirectory: `./manga/${mangaTitle}/Chapter ${chapterNumber}`,
    maxConcurrency: 3,
    retryLimit: 5,
    timeout: 30000,
    retryDelay: 1000
  };

  console.log(`Starting download for ${mangaTitle} - Chapter ${chapterNumber}`);
  console.log(`Total images: ${chapterImageUrls.length}`);

  try {
    const result = await window.downloadAPI.downloadBatchConcurrent(chapterImageUrls, options);
    
    const successCount = result.results?.filter((r: DownloadResult) => r.success).length || 0;
    const failCount = (result.results?.length || 0) - successCount;
    
    console.log(`Chapter download completed: ${successCount} success, ${failCount} failed`);
    
    return result;
  } catch (error) {
    console.error(`Failed to download chapter ${chapterNumber}:`, error);
    throw error;
  }
}