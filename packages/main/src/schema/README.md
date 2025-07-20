# Manga Database Schema

This directory contains the SQLite database schema and related files for the manga management application using Drizzle ORM and better-sqlite3.

## Files Overview

- `manga.ts` - Contains the Drizzle ORM schema definitions for all database tables
- `index.ts` - Database initialization and connection setup
- `migrations.ts` - Database migration functions to create tables and seed initial data
- `mangaRepository.ts` - Repository class with methods for all database operations
- `example.ts` - Example usage of the repository methods

## Database Schema

The database consists of the following tables:

1. **Manga** - Stores main manga information
   - `manga_id` - Primary key
   - `main_title` - The primary title of the manga
   - `description` - A brief description of the manga
   - `year` - The publication year
   - `status_id` - Foreign key to MangaStatus
   - `created_at` and `updated_at` - Timestamps

2. **AlternativeTitles** - Stores alternative titles for manga
   - `alt_id` - Primary key
   - `manga_id` - Foreign key to Manga
   - `alternative_title` - The alternative name
   - `created_at` - Timestamp

3. **MangaStatus** - Defines possible statuses for manga
   - `status_id` - Primary key
   - `status_name` - The status name (e.g., "Ongoing", "Completed")

4. **Chapters** - Stores information about manga chapters
   - `chapter_id` - Primary key
   - `manga_id` - Foreign key to Manga
   - `chapter_number` - The chapter number
   - `chapter_title` - The title of the chapter
   - `volume` - The volume number
   - `translator_group` - The translation group
   - `release_time` - Release timestamp
   - `language` - The language of the chapter
   - `created_at` - Timestamp

5. **ScrapingRules** - Stores rules for scraping manga data
   - `rule_id` - Primary key
   - `website_url` - The website URL
   - `rules_json` - JSON string with scraping rules
   - `created_at` - Timestamp

## Usage

### Initializing the Database

The database is automatically initialized when the application starts through the IPC handlers in `ipc/manga/database.ts`.

### Using the Repository

Import the `MangaRepository` class to perform database operations:

```typescript
import { MangaRepository } from './schema/mangaRepository';

// Create a repository instance
const repo = new MangaRepository();

// Example: Create a new manga
const mangaId = await repo.createManga({
  mainTitle: 'My Manga Title',
  description: 'Description of the manga',
  year: 2023,
  statusId: 1, // Ongoing
  alternativeTitles: ['Alternative Title 1', 'Alternative Title 2']
});

// Don't forget to close the connection when done
repo.close();
```

### IPC Communication

The database can be accessed from the renderer process through IPC calls:

```typescript
// In renderer process
const allManga = await window.electron.ipcRenderer.invoke('manga:getAll');
console.log('All manga:', allManga);

// Create a new manga
const mangaId = await window.electron.ipcRenderer.invoke('manga:create', {
  mainTitle: 'New Manga',
  description: 'A new manga added from the UI',
  year: 2023,
  statusId: 1
});
```

## Development

### Adding New Tables

To add new tables to the schema:

1. Add the table definition to `manga.ts`
2. Update the migration script in `migrations.ts`
3. Add corresponding repository methods in `mangaRepository.ts`
4. Add IPC handlers in `ipc/manga/database.ts`