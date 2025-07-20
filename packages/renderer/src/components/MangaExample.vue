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
  createdAt: string;
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
            <div class="chapter-info" v-if="chapter.volume">
              Vol. {{ chapter.volume }}
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

.chapters-list {
  list-style: none;
  padding: 0;
}

.chapters-list li {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
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
}

.empty-state {
  color: #666;
  font-style: italic;
  padding: 10px 0;
}
</style>