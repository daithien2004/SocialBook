import { cn } from "@/lib/utils";
import { TabType, TABS } from "@/src/features/books/books.constants";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 overflow-x-auto mb-8 mt-4 border-b border-gray-200 dark:border-gray-700 scrollbar-hide">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap transition-all duration-300',
              isActive
                ? 'text-red-600 dark:text-red-500 border-b-2 border-red-600 dark:border-red-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            <Icon className="w-5 h-5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
