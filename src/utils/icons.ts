/**
 * Icon utility module that centralizes all icon imports and provides consistent naming.
 * This helps maintain consistency across the application and makes it easier to switch
 * icon libraries if needed in the future.
 */

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  Users,
  Settings,
  Wrench,
  Home
} from 'lucide-react';

/**
 * Icon type definition for type safety when using icons
 */
export type IconType = LucideIcon;

/**
 * Standard icon set used throughout the application.
 * When adding new icons:
 * 1. Import the icon from lucide-react
 * 2. Add it to this export object
 * 3. Use semantic naming if the icon represents a specific action
 */
export {
  ArrowLeft,
  Plus,
  Pencil as EditIcon, // Standardizing on Pencil for edit operations
  Trash2 as DeleteIcon, // Adding semantic names for better code readability
  X as CloseIcon,
  ChevronRight,
  ChevronDown,
  Users as UsersIcon,
  Settings as SettingsIcon,
  Wrench as ToolsIcon,
  Home as HomeIcon
}; 