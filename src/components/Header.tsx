import { Wallet, Filter, Settings, LogOut } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Authenticated, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function Header() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo and Title */}
          <div className="logo">
            <div className="logo-icon">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Expense Tracker</h1>
              <p className="text-sm text-gray-500">Shared expense management</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Authenticated>
              <div className="flex items-center space-x-3">
                {/* User Info */}
                {user && (
                  <div className="flex items-center space-x-2">
                    {user.image && (
                      <img 
                        src={user.image} 
                        alt={user.name || 'User'} 
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-700">
                      {user.name?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                )}
                
                {/* Action Buttons */}
                <button className="btn-secondary">
                  <Filter size={20} />
                </button>
                <button className="btn-secondary">
                  <Settings size={20} />
                </button>
                <button 
                  onClick={() => signOut()}
                  className="btn-secondary hover:bg-red-100 hover:text-red-600"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </Authenticated>
          </div>
        </div>
      </div>
    </header>
  );
}