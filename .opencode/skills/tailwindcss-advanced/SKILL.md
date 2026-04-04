---
name: tailwindcss-advanced
description: Advanced Tailwind CSS patterns, component design, dark mode, animations, and responsive layouts. Triggers on tasks involving UI styling, Tailwind components, or CSS implementation.
---

# Tailwind CSS Advanced

## Overview

Advanced patterns and best practices for building maintainable, scalable UIs with Tailwind CSS.

## Trigger

Activate when:
- Building complex UI components
- Creating design systems
- Handling responsive layouts
- Dark mode implementation
- Animations and transitions
- Performance optimization

## Project Setup

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

## Component Patterns

### Button Component

```tsx
// components/ui/button.tsx
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  loading,
  disabled,
  children, 
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
};
```

### Card Component

```tsx
// components/ui/card.tsx
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
}

export const Card = ({ className, variant = 'default', ...props }: CardProps) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800',
    bordered: 'border border-gray-200 dark:border-gray-700',
    elevated: 'shadow-lg',
  };

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 py-4 border-b border-gray-200 dark:border-gray-700', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 py-4', className)} {...props} />
);
```

## Layout Patterns

### Responsive Grid

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Auto-fit columns
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Flex Utilities

```tsx
// Center content
<div className="flex items-center justify-center min-h-screen">
  <Content />
</div>

// Space between
<nav className="flex items-center justify-between px-6">
  <Logo />
  <Links />
</nav>

// Sticky header
<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg">
```

## Dark Mode

### Implementation

```tsx
// Toggle button
<button
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
>
  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
</button>

// Or use next-themes
import { useTheme } from 'next-themes';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
};
```

### Component Styles

```tsx
// Dark mode variant
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <Card className="bg-gray-50 dark:bg-gray-800" />
</div>

// Opacity for overlays
<Overlay className="bg-black/50 dark:bg-white/10" />
```

## Animations

### Transition Classes

```tsx
// Basic transitions
<button className="transition-all duration-200 hover:scale-105">
  Hover me
</button>

// Color transitions
<button className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200">
  Button
</button>

// Complex transitions
<div className="transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
```

### Keyframe Animations

```tsx
// Loading spinner
<div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />

// Fade in
<div className="animate-fade-in">
  Content appears
</div>

// Stagger animations
<div className="space-y-4">
  <div className="animate-slide-in" style={{ animationDelay: '0ms' }} />
  <div className="animate-slide-in" style={{ animationDelay: '100ms' }} />
  <div className="animate-slide-in" style={{ animationDelay: '200ms' }} />
</div>
```

## Responsive Design

### Breakpoints

| Prefix | Min Width | Use Case |
|--------|----------|----------|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

### Mobile-First

```tsx
// Mobile first (base styles)
// Then add larger breakpoints
<div className="
  block sm:hidden          // Mobile only
  hidden sm:block md:hidden  // Tablet only
  hidden md:block lg:hidden  // Desktop only
  hidden lg:block           // Large screens
" />
```

## Best Practices

### DO

```tsx
// ✅ Use component composition
<div className="flex gap-4">
  <Button variant="primary">Save</Button>
  <Button variant="ghost">Cancel</Button>
</div>

// ✅ Extract repeated styles
const cardStyles = "p-6 bg-white rounded-xl border border-gray-200";
<div className={cardStyles}>Content</div>

// ✅ Use arbitrary values sparingly
<div className="top-[calc(100%+4px)]" />
```

### DON'T

```tsx
// ❌ Avoid deeply nested arbitrary values
<div className="hover:bg-[#1a1a1a] [&>span]:text-xs" />

// ❌ Don't repeat complex patterns
<div className="flex items-center justify-between px-6 py-4 bg-white rounded-lg shadow-sm" />

// ❌ Avoid inline styles mixed with Tailwind
<div className="p-4" style={{ color: 'red' }} />
```

## Performance Tips

### Purging Unused CSS

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
};
```

### Using CSS Variables

```css
/* In your CSS */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 220 90% 50%;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium;
    background-color: hsl(var(--color-primary));
  }
}
```

## Utility Functions

### cn() Helper

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
```
