# FAQ System Implementation Guide

This document describes the FAQ system implementation, including how FAQs are loaded, what FAQs are included, and how to seed them.

## Overview

The FAQ system has been enhanced to:
1. **Load FAQs automatically** when the FAQ tab is opened (no search required)
2. **Display popular FAQs** sorted by view count and helpful count
3. **Provide comprehensive documentation** with detailed answers covering all aspects of the inventory management system

## Changes Made

### 1. Frontend Component Update (`FAQSearch.jsx`)

**Location:** `inventory_module/src/components/chat/FAQSearch.jsx`

**Changes:**
- Added `initialLoading` state to track initial FAQ load
- Added `loadInitialFAQs()` function that loads FAQs on component mount
- Updated UI to show "Popular FAQs" section when no search query
- Enhanced empty states for better user experience
- Added safeguards to prevent race conditions

**Behavior:**
- When FAQ tab opens: Automatically loads top 10 FAQs (sorted by popularity)
- When user searches: Shows search results
- When search is cleared: Reloads popular FAQs
- Shows appropriate loading states for initial load vs search

### 2. FAQ Seed Script (`seedFAQs.js`)

**Location:** `Ethernet-CRM-pr-executive-management/server/src/scripts/seedFAQs.js`

**Purpose:** Seeds the database with comprehensive FAQs covering:
- Material Management (3 FAQs)
- Purchase Requests (4 FAQs)
- Stock Management (5 FAQs)
- Reports & Analytics (2 FAQs)
- User Management & Permissions (2 FAQs)
- General System Usage (4 FAQs)

**Total:** 20 comprehensive FAQs with detailed documentation

### 3. Package.json Script

**Added command:** `npm run seed:faqs`

**Usage:**
```bash
cd Ethernet-CRM-pr-executive-management/server
npm run seed:faqs
```

## FAQ Categories and Topics

### Material Management
- How to add new materials
- How to edit/update materials
- Understanding product codes

### Purchase Requests
- Creating purchase requests
- Tracking request status
- Post-approval workflow
- Canceling/modifying requests

### Stock Management
- Checking stock levels
- Recording consumption
- Understanding Inward vs Stock Transfer
- Recording inward transactions
- Stock transfers between locations
- Returning stock to suppliers

### Reports & Analytics
- Generating inventory reports
- Available report types

### User Management
- Roles and permissions
- Updating profile information

### General System
- Searching for materials/requests
- Printing documents
- Handling errors
- Getting help and support

## How to Seed FAQs

### Option 1: Using npm script (Recommended)
```bash
cd Ethernet-CRM-pr-executive-management/server
npm run seed:faqs
```

### Option 2: Direct Node execution
```bash
cd Ethernet-CRM-pr-executive-management/server
node src/scripts/seedFAQs.js
```

### What the Script Does:
1. Connects to the database
2. Checks if each FAQ already exists (by question text)
3. Creates FAQs that don't exist yet
4. Skips FAQs that already exist (prevents duplicates)
5. Reports summary of created vs skipped FAQs

## FAQ Structure

Each FAQ includes:
- **Question**: Clear, user-friendly question
- **Answer**: Detailed, step-by-step documentation
- **Category**: Organizes FAQs by topic area
- **Keywords**: Array of search terms for better discoverability

### Example FAQ Structure:
```javascript
{
  question: 'How do I add a new material to the inventory system?',
  answer: 'Step-by-step instructions with detailed explanations...',
  category: 'Material Management',
  keywords: ['material', 'add', 'create', 'product', 'inventory']
}
```

## Backend API

The FAQ system uses existing API endpoints:

- `GET /chat/faqs` - Get all FAQs (supports search, category, limit parameters)
- `GET /chat/faqs/:id` - Get FAQ by ID
- `POST /chat/faqs` - Create FAQ (Admin only)
- `PUT /chat/faqs/:id` - Update FAQ (Admin only)
- `DELETE /chat/faqs/:id` - Delete FAQ (Admin only)
- `POST /chat/faqs/:id/helpful` - Mark FAQ as helpful/not helpful
- `POST /chat/faqs/interaction` - Log FAQ interaction

**Popular FAQs Query:**
When no search parameter is provided, the API returns FAQs ordered by:
1. `view_count` (descending)
2. `helpful_count` (descending)
3. Limited to 10 results by default

## User Experience Flow

1. **User opens FAQ tab:**
   - Component mounts
   - `loadInitialFAQs()` is called automatically
   - Shows "Loading FAQs..." indicator
   - Displays "Popular FAQs" section with top 10 FAQs

2. **User searches:**
   - Types in search box
   - Search is debounced (300ms)
   - Shows "Searching..." indicator
   - Displays search results with count
   - Shows "No results" if nothing matches

3. **User clicks FAQ:**
   - Expands to show full answer
   - Logs click interaction
   - Shows helpful/not helpful buttons
   - Displays view and feedback counts

4. **User clears search:**
   - Popular FAQs are reloaded
   - Returns to initial state

## Future Enhancements

Potential improvements:
1. **Categories/Tags**: Group FAQs by category in UI
2. **Pagination**: Load more FAQs with "Load More" button
3. **Featured FAQs**: Highlight important FAQs at the top
4. **Related FAQs**: Show related FAQs when viewing one
5. **FAQ Admin Interface**: UI for managing FAQs (currently via API)
6. **Analytics**: Track most viewed FAQs, search terms, etc.

## Troubleshooting

### FAQs not loading:
1. Check database connection
2. Verify FAQ table exists (run migrations if needed)
3. Check browser console for errors
4. Verify API endpoint is accessible

### FAQs not showing after seeding:
1. Check seed script ran successfully
2. Verify FAQs were created in database
3. Check if FAQs have `is_active = true`
4. Clear browser cache and reload

### Search not working:
1. Verify search parameter is being sent
2. Check API logs for errors
3. Verify database supports FULLTEXT search (falls back to LIKE if not)

## Database Schema

The FAQ table structure:
- `faq_id`: Primary key (auto-increment)
- `question`: FAQ question (TEXT, required)
- `answer`: FAQ answer (TEXT, required)
- `category`: Category name (VARCHAR(100), optional)
- `keywords`: JSON array of search keywords (TEXT)
- `view_count`: Number of views (INT, default 0)
- `helpful_count`: Helpful votes (INT, default 0)
- `not_helpful_count`: Not helpful votes (INT, default 0)
- `is_active`: Active status (BOOLEAN, default true)
- `created_at`: Creation timestamp
- `updated_at`: Update timestamp

## Support

For issues or questions:
1. Check this documentation
2. Review FAQ answers in the system
3. Use the chat support feature
4. Contact system administrator

