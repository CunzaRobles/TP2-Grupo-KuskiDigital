import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

// Pestañas editoriales con subrayado (Descripción / Origen / Reseñas).
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('flex w-full gap-6 overflow-x-auto border-b [scrollbar-width:none]', className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'relative -mb-px shrink-0 py-3 text-sm font-semibold whitespace-nowrap text-muted-foreground',
        'transition-colors duration-200 ease-andino hover:text-foreground',
        'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary',
        'after:transition-transform after:duration-300 after:ease-andino',
        'data-[state=active]:text-foreground data-[state=active]:after:scale-x-100',
        'focus-visible:rounded-item disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'pt-6 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300',
        className,
      )}
      {...props}
    />
  );
}
