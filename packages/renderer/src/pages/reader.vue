<script setup lang="ts">
import { ref, onMounted, watch, computed, useTemplateRef } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { mangaAPI, send, showContextMenu } from "@app/preload";

const route = useRoute();
const router = useRouter();
const chapterId = route.params.chapterId;

// Window state management
const wasMaximized = ref<boolean>(false);
const previousWindowBounds = ref<{ width: number; height: number; x: number; y: number } | null>(null);

// Reading progress tracking
const hasReachedBottom = ref<boolean>(false);
const isUpdatingReadStatus = ref<boolean>(false);

// Archive recovery status
const isRecoveringArchive = ref<boolean>(false);
const archiveRecoveryMessage = ref<string>('');

// Delete confirmation dialog
const showDeleteConfirmDialog = ref<boolean>(false);
const imageToDelete = ref<{ fileName: string; chapterPath: string } | null>(null);
const isDeleting = ref<boolean>(false);

const chapterImageList = ref<string[]>([]);
const currentChapter = ref<any>(null);
const mangaInfo = ref<any>(null);
const allChapters = ref<any[]>([]);
const currentChapterIndex = ref<number>(-1);
const readingMode = ref<'long-strip' | 'two-page'>('long-strip');
const readingDirection = ref<'ltr' | 'rtl'>('ltr');
const containerWidth = ref<'normal' | 'full'>('normal');

watch(()=>route.params.chapterId, async (newVal)=>{
    // Reset reading progress state for new chapter
    hasReachedBottom.value = false;
    
    await getCurrentChapterInfo(Number(newVal));
    await getChapterImageList(Number(newVal));
    currentChapterIndex.value = allChapters.value.findIndex(
        chapter => chapter.id === Number(newVal)
    );
    
    // Check if new chapter is already read
    if (currentChapter.value?.statusRead) {
        hasReachedBottom.value = true;
    }
})

const tryRestoreArchiveFromBackup = async (chapterId: number) => {
    try {
        isRecoveringArchive.value = true;
        archiveRecoveryMessage.value = 'Attempting to restore corrupted archive...';
        
        // Get chapter info to determine archive path
        const chapterResult = await mangaAPI.getChapterById(chapterId);
        if (!chapterResult.success) {
            console.error('Failed to get chapter info for restore:', chapterResult.error);
            return;
        }
        
        const chapter = chapterResult.data;
        if (!chapter) {
            console.error('Chapter data is undefined');
            return;
        }
        
        const mangaResult = await mangaAPI.getMangaWithChapters(chapter.mangaId);
        if (!mangaResult.success) {
            console.error('Failed to get manga info for restore:', mangaResult.error);
            return;
        }
        
        const manga = mangaResult.data?.manga;
        if (!manga?.mainTitle) {
            console.error('Failed to get manga title for restore');
            return;
        }
        
        // Try to restore from backup using existing API
        // For now, we'll use a simple approach: try to get image list again
        // The backend should handle archive corruption automatically
        
        // Retry getting chapter image list
        const retryResult = await mangaAPI.getChapterImageList(chapterId);
        if (retryResult.success) {
            const imageList = retryResult.data || [];
            const sortedImageList = imageList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
            chapterImageList.value = sortedImageList;
            archiveRecoveryMessage.value = 'Archive recovered successfully!';
        } else {
            console.error('Still failed to get chapter image list after refresh:', retryResult.error);
            archiveRecoveryMessage.value = 'Failed to recover archive. Please try refreshing.';
        }
    } catch (error) {
        console.error('Error during archive restore:', error);
        archiveRecoveryMessage.value = 'Error during archive recovery.';
    } finally {
        // Reset recovery state after a delay
        setTimeout(() => {
            isRecoveringArchive.value = false;
            archiveRecoveryMessage.value = '';
        }, 3000);
    }
};

const getChapterImageList = async (chapterId: number) => {
    const result = await mangaAPI.getChapterImageList(chapterId);
    if (result.success) {
        const imageList = result.data || [];
        const sortedImageList = imageList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        chapterImageList.value = sortedImageList;
    } else {
        console.error("Failed to get chapter image list:", result.error);
        
        // Check if it's a "Bad archive" error and try to restore from backup
        if (result.error && result.error.includes('Bad archive')) {
            // Show user notification
            if (currentChapter.value) {
                // You can add a toast notification here if you have a notification system
            }
            
            await tryRestoreArchiveFromBackup(chapterId);
        }
    }
}

const getCurrentChapterInfo = async (chapterId: number) => {
    const result = await mangaAPI.getChapterById(chapterId);
    if (result.success) {
        currentChapter.value = result.data;
        // Setelah mendapatkan chapter info, ambil manga info
        await getMangaInfo(currentChapter.value.mangaId);
    } else {
        console.error("Failed to get chapter info:", result.error);
    }
}

const getMangaInfo = async (mangaId: number) => {
    const result = await mangaAPI.getMangaWithChapters(mangaId);
    if (result.success) {
        mangaInfo.value = result.data?.manga;
        allChapters.value = result.data?.chapters || [];
        
        // Urutkan chapter berdasarkan chapter number
        allChapters.value.sort((a, b) => a.chapterNumber - b.chapterNumber);
        
        // Temukan index chapter saat ini
        currentChapterIndex.value = allChapters.value.findIndex(
            chapter => chapter.id === Number(chapterId)
        );
    } else {
        console.error("Failed to get manga info:", result.error);
    }
}

const navigateToChapter = (direction: 'prev' | 'next') => {
    let targetIndex: number;
    
    if (direction === 'prev') {
        targetIndex = currentChapterIndex.value - 1;
    } else {
        targetIndex = currentChapterIndex.value + 1;
    }
    // Periksa apakah index valid
    if (targetIndex >= 0 && targetIndex < allChapters.value.length) {
        const targetChapter = allChapters.value[targetIndex];
        router.push(`/read/${targetChapter.id}`);
    }
}

const canNavigatePrev = () => {
    return currentChapterIndex.value > 0;
}

const canNavigateNext = () => {
    return currentChapterIndex.value < allChapters.value.length - 1;
}

const toggleReadingMode = () => {
    readingMode.value = readingMode.value === 'long-strip' ? 'two-page' : 'long-strip';
}

const toggleReadingDirection = () => {
    readingDirection.value = readingDirection.value === 'ltr' ? 'rtl' : 'ltr';
}

const toggleContainerWidth = () => {
    containerWidth.value = containerWidth.value === 'normal' ? 'full' : 'normal';
}

// Update chapter read status
const updateChapterReadStatus = async () => {
    if (!currentChapter.value || hasReachedBottom.value || isUpdatingReadStatus.value) {
        return;
    }
    
    try {
        isUpdatingReadStatus.value = true;
        
        const result = await mangaAPI.updateChapterReadStatus(currentChapter.value.chapterId, true);
        if (result.success) {
            hasReachedBottom.value = true;
            // Update local state
            if (currentChapter.value) {
                currentChapter.value.statusRead = true;
            }
        } else {
            console.error('Failed to update chapter read status:', result.error);
        }
    } catch (error) {
        console.error('Error updating chapter read status:', error);
    } finally {
        isUpdatingReadStatus.value = false;
    }
}

// Check if user has scrolled to bottom
const checkScrollPosition = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    // Check if scrolled to bottom (with small threshold)
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (isAtBottom && !hasReachedBottom.value) {
        updateChapterReadStatus();
    }
}

// Save window state when entering reader
onMounted(async () => {
    // Check current window state before maximizing
    const currentState = await send("window:getState", "");
    wasMaximized.value = currentState?.success && currentState?.data?.isMaximized || false;
    
    // If window is not maximized, save the current bounds for later restoration
    if (!wasMaximized.value) {
        const windowInfo = await send("window:get-current", "");
        if (windowInfo?.success && windowInfo?.data?.bounds) {
            previousWindowBounds.value = windowInfo.data.bounds;
        }
    }
    
    // Maximize window for better reading experience
    await send("window:maximize", "");
    
    // Load initial data
    await getCurrentChapterInfo(Number(chapterId));
    await getChapterImageList(Number(chapterId));
    
    // Add scroll event listener for reading progress tracking
    window.addEventListener('scroll', checkScrollPosition);
    
    // Check if chapter is already read
    if (currentChapter.value?.statusRead) {
        hasReachedBottom.value = true;
    }
    
    // Listen for context menu actions
    window.addEventListener('context-menu-action', (e: Event) => {
        const customEvent = e as CustomEvent;
        const { action, args } = customEvent.detail;
        switch(action) {
            case 'toggle-fullscreen':
                toggleFullScreen();
                break;
            case 'toggle-reading-mode':
                toggleReadingMode();
                break;
            case 'toggle-reading-direction':
                toggleReadingDirection();
                break;
            case 'toggle-container-width':
                toggleContainerWidth();
                break;
            case 'previous-chapter':
                navigateToChapter('prev');
                break;
            case 'next-chapter':
                navigateToChapter('next');
                break;
            case 'go-home':
                router.push('/');
                break;
            case 'delete-image':
                const [imageFileName, chapterPath] = args;
                showDeleteConfirmation(imageFileName, chapterPath);
                break;
        }
    });
});

// Restore window state when leaving reader
onBeforeRouteLeave((_to, _from, next) => {
    // Remove scroll event listener
    window.removeEventListener('scroll', checkScrollPosition);
    
    // Remove context menu event listener
    window.removeEventListener('context-menu-action', (e: Event) => {
        const customEvent = e as CustomEvent;
        const { action, args } = customEvent.detail;
        switch(action) {
            case 'toggle-fullscreen':
                toggleFullScreen();
                break;
            case 'toggle-reading-mode':
                toggleReadingMode();
                break;
            case 'toggle-reading-direction':
                toggleReadingDirection();
                break;
            case 'toggle-container-width':
                toggleContainerWidth();
                break;
            case 'previous-chapter':
                navigateToChapter('prev');
                break;
            case 'next-chapter':
                navigateToChapter('next');
                break;
            case 'go-home':
                router.push('/');
                break;
            case 'delete-image':
                const [imageFileName, chapterPath] = args;
                showDeleteConfirmation(imageFileName, chapterPath);
                break;
        }
    });
    
    // If window was maximized before entering reader, keep it maximized
    // If window was not maximized before entering reader, restore it to previous bounds
    if (wasMaximized.value) {
        // Keep maximized - do nothing
    } else {
        // Restore to previous bounds
        if (previousWindowBounds.value) {
            const { width, height, x, y } = previousWindowBounds.value;
            send("window:restore-bounds", JSON.stringify({ width, height, x, y }));
        } else {
            // Fallback to restore if bounds not available
            send("window:restore", "");
        }
    }
    next();
});

const getReadingModeLabel = computed(() => {
    return readingMode.value === 'long-strip' ? 'Long Strip' : '2 Pages';
})

const getReadingModeIcon = computed(() => {
    return readingMode.value === 'long-strip' ? 'view_column' : 'view_agenda';
})

const getReadingDirectionLabel = computed(() => {
    return readingDirection.value === 'ltr' ? 'LTR' : 'RTL';
})

const getReadingDirectionIcon = computed(() => {
    return readingDirection.value === 'ltr' ? 'format_align_left' : 'format_align_right';
})

const getContainerWidthLabel = computed(() => {
    return containerWidth.value === 'normal' ? 'Normal' : 'Full Width';
})

const getContainerWidthIcon = computed(() => {
    return containerWidth.value === 'normal' ? 'crop_square' : 'fullscreen';
})

const readerContainer = useTemplateRef('readerContainer');
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    readerContainer.value?.requestFullscreen().catch((err: any) => {
      console.error(`Error entering full-screen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

const deleteImageFile = async (imageFileName: string, chapterPath: string) => {
  try {
    // Check if chapter is compressed using database field
    const isCompressed = currentChapter.value?.isCompressed || false;
    
    if (isCompressed) {
      // Delete from compressed file - need to find the correct extension
      let cbzPath: string;
      let zipPath: string;
      
      // Check if path already has extension
      if (chapterPath.endsWith('.cbz') || chapterPath.endsWith('.zip')) {
        // Extract base path without extension for fallback
        const basePath = chapterPath.replace(/\.(cbz|zip)$/, '');
        cbzPath = `${basePath}.cbz`;
        zipPath = `${basePath}.zip`;
      } else {
        // Try to find the actual compressed file with correct extension
        // This matches the logic in mangaProtocolService.ts getImageList
        
        // Check if .cbz exists first, then fallback to .zip
        // This is more robust than assuming just one extension
        cbzPath = `${chapterPath}.cbz`;
        zipPath = `${chapterPath}.zip`;
      }
      
      // For compressed files, file path should include subfolder structure
      // If chapter is 2, file should be in subfolder "2", so path becomes "2/2.webp"
      const filePathInArchive = `${currentChapter.value?.chapterNumber}/${imageFileName}`;
      
      // Try to delete from the archive with fallback mechanism
      // First try .cbz, then fallback to .zip if needed
      let result = await tryDeleteFromArchive(cbzPath, filePathInArchive);
      
      // If .cbz fails, try .zip as fallback
      if (!result.success) {
        result = await tryDeleteFromArchive(zipPath, filePathInArchive);
      }
      
      if (result.success) {
        // Refresh chapter image list
        await getChapterImageList(Number(chapterId));
      } else {
        console.error(`Failed to delete ${imageFileName} from compressed chapter:`, result.error);
      }
    } else {
      // Delete from directory
      const result = await mangaAPI.deleteFileFromDirectory(chapterPath, imageFileName);
      if (result.success) {
        // Refresh chapter image list
        await getChapterImageList(Number(chapterId));
      } else {
        console.error(`Failed to delete ${imageFileName} from directory:`, result.error);
      }
    }
  } catch (error) {
    console.error(`Error deleting image ${imageFileName}:`, error);
  }
};

const showDeleteConfirmation = (fileName: string, chapterPath: string) => {
  imageToDelete.value = { fileName, chapterPath };
  showDeleteConfirmDialog.value = true;
};

const confirmDelete = async () => {
  if (imageToDelete.value) {
    try {
      isDeleting.value = true;
      const { fileName, chapterPath } = imageToDelete.value;
      await deleteImageFile(fileName, chapterPath);
      
      // Close dialog and reset
      showDeleteConfirmDialog.value = false;
      imageToDelete.value = null;
    } finally {
      isDeleting.value = false;
    }
  }
};

const cancelDelete = () => {
  showDeleteConfirmDialog.value = false;
  imageToDelete.value = null;
};

// Helper function to try deleting from archive with fallback to different extensions
const tryDeleteFromArchive = async (archivePath: string, filePathInArchive: string) => {
  // First try the original path
  let result = await mangaAPI.deleteFromCompressFile(archivePath, [filePathInArchive]);
  
  if (result.success) {
    return result;
  }
  
  // If original path fails, try .cbz extension
  if (!archivePath.endsWith('.cbz')) {
    const cbzPath = archivePath.replace('.zip', '.cbz');
    result = await mangaAPI.deleteFromCompressFile(cbzPath, [filePathInArchive]);
    
    if (result.success) {
      return result;
    }
  }
  
  // If .cbz also fails, try .zip extension
  if (!archivePath.endsWith('.zip')) {
    const zipPath = archivePath.replace('.cbz', '.zip');
    result = await mangaAPI.deleteFromCompressFile(zipPath, [filePathInArchive]);
    
    if (result.success) {
      return result;
    }
  }
  
  // If all attempts fail, return the last error
  return result;
};

const clickContextMenu = (e:Event)=>{
  e.preventDefault();
  const target = e.target as HTMLElement;
  const elementType = target.tagName.toLowerCase();
  
  // Get image filename and chapter path if clicking on image
  let imageFileName: string | undefined;
  let chapterPath: string | undefined;
  
  if (elementType === 'img' && target instanceof HTMLImageElement) {
    const src = target.src;
    // Extract filename from manga:// protocol
    if (src.startsWith('manga://')) {
      const pathParts = src.replace('manga://', '').split('/');
      imageFileName = pathParts[pathParts.length - 1]; // Get filename
      
      // Get chapter path from current chapter info
      if (currentChapter.value?.path) {
        chapterPath = currentChapter.value.path.startsWith('/') ? currentChapter.value.path.slice(1) : currentChapter.value.path;
      } else if (mangaInfo.value?.mainTitle) {
        chapterPath = `${mangaInfo.value.mainTitle}/${currentChapter.value?.chapterNumber}`;
      }
    }
  }
  
  showContextMenu({
    routeName: 'reader',
    elementType,
    readingMode: readingMode.value,
    readingDirection: readingDirection.value,
    isFullscreen: document.fullscreenElement !== null,
    containerWidth: containerWidth.value,
    canNavigatePrev: canNavigatePrev(),
    canNavigateNext: canNavigateNext(),
    imageFileName,
    chapterPath,
  });
}
</script>

<template>
    <div @contextmenu="clickContextMenu">
    <div class="reader-container" :class="containerWidth" ref="readerContainer">
        <!-- Header dengan navigasi -->
        <div class="reader-header">
            <div class="manga-info">
                <h4 v-if="mangaInfo">{{ mangaInfo.mainTitle }}</h4>
                <p v-if="currentChapter">
                    Chapter {{ currentChapter.chapterNumber }}
                    <span v-if="currentChapter.chapterTitle">- {{ currentChapter.chapterTitle }}</span> 
                </p>
                <div class="q-pa-md q-gutter-sm">
                    <q-btn color="primary" @click="toggleFullScreen" label="Fullscreen" />
                    <q-btn 
                        :color="readingMode === 'long-strip' ? 'primary' : 'secondary'"
                        :icon="getReadingModeIcon"
                        @click="toggleReadingMode" 
                        :label="getReadingModeLabel" 
                    />
                    <q-btn 
                        v-if="readingMode === 'two-page'"
                        :color="readingDirection === 'ltr' ? 'positive' : 'warning'"
                        :icon="getReadingDirectionIcon"
                        @click="toggleReadingDirection" 
                        :label="getReadingDirectionLabel" 
                    />
                    <q-btn 
                        :color="containerWidth === 'normal' ? 'info' : 'deep-orange'"
                        :icon="getContainerWidthIcon"
                        @click="toggleContainerWidth" 
                        :label="getContainerWidthLabel" 
                    />
                    
                    <!-- Read Status Indicator -->
                    <q-chip
                        :color="currentChapter?.statusRead ? 'positive' : 'grey'"
                        :icon="currentChapter?.statusRead ? 'check_circle' : 'radio_button_unchecked'"
                        :label="currentChapter?.statusRead ? 'Read' : 'Unread'"
                        size="sm"
                    />
                    
                    <!-- Archive Recovery Status -->
                    <q-chip
                        v-if="isRecoveringArchive"
                        color="warning"
                        icon="restore"
                        :label="archiveRecoveryMessage"
                        size="sm"
                    />
                </div>
            </div>
            
            <!-- Tombol navigasi -->
            <div class="navigation-controls">
                <q-btn
                    :disable="!canNavigatePrev()"
                    @click="navigateToChapter('prev')"
                    color="primary"
                    icon="chevron_left"
                    label="Previous Chapter"
                    class="nav-btn"
                />
                
                <q-btn
                    :disable="!canNavigateNext()"
                    @click="navigateToChapter('next')"
                    color="primary"
                    icon="chevron_right"
                    label="Next Chapter"
                    class="nav-btn"
                />
            </div>
        </div>

        <!-- Chapter images -->
        <div class="chapter-images" :class="[readingMode, readingMode === 'two-page' ? readingDirection : '']">
            <!-- Long Strip Mode -->
            <template v-if="readingMode === 'long-strip'">
                <div v-for="(image, index) in chapterImageList" :key="image" class="image-container long-strip">
                    <q-img
                        :src="`manga://${image}`"
                        fit="contain"
                        class="chapter-image"
                    />
                    <div class="image-counter">{{ index + 1 }} / {{ chapterImageList.length }}</div>
                </div>
            </template>
            
            <!-- Two Page Mode (Right to Left) -->
            <template v-else>
                <!-- Group images into pairs for two-page layout -->
                <div v-for="(_, pairIndex) in Math.ceil(chapterImageList.length / 2)" :key="pairIndex" class="page-pair">
                    <!-- LTR Mode: Left page first, then right page -->
                    <template v-if="readingDirection === 'ltr'">
                        <!-- Left page (even index) -->
                        <div v-if="(pairIndex * 2 + 1) < chapterImageList.length" class="image-container two-page left-page">
                            <q-img
                                :src="`manga://${chapterImageList[pairIndex * 2 + 1]}`"
                                fit="contain"
                                class="chapter-image"
                            />
                            <div class="image-counter">{{ (pairIndex * 2 + 2) }} / {{ chapterImageList.length }}</div>
                        </div>
                        
                        <!-- Right page (odd index) -->
                        <div v-if="(pairIndex * 2) < chapterImageList.length" class="image-container two-page right-page">
                            <q-img
                                :src="`manga://${chapterImageList[pairIndex * 2]}`"
                                fit="contain"
                                class="chapter-image"
                            />
                            <div class="image-counter">{{ (pairIndex * 2) + 1 }} / {{ chapterImageList.length }}</div>
                        </div>
                    </template>
                    
                    <!-- RTL Mode: Right page first, then left page -->
                    <template v-else>
                        <!-- Right page (odd index) -->
                        <div v-if="(pairIndex * 2) < chapterImageList.length" class="image-container two-page right-page">
                            <q-img
                                :src="`manga://${chapterImageList[pairIndex * 2]}`"
                                fit="contain"
                                class="chapter-image"
                            />
                            <div class="image-counter">{{ (pairIndex * 2) + 1 }} / {{ chapterImageList.length }}</div>
                        </div>
                        
                        <!-- Left page (even index) -->
                        <div v-if="(pairIndex * 2 + 1) < chapterImageList.length" class="image-container two-page left-page">
                            <q-img
                                :src="`manga://${chapterImageList[pairIndex * 2 + 1]}`"
                                fit="contain"
                                class="chapter-image"
                            />
                            <div class="image-counter">{{ (pairIndex * 2 + 2) }} / {{ chapterImageList.length }}</div>
                        </div>
                    </template>
                </div>
            </template>
        </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirmDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm text-h6">Konfirmasi Hapus</span>
        </q-card-section>

        <q-card-section>
          <p class="text-body1">
            Apakah Anda yakin ingin menghapus file <strong>{{ imageToDelete?.fileName }}</strong>?
          </p>
          <p class="text-caption text-grey-7">
            File akan dihapus secara permanen dan tidak dapat dikembalikan.
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Batal" color="grey" @click="cancelDelete" :disable="isDeleting" />
          <q-btn 
            unelevated 
            label="Hapus" 
            color="negative" 
            @click="confirmDelete"
            :loading="isDeleting"
            :disable="isDeleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    </div>
</template>

<style scoped>
.reader-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    transition: all 0.3s ease;
    min-height: 100vh;
}

.reader-container.full {
    max-width: 100%;
    padding: 10px;
}

.reader-container.full .chapter-images {
    max-width: 100%;
}

.reader-container.full .image-container.two-page {
    max-width: none;
    width: calc(50% - 5px);
}

/* Fullscreen mode specific styles */
.reader-container:fullscreen {
    height: 100vh;
    overflow-y: auto;
    padding: 10px;
}

.reader-container:fullscreen .chapter-images {
    max-width: 100%;
}

.reader-container:fullscreen .image-container.two-page {
    max-width: none;
    width: calc(50% - 5px);
}

/* Global fullscreen styles - only enable scrolling in fullscreen mode */
:fullscreen {
    overflow-y: auto !important;
}

/* Webkit fullscreen support */
:-webkit-full-screen {
    overflow-y: auto !important;
}

.reader-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 8px;
}

.manga-info h4 {
    margin: 0 0 5px 0;
    color: #333;
}

.manga-info p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.navigation-controls {
    display: flex;
    gap: 10px;
}

.nav-btn {
    min-width: 120px;
}

.chapter-images {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.chapter-images.two-page {
    flex-direction: column;
    gap: 20px;
}

.page-pair {
    display: flex;
    justify-content: center;
    gap: 10px;
    width: 100%;
}

.image-container {
    position: relative;
    text-align: center;
}

.image-container.long-strip {
    width: 100%;
}

.image-container.two-page {
    width: calc(50% - 5px);
    max-width: 500px;
}

.chapter-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Two page mode specific styles */
.right-page {
    order: 2; /* Right page second for LTR, first for RTL */
}

.left-page {
    order: 1; /* Left page first for LTR, second for RTL */
}

/* RTL specific ordering */
.chapter-images.two-page.rtl .right-page {
    order: 1; /* Right page first for RTL */
}

.chapter-images.two-page.rtl .left-page {
    order: 2; /* Left page second for RTL */
}

.image-counter {
    margin-top: 10px;
    color: #666;
    font-size: 12px;
}

/* Responsive design */
@media (max-width: 768px) {
    .reader-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .navigation-controls {
        width: 100%;
        justify-content: center;
    }
    
    .nav-btn {
        min-width: 100px;
    }
    
    /* Mobile: Force long strip mode for better mobile experience */
    .chapter-images.two-page {
        flex-direction: column;
    }
    
    .page-pair {
        flex-direction: column;
        gap: 15px;
    }
    
    .image-container.two-page {
        width: 100%;
        max-width: none;
    }
    
    .right-page,
    .left-page {
        order: 0; /* Reset order on mobile */
    }
    
    /* Mobile: Optimize container width */
    .reader-container.full {
        padding: 5px;
    }
    
    .reader-container.full .chapter-images {
        gap: 15px;
    }
    
    /* Mobile fullscreen scrolling */
    .reader-container:fullscreen {
        height: 100vh;
        overflow-y: auto;
        padding: 5px;
    }
    
    .reader-container:fullscreen .chapter-images {
        gap: 15px;
    }
    
    /* Mobile webkit fullscreen */
    .reader-container:-webkit-full-screen {
        height: 100vh;
        overflow-y: auto;
        padding: 5px;
    }
}
</style>