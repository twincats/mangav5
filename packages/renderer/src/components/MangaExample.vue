<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Types for manga data
interface MangaStatus {
  statusId: number;
  statusName: string;
}

interface Manga {
  mangaId: number;
  mainTitle: string;
  description: string | null; // Keep as null since this is from database
  year: number | null; // Keep as null since this is from database
  statusId: number | null; // Keep as null since this is from database
  createdAt: string;
  updatedAt: string;
}

interface Chapter {
  chapterId: number;
  mangaId: number;
  chapterNumber: number;
  chapterTitle: string | null;
  volume: number | null;
  translatorGroup: string | null;
  releaseTime: string | null;
  language: string | null;
  statusRead: boolean;
  path: string | null;
  isCompressed: boolean;
  status: 'valid' | 'missing' | 'corrupted';
  createdAt: string;
}

// Batch insert types
interface BatchMangaData {
  mainTitle: string;
  description?: string;
  year?: number;
  statusId?: number;
  alternativeTitles?: string[];
  chapters?: {
    chapterNumber: number;
    chapterTitle?: string;
    volume?: number;
    translatorGroup?: string;
    releaseTime?: string;
    language?: string;
    path?: string;
    isCompressed?: boolean;
    status?: 'valid' | 'missing' | 'corrupted';
  }[];
}

interface BatchInsertResult {
  success: boolean;
  insertedManga: number;
  insertedChapters: number;
  errors?: string[];
}

// State variables
const mangaList = ref<Manga[]>([]);
const statusList = ref<MangaStatus[]>([]);
const selectedManga = ref<Manga | null>(null);
const chapters = ref<Chapter[]>([]);
const loading = ref(false);
const error = ref('');

// Form data for creating a new manga
const newManga = ref({
  mainTitle: '',
  description: '',
  year: undefined as number | undefined,
  statusId: undefined as number | undefined,
  alternativeTitles: [] as string[],
});

const newAltTitle = ref('');

// Batch insert form data
const batchMangaList = ref<BatchMangaData[]>([
  {
    mainTitle: '',
    description: '',
    year: undefined,
    statusId: undefined,
    alternativeTitles: [],
    chapters: []
  }
]);

const newBatchAltTitle = ref('');
const newBatchChapter = ref({
  chapterNumber: 1,
  chapterTitle: '',
  volume: undefined as number | undefined,
  translatorGroup: '',
  releaseTime: '',
  language: '',
  path: '',
  isCompressed: false,
  status: 'valid' as 'valid' | 'missing' | 'corrupted'
});

// Load manga list and statuses on component mount
onMounted(async () => {
  try {
    loading.value = true;
    await loadStatuses();
    await loadMangaList();
  } catch (err) {
    error.value = 'Failed to load initial data';
    console.error(err);
  } finally {
    loading.value = false;
  }
});

// Load manga statuses
async function loadStatuses() {
  try {
    statusList.value = await window.mangaAPI.getAllStatuses();
  } catch (err) {
    console.error('Failed to load statuses:', err);
    error.value = 'Failed to load manga statuses';
  }
}

// Load all manga
async function loadMangaList() {
  try {
    mangaList.value = await window.mangaAPI.getAllManga();
  } catch (err) {
    console.error('Failed to load manga list:', err);
    error.value = 'Failed to load manga list';
  }
}

// Load chapters for a manga
async function loadChapters(mangaId: number) {
  try {
    chapters.value = await window.mangaAPI.getChapters(mangaId);
  } catch (err) {
    console.error('Failed to load chapters:', err);
    error.value = 'Failed to load chapters';
  }
}

// Select a manga to view details
async function selectManga(manga: Manga) {
  selectedManga.value = manga;
  await loadChapters(manga.mangaId);
}

// Add alternative title to the new manga form
function addAltTitle() {
  if (newAltTitle.value.trim()) {
    newManga.value.alternativeTitles.push(newAltTitle.value.trim());
    newAltTitle.value = '';
  }
}

// Remove alternative title from the new manga form
function removeAltTitle(index: number) {
  newManga.value.alternativeTitles.splice(index, 1);
}

// Create a new manga
async function createManga() {
  if (!newManga.value.mainTitle) {
    error.value = 'Main title is required';
    return;
  }
  
  try {
    loading.value = true;
    error.value = '';
    
    await window.mangaAPI.createManga(newManga.value);
    
    // Reset form
    newManga.value = {
      mainTitle: '',
      description: '',
      year: undefined,
      statusId: undefined,
      alternativeTitles: [],
    };
    
    // Reload manga list
    await loadMangaList();
  } catch (err) {
    console.error('Failed to create manga:', err);
    error.value = 'Failed to create manga';
  } finally {
    loading.value = false;
  }
}

// Batch insert manga with chapters
async function batchInsertManga() {
  // Validate required fields
  const validManga = batchMangaList.value.filter(manga => manga.mainTitle.trim());
  if (validManga.length === 0) {
    error.value = 'At least one manga with title is required';
    return;
  }
  
  try {
    loading.value = true;
    error.value = '';
    
    const result: BatchInsertResult = await window.mangaAPI.batchInsertManga(validManga);
    
    if (result.success) {
      alert(`Batch insert completed!\nInserted: ${result.insertedManga} manga, ${result.insertedChapters} chapters`);
      
      // Reset batch form
      batchMangaList.value = [{
        mainTitle: '',
        description: '',
        year: undefined,
        statusId: undefined,
        alternativeTitles: [],
        chapters: []
      }];
      
      // Reload manga list
      await loadMangaList();
    } else {
      error.value = `Batch insert failed: ${result.errors?.join(', ')}`;
    }
  } catch (err) {
    console.error('Failed to batch insert manga:', err);
    error.value = 'Failed to batch insert manga';
  } finally {
    loading.value = false;
  }
}

// Add new manga to batch form
function addBatchManga() {
  batchMangaList.value.push({
    mainTitle: '',
    description: '',
    year: undefined,
    statusId: undefined,
    alternativeTitles: [],
    chapters: []
  });
}

// Remove manga from batch form
function removeBatchManga(index: number) {
  if (batchMangaList.value.length > 1) {
    batchMangaList.value.splice(index, 1);
  }
}

// Add alternative title to batch manga
function addBatchAltTitle(mangaIndex: number) {
  if (newBatchAltTitle.value.trim()) {
    if (!batchMangaList.value[mangaIndex].alternativeTitles) {
      batchMangaList.value[mangaIndex].alternativeTitles = [];
    }
    batchMangaList.value[mangaIndex].alternativeTitles!.push(newBatchAltTitle.value.trim());
    newBatchAltTitle.value = '';
  }
}

// Remove alternative title from batch manga
function removeBatchAltTitle(mangaIndex: number, titleIndex: number) {
  batchMangaList.value[mangaIndex].alternativeTitles?.splice(titleIndex, 1);
}

// Add chapter to batch manga
function addBatchChapter(mangaIndex: number) {
  if (newBatchChapter.value.chapterNumber > 0) {
    if (!batchMangaList.value[mangaIndex].chapters) {
      batchMangaList.value[mangaIndex].chapters = [];
    }
    
    batchMangaList.value[mangaIndex].chapters!.push({
      chapterNumber: newBatchChapter.value.chapterNumber,
      chapterTitle: newBatchChapter.value.chapterTitle || undefined,
      volume: newBatchChapter.value.volume || undefined,
      translatorGroup: newBatchChapter.value.translatorGroup || undefined,
      releaseTime: newBatchChapter.value.releaseTime || undefined,
      language: newBatchChapter.value.language || undefined,
      path: newBatchChapter.value.path || undefined,
      isCompressed: newBatchChapter.value.isCompressed,
      status: newBatchChapter.value.status,
    });
    
    // Reset chapter form
    newBatchChapter.value = {
      chapterNumber: newBatchChapter.value.chapterNumber + 1,
      chapterTitle: '',
      volume: undefined,
      translatorGroup: '',
      releaseTime: '',
      language: '',
      path: '',
      isCompressed: false,
      status: 'valid' as 'valid' | 'missing' | 'corrupted'
    };
  }
}

// Remove chapter from batch manga
function removeBatchChapter(mangaIndex: number, chapterIndex: number) {
  batchMangaList.value[mangaIndex].chapters?.splice(chapterIndex, 1);
}

// Delete a manga
async function deleteManga(mangaId: number) {
  if (!confirm('Are you sure you want to delete this manga?')) {
    return;
  }
  
  try {
    loading.value = true;
    await window.mangaAPI.deleteManga(mangaId);
    
    if (selectedManga.value?.mangaId === mangaId) {
      selectedManga.value = null;
      chapters.value = [];
    }
    
    await loadMangaList();
  } catch (err) {
    console.error('Failed to delete manga:', err);
    error.value = 'Failed to delete manga';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="manga-example">
    <h1>Manga Database Example</h1>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div class="loading-overlay" v-if="loading">
      <div class="loading-spinner"></div>
    </div>
    
    <div class="container">
      <!-- Create New Manga Form -->
      <div class="create-manga-form">
        <h2>Add New Manga</h2>
        
        <div class="form-group">
          <label for="mainTitle">Main Title*</label>
          <input 
            id="mainTitle" 
            v-model="newManga.mainTitle" 
            type="text" 
            required
          />
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description" 
            v-model="newManga.description" 
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="year">Publication Year</label>
          <input 
            id="year" 
            v-model.number="newManga.year" 
            type="number" 
            min="1900" 
            max="2100"
          />
        </div>
        
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" v-model="newManga.statusId">
            <option :value="undefined">Select a status</option>
            <option 
              v-for="status in statusList" 
              :key="status.statusId" 
              :value="status.statusId"
            >
              {{ status.statusName }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Alternative Titles</label>
          <div class="alt-title-input">
            <input 
              v-model="newAltTitle" 
              type="text" 
              placeholder="Add alternative title"
            />
            <button @click="addAltTitle" type="button">Add</button>
          </div>
          
          <ul class="alt-titles-list">
            <li v-for="(title, index) in newManga.alternativeTitles" :key="index">
              {{ title }}
              <button @click="removeAltTitle(index)" type="button" class="remove-btn">
                ×
              </button>
            </li>
          </ul>
        </div>
        
        <button @click="createManga" type="button" class="create-btn">
          Create Manga
        </button>
      </div>
      
      <!-- Batch Insert Manga Form -->
      <div class="batch-insert-form">
        <h2>Batch Insert Manga</h2>
        
        <div v-for="(manga, mangaIndex) in batchMangaList" :key="mangaIndex" class="batch-manga-item">
          <div class="batch-manga-header">
            <h3>Manga {{ mangaIndex + 1 }}</h3>
            <button 
              v-if="batchMangaList.length > 1" 
              @click="removeBatchManga(mangaIndex)" 
              type="button" 
              class="remove-btn"
              title="Remove manga"
            >
              ×
            </button>
          </div>
          
          <div class="form-group">
            <label :for="'batchTitle' + mangaIndex">Main Title*</label>
            <input 
              :id="'batchTitle' + mangaIndex" 
              v-model="manga.mainTitle" 
              type="text" 
              required
            />
          </div>
          
          <div class="form-group">
            <label :for="'batchDesc' + mangaIndex">Description</label>
            <textarea 
              :id="'batchDesc' + mangaIndex" 
              v-model="manga.description" 
              rows="2"
            ></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label :for="'batchYear' + mangaIndex">Year</label>
              <input 
                :id="'batchYear' + mangaIndex" 
                v-model.number="manga.year" 
                type="number" 
                min="1900" 
                max="2100"
              />
            </div>
            
            <div class="form-group">
              <label :for="'batchStatus' + mangaIndex">Status</label>
              <select :id="'batchStatus' + mangaIndex" v-model="manga.statusId">
                <option :value="undefined">Select status</option>
                <option 
                  v-for="status in statusList" 
                  :key="status.statusId" 
                  :value="status.statusId"
                >
                  {{ status.statusName }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- Alternative Titles -->
          <div class="form-group">
            <label>Alternative Titles</label>
            <div class="alt-title-input">
              <input 
                v-model="newBatchAltTitle" 
                type="text" 
                placeholder="Add alternative title"
              />
              <button @click="addBatchAltTitle(mangaIndex)" type="button">Add</button>
            </div>
            
            <ul class="alt-titles-list" v-if="manga.alternativeTitles && manga.alternativeTitles.length > 0">
              <li v-for="(title, titleIndex) in manga.alternativeTitles" :key="titleIndex">
                {{ title }}
                <button @click="removeBatchAltTitle(mangaIndex, titleIndex)" type="button" class="remove-btn">
                  ×
                </button>
              </li>
            </ul>
          </div>
          
          <!-- Chapters -->
          <div class="form-group">
            <label>Chapters</label>
            <div class="chapter-input">
              <div class="chapter-input-row">
                <input 
                  v-model.number="newBatchChapter.chapterNumber" 
                  type="number" 
                  min="1" 
                  placeholder="Chapter #"
                  class="chapter-number-input"
                />
                <input 
                  v-model="newBatchChapter.chapterTitle" 
                  type="text" 
                  placeholder="Chapter title"
                  class="chapter-title-input"
                />
                <input 
                  v-model.number="newBatchChapter.volume" 
                  type="number" 
                  min="1" 
                  placeholder="Volume"
                  class="volume-input"
                />
              </div>
              <div class="chapter-input-row">
                <input 
                  v-model="newBatchChapter.translatorGroup" 
                  type="text" 
                  placeholder="Translator group"
                  class="translator-input"
                />
                <input 
                  v-model="newBatchChapter.releaseTime" 
                  type="text" 
                  placeholder="Release time"
                  class="release-input"
                />
                <input 
                  v-model="newBatchChapter.language" 
                  type="text" 
                  placeholder="Language"
                  class="language-input"
                />
              </div>
              <div class="chapter-input-row">
                <input 
                  v-model="newBatchChapter.path" 
                  type="text" 
                  placeholder="Chapter path"
                  class="path-input"
                />
                <label class="checkbox-label">
                  <input 
                    v-model="newBatchChapter.isCompressed" 
                    type="checkbox"
                  />
                  Compressed
                </label>
                <select v-model="newBatchChapter.status" class="status-select">
                  <option value="valid">Valid</option>
                  <option value="missing">Missing</option>
                  <option value="corrupted">Corrupted</option>
                </select>
              </div>
              <button @click="addBatchChapter(mangaIndex)" type="button">Add Chapter</button>
            </div>
            
            <ul class="chapters-list" v-if="manga.chapters && manga.chapters.length > 0">
              <li v-for="(chapter, chapterIndex) in manga.chapters" :key="chapterIndex">
                <div class="chapter-number">{{ chapter.chapterNumber }}</div>
                <div class="chapter-title">{{ chapter.chapterTitle || `Chapter ${chapter.chapterNumber}` }}</div>
                <div class="chapter-info">
                  <span v-if="chapter.volume">Vol. {{ chapter.volume }}</span>
                  <span v-if="chapter.translatorGroup">{{ chapter.translatorGroup }}</span>
                  <span v-if="chapter.path" class="chapter-path">{{ chapter.path }}</span>
                  <span v-if="chapter.isCompressed" class="compressed-badge">Compressed</span>
                  <span :class="`status-badge status-${chapter.status || 'valid'}`">{{ chapter.status || 'valid' }}</span>
                </div>
                <button @click="removeBatchChapter(mangaIndex, chapterIndex)" type="button" class="remove-btn">
                  ×
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="batch-actions">
          <button @click="addBatchManga" type="button" class="add-manga-btn">
            + Add Another Manga
          </button>
          
          <button @click="batchInsertManga" type="button" class="batch-create-btn">
            Create All Manga
          </button>
        </div>
      </div>
      
      <!-- Manga List -->
      <div class="manga-list">
        <h2>Manga Library</h2>
        
        <div v-if="mangaList.length === 0" class="empty-state">
          No manga found. Add your first manga using the form.
        </div>
        
        <ul v-else>
          <li 
            v-for="manga in mangaList" 
            :key="manga.mangaId"
            :class="{ active: selectedManga?.mangaId === manga.mangaId }"
            @click="selectManga(manga)"
          >
            <div class="manga-item">
              <div class="manga-title">{{ manga.mainTitle }}</div>
              <div class="manga-year" v-if="manga.year">{{ manga.year }}</div>
              <button 
                @click.stop="deleteManga(manga.mangaId)" 
                class="delete-btn"
                title="Delete manga"
              >
                ×
              </button>
            </div>
          </li>
        </ul>
      </div>
      
      <!-- Manga Details -->
      <div class="manga-details" v-if="selectedManga">
        <h2>{{ selectedManga.mainTitle }}</h2>
        
        <div class="manga-info">
          <p v-if="selectedManga.description">{{ selectedManga.description }}</p>
          <p v-if="selectedManga.year"><strong>Year:</strong> {{ selectedManga.year }}</p>
          <p v-if="selectedManga.statusId">
            <strong>Status:</strong> 
            {{ statusList.find(s => s.statusId === selectedManga?.statusId)?.statusName }}
          </p>
        </div>
        
        <h3>Chapters</h3>
        <div v-if="chapters.length === 0" class="empty-state">
          No chapters available for this manga.
        </div>
        
        <ul v-else class="chapters-list">
          <li v-for="chapter in chapters" :key="chapter.chapterId">
            <div class="chapter-number">
              {{ chapter.chapterNumber }}
            </div>
            <div class="chapter-title">
              {{ chapter.chapterTitle || `Chapter ${chapter.chapterNumber}` }}
            </div>
            <div class="chapter-info">
              <span v-if="chapter.volume">Vol. {{ chapter.volume }}</span>
              <span v-if="chapter.path" class="chapter-path">{{ chapter.path }}</span>
              <span v-if="chapter.isCompressed" class="compressed-badge">Compressed</span>
              <span :class="`status-badge status-${chapter.status || 'valid'}`">{{ chapter.status || 'valid' }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manga-example {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.alt-title-input {
  display: flex;
  gap: 10px;
}

.alt-title-input input {
  flex: 1;
}

.alt-titles-list {
  list-style: none;
  padding: 0;
  margin-top: 10px;
}

.alt-titles-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
}

button:hover {
  background-color: #45a049;
}

.remove-btn, .delete-btn {
  background-color: #f44336;
  color: white;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 0;
  font-size: 16px;
}

.remove-btn:hover, .delete-btn:hover {
  background-color: #d32f2f;
}

.create-btn {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  margin-top: 10px;
}

.batch-insert-form {
  grid-column: span 3; /* Span across all columns */
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.batch-manga-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  background-color: #fff;
}

.batch-manga-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.batch-manga-header h3 {
  margin: 0;
  font-size: 18px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.add-manga-btn, .batch-create-btn {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #2196f3;
  color: white;
}

.add-manga-btn:hover, .batch-create-btn:hover {
  background-color: #1976d2;
}

.chapter-input {
  margin-top: 15px;
  margin-bottom: 15px;
}

.chapter-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.chapter-number-input, .volume-input, .translator-input, .release-input, .language-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.chapter-title-input {
  flex: 2;
}

.chapters-list {
  list-style: none;
  padding: 0;
  margin-top: 10px;
}

.chapters-list li {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.chapters-list li:last-child {
  border-bottom: none;
}

.chapter-number {
  font-weight: bold;
  margin-right: 10px;
  min-width: 30px;
}

.chapter-title {
  flex: 1;
}

.chapter-info {
  color: #666;
  font-size: 0.9em;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chapter-path {
  background-color: #e3f2fd;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.8em;
}

.compressed-badge {
  background-color: #fff3e0;
  color: #e65100;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8em;
  font-weight: bold;
}

.status-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8em;
  font-weight: bold;
}

.status-valid {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.status-missing {
  background-color: #ffebee;
  color: #c62828;
}

.status-corrupted {
  background-color: #fff3e0;
  color: #e65100;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9em;
}

.status-select {
  min-width: 120px;
}

.manga-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.manga-list li {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}

.manga-list li:last-child {
  border-bottom: none;
}

.manga-list li:hover {
  background-color: #f5f5f5;
}

.manga-list li.active {
  background-color: #e3f2fd;
}

.manga-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manga-title {
  font-weight: bold;
  flex: 1;
}

.manga-year {
  color: #666;
  margin-right: 10px;
}

.manga-details {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
}

.manga-info {
  margin-bottom: 20px;
}

.empty-state {
  color: #666;
  font-style: italic;
  padding: 10px 0;
}
</style>