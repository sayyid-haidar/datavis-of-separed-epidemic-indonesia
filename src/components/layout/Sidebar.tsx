import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  MapPin, 
  TrendingUp,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/jakarta', icon: Building2, label: 'Jakarta' },
  { to: '/regional', icon: MapPin, label: 'Regional' },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-card border-r overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 gap-2">
          <Activity className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">DataVis</span>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t p-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <span className="ml-3 text-sm text-muted-foreground">
              Dashboard Wabah
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
