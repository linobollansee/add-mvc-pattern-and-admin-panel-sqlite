# Project Changes

This document details all changes made to the project from its initial state to the current SQLite implementation.

## Overview

The project has been upgraded from a JSON file-based data storage system to a robust SQLite database with author management and relational data modeling.

---

## Database Migration

### Added: SQLite Database Support

- **Package**: `better-sqlite3@12.4.1` (synchronous SQLite driver)
- **Package**: `@types/better-sqlite3@7.6.13` (TypeScript definitions)
- **Database File**: `src/data/blog.sqlite`
- **Configuration**: `src/config/database.ts`

### Database Schema

Created two tables with foreign key relationships:

#### `authors` Table

- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT NOT NULL)
- `email` (TEXT UNIQUE)
- `bio` (TEXT)
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)

#### `posts` Table

- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `title` (TEXT NOT NULL)
- `slug` (TEXT UNIQUE NOT NULL)
- `excerpt` (TEXT)
- `content` (TEXT NOT NULL)
- `author_id` (INTEGER REFERENCES authors(id) ON DELETE SET NULL)
- `created_at` (TEXT NOT NULL)
- `updated_at` (TEXT NOT NULL)
- Index on `slug` for fast lookups
- Index on `author_id` for efficient joins

---

## Type Definitions

### Added: Author Types

**File**: `src/types/Author.ts`

- `Author` interface - Complete author object
- `CreateAuthorInput` interface - Data for creating authors
- `UpdateAuthorInput` interface - Data for updating authors

### Modified: Post Types

**File**: `src/types/Post.ts`

- Changed `author` from `string` to `author_id: number`
- Added optional `author?: Author` for JOIN results
- Updated all interfaces to reflect new relationship model

---

## Models (Data Layer)

### Added: Author Model

**File**: `src/models/authorModel.ts`

Functions implemented:

- `getAllAuthors()` - Retrieve all authors
- `getAuthorById(id)` - Get single author
- `createAuthor(input)` - Create new author
- `updateAuthor(id, input)` - Update existing author
- `deleteAuthor(id)` - Delete author
- `searchAuthors(query)` - Search by name/email
- `getAuthorsWithPostCount()` - Get authors with aggregated post counts

### Refactored: Post Model

**File**: `src/models/postModel.ts`

**Changes:**

- Complete rewrite from async JSON-based to synchronous SQLite
- Removed file system operations (`fs.promises`)
- Implemented SQL queries with prepared statements
- Added LEFT JOIN with authors table
- Added `mapRowToPost()` helper for consistent data mapping
- Integrated `sanitize-html` for XSS protection
- Automatic slug generation from titles
- Proper error handling with descriptive messages

**Functions updated:**

- `getAllPosts()` - Now uses SELECT with JOIN
- `getPostById(id)` - Returns post with author details
- `getPostBySlug(slug)` - Joins with author data
- `createPost(input)` - Inserts into SQLite with author_id
- `updatePost(id, input)` - Updates SQLite records
- `deletePost(id)` - Deletes from SQLite
- `searchPosts(query)` - Full-text search across title/content
- `getRecentPosts(limit)` - Ordered by creation date

---

## Controllers

### Added: Author Controller

**File**: `src/controllers/authorController.ts`

Routes implemented:

- `index()` - List all authors with search functionality
- `create()` - Render create form
- `store()` - Handle author creation
- `edit(id)` - Render edit form
- `update(id)` - Handle author updates
- `destroy(id)` - Handle author deletion

### Modified: Admin Controller

**File**: `src/controllers/adminController.ts`

**Changes:**

- Added `authorModel` import
- Updated `create()` to pass authors array to view
- Updated `edit()` to pass authors array to view
- Changed `store()` to accept `author_id` instead of `author` string
- Changed `update()` to accept `author_id` instead of `author` string
- Added `parseInt()` for author_id conversion
- Added authors array to error handler

### Modified: Post Controller

**File**: `src/controllers/postController.ts`

**Changes:**

- Removed `await` keywords (synchronous operations now)
- Updated to work with new synchronous model methods

---

## Routes

### Added: Author Routes

**File**: `src/routes/authorRoutes.ts`

Routes configured:

- `GET /admin/authors` - List authors
- `GET /admin/authors/new` - Create form
- `POST /admin/authors` - Create author
- `GET /admin/authors/:id/edit` - Edit form
- `POST /admin/authors/:id` - Update author
- `POST /admin/authors/:id/delete` - Delete author

All routes protected with `requireAuth` middleware.

---

## Views

### Added: Author Management Views

#### `src/views/admin/authors/index.njk`

- List all authors with search functionality
- Display post count for each author
- Edit and delete buttons
- Search form
- Responsive table layout

#### `src/views/admin/authors/edit.njk`

- Create/Edit form for authors
- Fields: name (required), email (optional), bio (optional)
- Displays creation/update timestamps for existing authors
- Form validation

### Modified: Post Views

#### `src/views/admin/posts/edit.njk`

- Changed author field from text input to dropdown select
- Populated with all available authors
- Shows selected author on edit

#### `src/views/admin/posts/index.njk`

- Changed display from `post.author` to `post.author.name`
- Shows "Anonymous" if no author assigned

#### `src/views/posts/show.njk`

- Updated to display `author.name` with fallback to "Anonymous"

### Modified: Admin Layout

**File**: `src/views/admin/layout.njk`

**Changes:**

- Added "Authors" navigation link in admin menu
- Positioned between "Posts" and "Logout"

---

## Application Bootstrap

### Modified: App Entry Point

**File**: `src/app.ts`

**Changes:**

- Added `initializeDatabase()` call on startup
- Imported and registered `authorRoutes` at `/admin/authors`
- Database initialization before server starts
- Success/error logging for database setup

---

## Configuration Files

### Modified: .gitignore

**File**: `.gitignore`

**Added:**

```
# Database
*.sqlite
*.db
```

### Modified: package.json

**File**: `package.json`

**Changes:**

- Added `better-sqlite3@^12.4.1` to dependencies
- Added `@types/better-sqlite3@^7.6.13` to devDependencies
- Removed data folder copying from `postbuild` script
- Updated build script to only copy views folder

---

## Data Migration

### Migration Process

**Script**: `src/scripts/migrateToSQLite.ts` (created and executed, then removed)

**Results:**

- Migrated 20 posts from `posts.json`
- Created 7 unique authors from post author names
- Established author-post relationships
- 0 errors during migration

**Authors Created:**

- Alex Johnson
- Jane Smith
- Mike Brown
- Sarah Davis
- David Lee
- Emily Chen
- John Doe

---

## Removed Files

### Deleted

- `src/data/posts.json` - Old JSON database
- `dist/data/posts.json` - Compiled copy
- `src/models/postModel.ts.bak` - Backup from refactoring
- `src/scripts/` - Migration scripts directory (temporary)

---

## Architecture Changes

### Data Flow

**Before:**

```
Controller → Model → File System (JSON) → Response
```

**After:**

```
Controller → Model → SQLite Database → Response
                              ↓
                        Foreign Keys
                        Relationships
```

### Synchronous vs Asynchronous

**Before:** Async/await pattern with file system operations
**After:** Synchronous operations with better-sqlite3

### Data Relationships

**Before:** Plain string author field in posts
**After:** Proper relational model with foreign keys

---

## Features Added

1. **Author Management**

   - Full CRUD operations for authors
   - Search functionality
   - Post count aggregation
   - Author-post relationship visualization

2. **Data Integrity**

   - Foreign key constraints
   - Unique constraints (email, slug)
   - NOT NULL constraints
   - ON DELETE SET NULL for orphaned posts

3. **Performance**

   - Indexed columns for fast queries
   - Prepared statements
   - Efficient JOINs
   - Synchronous API (no async overhead)

4. **Security**

   - SQL injection prevention (prepared statements)
   - XSS protection (sanitize-html)
   - Unique slugs for posts

5. **Developer Experience**
   - TypeScript type safety
   - Centralized database configuration
   - Consistent error handling
   - Comprehensive comments (English/German)

---

## Technical Stack

### Before

- Express 4.18.2
- File system storage (JSON)
- Async/await pattern
- No relational data

### After

- Express 4.18.2 (unchanged)
- SQLite (better-sqlite3 12.4.1)
- Synchronous operations
- Relational database with foreign keys
- Author management system

---

## Build Process

### Updated

- TypeScript compilation remains the same
- Views copying unchanged
- **Removed:** Data folder copying (no longer needed)
- **Added:** Database initialization on startup

---

## Testing & Validation

### Verified

✅ All 20 posts migrated successfully  
✅ 7 authors created from unique names  
✅ Server starts successfully on http://localhost:3000  
✅ Database initializes with proper schema  
✅ Foreign key constraints working  
✅ CRUD operations functional for both posts and authors  
✅ Search functionality operational  
✅ Admin panel fully functional

---

## Summary

This project has been successfully transformed from a simple JSON file-based blog into a production-ready application with:

- **Relational database** (SQLite) with proper schema design
- **Author management** system with full CRUD operations
- **Data integrity** through foreign keys and constraints
- **Type safety** with comprehensive TypeScript interfaces
- **Security** improvements with prepared statements and XSS protection
- **Performance** optimization with indexes and synchronous operations
- **Clean architecture** following MVC pattern
- **Professional admin interface** for content and author management

The migration maintains backward compatibility in the user-facing interface while significantly improving the data layer and administrative capabilities.
