// Contoh penggunaan batch insert manga dan chapter
import type { BatchMangaData } from '../types/electron';

// Contoh data manga dengan chapter untuk batch insert
export const sampleBatchMangaData: BatchMangaData[] = [
  {
    mainTitle: "One Piece",
    description: "Petualangan bajak laut mencari harta karun legendaris",
    year: 1997,
    statusId: 1, // Ongoing
    alternativeTitles: ["ワンピース", "One Piece"],
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: "I'm Luffy! The Man Who's Gonna Be King of the Pirates!",
        volume: 1,
        translatorGroup: "Official",
        releaseTime: "1997-07-22",
        language: "Japanese"
      },
      {
        chapterNumber: 2,
        chapterTitle: "They Call Him Straw Hat Luffy",
        volume: 1,
        translatorGroup: "Official",
        releaseTime: "1997-07-29",
        language: "Japanese"
      },
      {
        chapterNumber: 3,
        chapterTitle: "Shanks Appears",
        volume: 1,
        translatorGroup: "Official",
        releaseTime: "1997-08-05",
        language: "Japanese"
      }
    ]
  },
  {
    mainTitle: "Naruto",
    description: "Kisah ninja muda yang bercita-cita menjadi Hokage",
    year: 1999,
    statusId: 2, // Completed
    alternativeTitles: ["ナルト", "Naruto"],
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: "Uzumaki Naruto",
        volume: 1,
        translatorGroup: "Official",
        releaseTime: "1999-09-21",
        language: "Japanese"
      },
      {
        chapterNumber: 2,
        chapterTitle: "Konohamaru",
        volume: 1,
        translatorGroup: "Official",
        releaseTime: "1999-09-28",
        language: "Japanese"
      }
    ]
  },
  {
    mainTitle: "Dragon Ball",
    description: "Petualangan Son Goku mencari dragon balls",
    year: 1984,
    statusId: 2, // Completed
    alternativeTitles: ["ドラゴンボール", "Dragon Ball"],
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: "Bulma and Son Goku",
        volume: 1,
        translatorGroup: "Official",
        releaseTime: "1984-12-03",
        language: "Japanese"
      }
    ]
  }
];

// Contoh penggunaan batch insert
export async function exampleBatchInsert() {
  try {
    console.log('Starting batch insert...');
    
    // Panggil batch insert melalui mangaAPI
    const result = await window.mangaAPI.batchInsertManga(sampleBatchMangaData);
    
    if (result.success) {
      console.log(`✅ Batch insert berhasil!`);
      console.log(`📚 Manga yang diinsert: ${result.insertedManga}`);
      console.log(`📖 Chapter yang diinsert: ${result.insertedChapters}`);
      
      if (result.errors && result.errors.length > 0) {
        console.warn('⚠️ Beberapa error terjadi:', result.errors);
      }
    } else {
      console.error('❌ Batch insert gagal:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error saat batch insert:', error);
    throw error;
  }
}

// Contoh batch insert chapter untuk manga yang sudah ada
export async function exampleBatchInsertChapters(mangaId: number) {
  try {
    console.log(`Adding chapters to manga ID: ${mangaId}`);
    
    const chapters = [
      {
        chapterNumber: 100,
        chapterTitle: "Epic Battle Chapter",
        volume: 10,
        translatorGroup: "Fan Translation",
        releaseTime: "2024-01-15",
        language: "English"
      },
      {
        chapterNumber: 101,
        chapterTitle: "The Aftermath",
        volume: 10,
        translatorGroup: "Fan Translation",
        releaseTime: "2024-01-22",
        language: "English"
      },
      {
        chapterNumber: 102,
        chapterTitle: "New Beginning",
        volume: 11,
        translatorGroup: "Fan Translation",
        releaseTime: "2024-01-29",
        language: "English"
      }
    ];
    
    const result = await window.mangaAPI.batchInsertChapters(mangaId, chapters);
    
    if (result.success) {
      console.log(`✅ Chapters berhasil ditambahkan!`);
      console.log(`📖 Chapter yang diinsert: ${result.insertedChapters}`);
    } else {
      console.error('❌ Gagal menambahkan chapters:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error saat menambahkan chapters:', error);
    throw error;
  }
}

// Contoh validasi data sebelum batch insert
export function validateBatchMangaData(mangaList: BatchMangaData[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!mangaList || mangaList.length === 0) {
    errors.push('Manga list tidak boleh kosong');
    return { valid: false, errors };
  }
  
  mangaList.forEach((manga, index) => {
    if (!manga.mainTitle || manga.mainTitle.trim() === '') {
      errors.push(`Manga ${index + 1}: Judul utama wajib diisi`);
    }
    
    if (manga.year && (manga.year < 1900 || manga.year > new Date().getFullYear() + 1)) {
      errors.push(`Manga ${index + 1}: Tahun tidak valid (${manga.year})`);
    }
    
    if (manga.chapters) {
      manga.chapters.forEach((chapter: { chapterNumber: number }, chapterIndex: number) => {
        if (chapter.chapterNumber <= 0) {
          errors.push(`Manga ${index + 1}, Chapter ${chapterIndex + 1}: Nomor chapter harus > 0`);
        }
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
