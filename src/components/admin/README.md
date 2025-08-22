# Admin Dashboard Components

This directory contains the separated components for the admin dashboard, organized for better maintainability.

## File Structure

```
src/components/admin/
├── index.ts              # Central exports for easier imports
├── types.ts              # Shared TypeScript interfaces
├── utils.ts              # Utility functions (auth headers, error handling)
├── api.ts                # API operations (CRUD functions)
├── PortalModal.tsx       # Modal for viewing JSON data
├── UserFormModal.tsx     # Modal for creating/editing users
├── SessionFormModal.tsx  # Modal for creating/editing sessions
├── UsersTable.tsx        # Users table with CRUD actions
├── SessionsTable.tsx     # Sessions table with CRUD actions
└── FinetuneTable.tsx     # Finetune data table with view/delete actions
```

## Components Overview

### Core Components
- **PortalModal**: Reusable modal for displaying JSON data in a formatted way
- **UserFormModal**: Form modal for creating and editing users with password handling
- **SessionFormModal**: Form modal for creating and editing sessions with user selection

### Table Components
- **UsersTable**: Displays users with edit/delete actions and add button
- **SessionsTable**: Displays sessions with user information lookup and CRUD actions
- **FinetuneTable**: Displays finetune data with statistics, view actions, delete, and export functionality

### Utility Files
- **types.ts**: Centralized type definitions for User, Session, and FinetuneData
- **utils.ts**: Helper functions for authentication headers and error handling
- **api.ts**: All API operations separated from UI components for better organization

## Usage

The main dashboard page (`src/app/admin-dashboard/page.tsx`) imports these components and orchestrates their interactions. All functionality and workflows remain exactly the same as before - this refactoring only improves code organization.

## Features Maintained

✅ **Users Section**:
- View firstname and lastname
- Create, edit, delete operations
- Password hashing on create/update

✅ **Sessions Section**:
- Query firstname, lastname, email from user ID
- Create, edit, delete operations
- User information display in table

✅ **Finetune Data Section**:
- Query user information from userId
- Create and delete operations
- View training data and feedback modals
- Export high-quality training data
- Statistics dashboard

## Benefits of This Structure

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be easily reused in other parts of the application
3. **Testability**: Smaller components are easier to unit test
4. **Code Organization**: Related functionality is grouped together
5. **Import Management**: Central index file makes imports cleaner
6. **Type Safety**: Shared types ensure consistency across components
