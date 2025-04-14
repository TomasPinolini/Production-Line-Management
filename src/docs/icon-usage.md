# Icon Usage Guidelines

## Overview
This document outlines the standard practices for using icons in our application. We use `lucide-react` as our icon library, with a centralized approach to icon management through our `utils/icons.ts` file.

## Icon Import Pattern
Always import icons from our centralized utility file:
```typescript
import { EditIcon, DeleteIcon, CloseIcon } from '../utils/icons';
```

Never import directly from `lucide-react`:
```typescript
// ❌ Don't do this
import { Pencil, Trash2 } from 'lucide-react';
```

## Standard Icon Names
We use semantic names for our icons to make their purpose clear:

- `EditIcon` - For editing operations (using Pencil icon)
- `DeleteIcon` - For deletion operations (using Trash2 icon)
- `CloseIcon` - For closing/dismissing (using X icon)
- `UsersIcon` - For user-related features
- `SettingsIcon` - For configuration/settings
- `ToolsIcon` - For tools/utilities (using Wrench icon)
- `HomeIcon` - For home navigation
- `Plus` - For adding items
- `ArrowLeft` - For navigation/back operations
- `ChevronRight`, `ChevronDown` - For expandable/collapsible UI elements

## Usage in Components
When using icons in components:

1. Use consistent sizing:
```typescript
<EditIcon className="h-4 w-4" /> // Small
<EditIcon className="h-5 w-5" /> // Medium
<EditIcon className="h-6 w-6" /> // Large
```

2. Add appropriate titles for accessibility:
```typescript
<button title="Edit item">
  <EditIcon className="h-4 w-4" />
</button>
```

3. Use semantic colors from our design system:
```typescript
<EditIcon className="text-blue-600 hover:text-blue-800" />
<DeleteIcon className="text-red-600 hover:text-red-800" />
<CloseIcon className="text-gray-500 hover:text-gray-700" />
```

## Adding New Icons
When adding new icons:

1. Add the import to `utils/icons.ts`
2. Export with a semantic name if applicable
3. Update this documentation
4. Use consistently across components

## TypeScript Support
Our icons are fully typed using the `IconType` type from our utils:

```typescript
import type { IconType } from '../utils/icons';

interface Props {
  icon: IconType;
}
``` 