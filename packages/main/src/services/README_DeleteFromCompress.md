# Delete From Compress File Service

## Overview
Fungsi `deleteFromCompressFile` memungkinkan Anda untuk menghapus file tertentu dari compressed manga chapter (CBZ/ZIP) tanpa perlu mengekstrak seluruh archive secara manual.

## Function Signature
```typescript
deleteFromCompressFile(
  archivePath: string, 
  filesToDelete: string[]
): Promise<boolean>
```

## Parameters
- **archivePath**: Path relatif ke compressed archive dari base manga directory
- **filesToDelete**: Array berisi path file yang akan dihapus dari dalam archive

## How It Works
1. **Extract**: Archive diekstrak ke temporary directory
2. **Delete**: File yang ditentukan dihapus dari temporary directory
3. **Recompress**: Archive baru dibuat dengan file yang tersisa
4. **Replace**: Archive lama diganti dengan yang baru
5. **Cleanup**: Temporary directory dan backup file dibersihkan

## Example Usage

### Basic Usage
```typescript
import { deleteFromCompressFile } from './mangaProtocolService';

// Hapus file 1/3.webp dan 1/4.webp dari chapter OnePiece/Chapter-1.cbz
const success = await deleteFromCompressFile(
  "OnePiece/Chapter-1.cbz",
  ["1/3.webp", "1/4.webp"]
);

if (success) {
  console.log("Files deleted successfully");
} else {
  console.log("Failed to delete files");
}
```

### From Renderer (Vue Component)
```typescript
// Di Vue component
const deleteFilesFromChapter = async () => {
  try {
    const result = await mangaAPI.deleteFromCompressFile(
      "OnePiece/Chapter-1.cbz",
      ["1/3.webp", "1/4.webp"]
    );
    
    if (result.success) {
      console.log("Files deleted successfully");
      // Refresh UI atau update state
    } else {
      console.error("Failed to delete files:", result.error);
    }
  } catch (error) {
    console.error("Error deleting files:", error);
  }
};
```

## Supported Archive Formats
- `.cbz` (Comic Book ZIP)
- `.zip` (Standard ZIP)

## File Path Format
File path dalam array `filesToDelete` harus relatif terhadap root archive:

```
Archive: OnePiece/Chapter-1.cbz
├── 1/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp  ← filesToDelete: ["1/3.webp"]
│   └── 4.webp  ← filesToDelete: ["1/4.webp"]
└── cover.webp
```

## Safety Features
1. **Backup**: Archive asli dibackup sebelum dimodifikasi
2. **Validation**: Format archive divalidasi sebelum diproses
3. **Error Handling**: Temporary directory dibersihkan bahkan jika terjadi error
4. **Rollback**: Jika terjadi error, backup bisa digunakan untuk restore

## Error Handling
Fungsi akan return `false` jika:
- Archive tidak ditemukan
- Format archive tidak didukung
- Tidak ada file yang berhasil dihapus
- Terjadi error saat ekstraksi/kompresi

## Performance Considerations
- Archive besar akan memakan waktu lebih lama untuk diproses
- Temporary directory menggunakan sistem temp OS untuk efisiensi
- ZIP cache tidak terpengaruh karena archive baru dibuat

## Use Cases
1. **Content Moderation**: Hapus gambar yang tidak pantas
2. **Quality Control**: Hapus gambar berkualitas rendah
3. **Storage Optimization**: Hapus file yang tidak diperlukan
4. **Batch Processing**: Hapus multiple file sekaligus

## Notes
- Fungsi ini aman untuk archive yang sedang dibuka (dibaca)
- Archive yang dimodifikasi akan memiliki timestamp yang berbeda
- File yang dihapus tidak bisa di-recover setelah proses selesai
- Backup file otomatis dihapus setelah proses berhasil
