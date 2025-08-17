
# Manga Reader v5 - Electron Application

![GitHub last commit](https://img.shields.io/github/last-commit/twincats/mangav5?label=last%20update)
![GitHub package.json dev/peer/optional dependency version](https://img.shields.io/github/package-json/dependency-version/twincats/mangav5/dev/electron) 
![GitHub package.json dev/peer/optional dependency version](https://img.shields.io/github/package-json/dependency-version/twincats/mangav5/dev/electron-builder)
![GitHub package.json dev/peer/optional dependency version](https://img.shields.io/github/package-json/dependency-version/twincats/mangav5/dev/vite?filename=packages%2Fmain%2Fpackage.json)

A modern, feature-rich manga reader desktop application built with Electron, Vue.js, and SQLite. Read, organize, and manage your manga collection with an intuitive interface and powerful features.

## ✨ Features

### 📚 Manga Management
- **Local Manga Library**: Organize and manage your manga collection locally
- **Chapter Tracking**: Keep track of read/unread chapters
- **Alternative Titles**: Support for multiple language titles
- **Status Management**: Track manga completion status (Ongoing, Completed, Hiatus, etc.)

### 🔍 Smart Search & Organization
- **Title Search**: Find manga quickly with intelligent search
- **Batch Operations**: Import multiple manga and chapters at once
- **Directory Scanning**: Automatically scan folders for manga content
- **Metadata Management**: Store descriptions, years, and translator information

### 📖 Reading Experience
- **Chapter Reader**: Built-in chapter viewer with navigation
- **Reading Progress**: Track which chapters you've read
- **Volume Support**: Organize chapters by volume numbers
- **Language Support**: Multiple language chapter support

### 🛠️ Technical Features
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Offline First**: All data stored locally in SQLite database
- **Fast Performance**: Optimized database queries and efficient data handling
- **Auto-Updates**: Automatic application updates
- **Secure Architecture**: Built following Electron security best practices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/twincats/mangav5.git
   cd mangav5
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the application**
   ```bash
   npm run init
   ```

4. **Start development mode**
   ```bash
   npm start
   ```

5. **Build executable**
   ```bash
   npm run compile
   ```

## 🏗️ Project Architecture

This project is built as a monorepo with the following structure:

### Core Packages

- **`packages/main`** - Electron main process with manga management logic
  - Database operations (SQLite with Drizzle ORM)
  - Manga repository and business logic
  - IPC handlers for renderer communication
  - Security modules and window management

- **`packages/renderer`** - Vue.js frontend application
  - Modern UI components with Quasar framework
  - Manga library management interface
  - Chapter reader and navigation
  - Search and filtering capabilities

- **`packages/preload`** - Secure bridge between main and renderer
  - Exposes safe APIs to renderer
  - File system operations
  - Database access methods

### Database Schema

The application uses SQLite with the following main tables:

- **`Manga`** - Core manga information (title, description, year, status)
- **`Chapters`** - Chapter details (number, title, volume, read status)
- **`AlternativeTitles`** - Multiple language titles
- **`MangaStatus`** - Status definitions (Ongoing, Completed, etc.)
- **`ScrapingRules`** - Website scraping configurations
- **`Config`** - Application configuration storage

## 🎯 Key Components

### MangaRepository
Central class for all manga-related database operations:

```typescript
// Get all manga
const allManga = await mangaRepo.getAllManga();

// Search by title
const results = await mangaRepo.searchMangaByTitle("One Piece");

// Create new manga with chapters
const mangaId = await mangaRepo.createManga({
  mainTitle: "One Piece",
  description: "Epic pirate adventure",
  year: 1997,
  alternativeTitles: ["ワンピース"]
});

// Batch insert multiple manga
const result = await mangaRepo.batchInsertManga(mangaList);
```

### Database Management
- **Drizzle ORM**: Type-safe database operations
- **Transaction Support**: ACID compliance for data integrity
- **Migration System**: Easy database schema updates
- **Connection Pooling**: Efficient database resource management

### Security Features
- **Context Isolation**: Secure communication between processes
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Graceful error management and logging
- **Rate Limiting**: Protection against abuse

## 📱 Usage Examples

### Adding New Manga
```typescript
// Create manga with chapters
const mangaData = {
  mainTitle: "Dragon Ball",
  description: "Martial arts adventure",
  year: 1984,
  chapters: [
    { chapterNumber: 1, chapterTitle: "Bulma and Son Goku" },
    { chapterNumber: 2, chapterTitle: "The Dragon Balls" }
  ]
};

const mangaId = await mangaRepo.createManga(mangaData);
```

### Managing Reading Progress
```typescript
// Mark chapter as read
await mangaRepo.markChapterAsRead(chapterId);

// Get unread chapters
const unreadChapters = await mangaRepo.getChaptersByReadStatus(mangaId, false);

// Update chapter status
await mangaRepo.updateChapterReadStatus(chapterId, true);
```

### Batch Operations
```typescript
// Import multiple manga at once
const batchResult = await mangaRepo.batchInsertManga([
  { mainTitle: "Manga 1", chapters: [...] },
  { mainTitle: "Manga 2", chapters: [...] }
]);

console.log(`Inserted ${batchResult.insertedManga} manga and ${batchResult.insertedChapters} chapters`);
```

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start development mode with hot-reload
npm run build      # Build all packages
npm run compile    # Build and create executable
npm run test       # Run end-to-end tests
npm run typecheck  # Type checking across all packages
```

### Development Workflow

1. **Main Process Changes**: Edit files in `packages/main/src/`
2. **Frontend Changes**: Modify Vue components in `packages/renderer/src/`
3. **API Changes**: Update preload scripts in `packages/preload/src/`
4. **Database Changes**: Modify schema files in `packages/main/src/schema/`

### Testing
- **E2E Tests**: Playwright-based end-to-end testing
- **Unit Tests**: Individual package testing
- **Integration Tests**: Database and API testing

## 🔧 Configuration

### Environment Variables
Create `.env` files in the project root:

```bash
# .env
VITE_APP_NAME=Manga Reader v5
VITE_DATABASE_PATH=./manga.db

# .env.development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Database Configuration
Database settings can be configured in `packages/main/src/schema/database.ts`:

```typescript
export const databaseConfig = {
  path: process.env.VITE_DATABASE_PATH || './manga.db',
  verbose: process.env.NODE_ENV === 'development'
};
```

## 📦 Building & Distribution

### Local Build
```bash
npm run compile
```

### Production Build
```bash
npm run build
npm run compile -- --publish=always
```

### Supported Platforms
- **Windows**: `.exe` installer and portable versions
- **macOS**: `.dmg` and `.pkg` packages
- **Linux**: `.AppImage`, `.deb`, and `.rpm` packages

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/) for cross-platform desktop apps
- Frontend powered by [Vue.js](https://vuejs.org/) and [Quasar](https://quasar.dev/)
- Database operations with [Drizzle ORM](https://orm.drizzle.team/)
- Build system using [Vite](https://vitejs.dev/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/twincats/mangav5/issues)
- **Discussions**: [GitHub Discussions](https://github.com/twincats/mangav5/discussions)
- **Wiki**: [Project Wiki](https://github.com/twincats/mangav5/wiki)

---

**Happy Reading! 📚✨**
