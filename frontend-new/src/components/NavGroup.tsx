import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

const NavGroup = ({ item }: { item: any }) => {
  const { pathname } = useLocation();
  // Automatically open the group if one of its children is active
  const hasActiveChild = item.children?.some((child: any) => pathname === child.path);
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 rounded-xl text-gray-500 hover:bg-purple-50 hover:text-purple-600 transition-all font-medium group"
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
          <span className="text-sm">{item.name}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="ml-9 space-y-1 border-l-2 border-purple-100 pl-2">
          {item.children.map((child: any) => {
            const isActive = pathname === child.path;
            return (
              <Link
                key={child.path}
                to={child.path}
                className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-all ${
                  isActive 
                    ? "text-purple-700 font-bold bg-purple-50" 
                    : "text-gray-500 hover:text-purple-600"
                }`}
              >
                {child.icon && <child.icon className="h-4 w-4" />}
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NavGroup;