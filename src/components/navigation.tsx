import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Plus, 
  Minus, 
  FileText, 
  History,
  Menu,
  X
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'receipt', label: 'Receipt', icon: Plus },
  { id: 'consumption', label: 'Consumption', icon: Minus },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'logs', label: 'Logs', icon: History },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-card/95 backdrop-blur-sm"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t md:relative md:bg-transparent md:border-0 md:backdrop-blur-none",
        "md:flex md:justify-center md:mb-6",
        isOpen ? "block" : "hidden md:block"
      )}>
        <div className="flex justify-around p-2 md:bg-card md:rounded-lg md:shadow-card md:border md:p-1 md:space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  onTabChange(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-1 h-auto py-2 px-3 md:px-4",
                  activeTab === item.id && "bg-primary text-primary-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs md:text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </>
  );
}