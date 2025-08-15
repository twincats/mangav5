# Batch Insert Manga dan Chapter

Fitur batch insert memungkinkan Anda untuk menambahkan banyak manga dan chapter sekaligus dengan efisien.

## 🚀 Fitur Utama

### 1. **Batch Insert Manga dengan Chapter**
- Insert multiple manga sekaligus
- Setiap manga bisa memiliki multiple chapter
- Support alternative titles
- Transaction-based untuk data integrity

### 2. **Batch Insert Chapter untuk Manga Existing**
- Tambah multiple chapter ke manga yang sudah ada
- Berguna untuk update chapter baru

## 📋 Interface Data

### BatchMangaData
```typescript
interface BatchMangaData {
  mainTitle: string;           // Wajib
  description?: string;        // Opsional
  year?: number;              // Opsional
  statusId?: number;          // Opsional (referensi ke MangaStatus)
  alternativeTitles?: string[]; // Opsional
  chapters?: {                 // Opsional
    chapterNumber: number;     // Wajib
    chapterTitle?: string;     // Opsional
    volume?: number;           // Opsional
    translatorGroup?: string;  // Opsional
    releaseTime?: string;      // Opsional
    language?: string;         // Opsional
  }[];
}
```

### BatchInsertResult
```typescript
interface BatchInsertResult {
  success: boolean;            // Status operasi
  insertedManga: number;       // Jumlah manga yang berhasil diinsert
  insertedChapters: number;    // Jumlah chapter yang berhasil diinsert
  errors?: string[];           // Array error jika ada
}
```

## 🔧 Cara Penggunaan

### 1. **Melalui Repository (Main Process)**
```typescript
import { MangaRepository } from './schema/mangaRepository';

const repo = new MangaRepository();

// Batch insert manga dengan chapter
const mangaList = [
  {
    mainTitle: "One Piece",
    description: "Petualangan bajak laut",
    year: 1997,
    statusId: 1,
    alternativeTitles: ["ワンピース"],
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: "Chapter 1",
        volume: 1
      }
    ]
  }
];

const result = await repo.batchInsertManga(mangaList);
console.log(`Inserted: ${result.insertedManga} manga, ${result.insertedChapters} chapters`);
```

### 2. **Melalui IPC (Renderer Process)**
```typescript
// Batch insert manga
const result = await window.mangaAPI.batchInsertManga(mangaList);

// Batch insert chapter untuk manga existing
const chapters = [
  { chapterNumber: 100, chapterTitle: "New Chapter" }
];
const chapterResult = await window.mangaAPI.batchInsertChapters(mangaId, chapters);
```

### 3. **Melalui Vue Component**
```vue
<template>
  <div class="batch-insert-form">
    <div v-for="(manga, index) in batchMangaList" :key="index">
      <input v-model="manga.mainTitle" placeholder="Manga Title" />
      <textarea v-model="manga.description" placeholder="Description" />
      
      <!-- Chapters -->
      <div v-for="(chapter, cIndex) in manga.chapters" :key="cIndex">
        <input v-model.number="chapter.chapterNumber" type="number" />
        <input v-model="chapter.chapterTitle" placeholder="Chapter Title" />
      </div>
      
      <button @click="addChapter(index)">Add Chapter</button>
    </div>
    
    <button @click="batchInsertManga">Create All Manga</button>
  </div>
</template>

<script setup>
const batchMangaList = ref([{ mainTitle: '', chapters: [] }]);

async function batchInsertManga() {
  const result = await window.mangaAPI.batchInsertManga(batchMangaList.value);
  if (result.success) {
    alert(`Created ${result.insertedManga} manga with ${result.insertedChapters} chapters!`);
  }
}
</script>
```

## ⚡ Keunggulan

### 1. **Performance**
- Single transaction untuk semua operasi
- Lebih cepat dari multiple single insert
- Rollback otomatis jika ada error

### 2. **Data Integrity**
- Foreign key constraints terjaga
- Timestamp otomatis untuk semua record
- Error handling per manga/chapter

### 3. **Flexibility**
- Support partial data (opsional fields)
- Bisa insert manga tanpa chapter
- Bisa insert chapter tanpa manga

## 🛡️ Error Handling

### 1. **Validation Errors**
- Title wajib diisi
- Chapter number harus > 0
- Year validation (1900 - current year + 1)

### 2. **Database Errors**
- Foreign key constraint violations
- Duplicate entries
- Transaction failures

### 3. **Partial Success**
- Jika ada error, manga lain tetap ter-insert
- Error log untuk setiap item yang gagal
- Rollback hanya jika transaction gagal total

## 📊 Contoh Data

### Sample Manga List
```typescript
const sampleData = [
  {
    mainTitle: "One Piece",
    description: "Petualangan bajak laut",
    year: 1997,
    statusId: 1,
    alternativeTitles: ["ワンピース"],
    chapters: [
      { chapterNumber: 1, chapterTitle: "Chapter 1", volume: 1 },
      { chapterNumber: 2, chapterTitle: "Chapter 2", volume: 1 }
    ]
  },
  {
    mainTitle: "Naruto",
    description: "Kisah ninja",
    year: 1999,
    statusId: 2,
    chapters: [
      { chapterNumber: 1, chapterTitle: "Uzumaki Naruto" }
    ]
  }
];
```

## 🔍 Monitoring dan Debug

### 1. **Console Logs**
```typescript
console.log('Starting batch insert...');
console.log(`Inserted: ${result.insertedManga} manga`);
console.log(`Chapters: ${result.insertedChapters} total`);
```

### 2. **Error Tracking**
```typescript
if (result.errors && result.errors.length > 0) {
  console.warn('Errors occurred:', result.errors);
}
```

### 3. **Database Verification**
```typescript
// Verify inserted data
const allManga = await repo.getAllManga();
const allChapters = await repo.getChapters(mangaId);
```

## 🚨 Best Practices

### 1. **Data Preparation**
- Validate data sebelum insert
- Check foreign key references
- Sanitize input data

### 2. **Batch Size**
- Jangan terlalu besar (max 100-1000 items)
- Monitor memory usage
- Consider pagination untuk data besar

### 3. **Error Recovery**
- Implement retry mechanism
- Log semua errors untuk debugging
- Provide user feedback yang jelas

## 🔧 Troubleshooting

### Common Issues:
1. **Foreign Key Errors**: Pastikan statusId valid
2. **Transaction Timeout**: Kurangi batch size
3. **Memory Issues**: Split data menjadi chunk kecil
4. **Duplicate Entries**: Check existing data sebelum insert

### Debug Commands:
```typescript
// Check database state
const statuses = await repo.getAllStatuses();
const config = await repo.getAllConfig();

// Verify specific manga
const manga = await repo.getMangaById(mangaId);
const chapters = await repo.getChapters(mangaId);
```
