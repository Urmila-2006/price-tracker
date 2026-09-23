import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, PlusCircle, Bell, LogOut, Activity, User as UserIcon } from 'lucide-react';
import api from '../services/api';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
      
    // Fetch product count for the badge
    api.get('/products')
      .then(res => setProductCount(res.data.length))
      .catch(console.error);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'My Products', path: '/products', icon: <Package size={20} /> },
    { name: 'Add Product', path: '/products/add', icon: <PlusCircle size={20} /> },
    { name: 'Alerts', path: '/alerts', icon: <Bell size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="flex w-72 flex-col border-r border-white/50 bg-white/70 backdrop-blur-md shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex h-20 items-center gap-2 px-8">
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2 text-white shadow-md shadow-indigo-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">PriceTracker</h1>
        </div>
        
        <nav className="mt-6 flex-1 flex-col gap-1 px-4">
          <div className="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Menu
          </div>
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center justify-between rounded-xl px-4 py-3 font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20' 
                    : 'text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500 transition-colors duration-300'}`}>
                    {item.icon}
                  </div>
                  {item.name}
                </div>
                
                {/* Product Count Badge */}
                {item.name === 'My Products' && productCount !== null && (
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-300 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                  }`}>
                    {productCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* User Profile Footer */}
        <div className="border-t border-white/50 p-4">
          <div className="flex items-center justify-between rounded-xl p-3 hover:bg-white hover:shadow-sm transition-all duration-300">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 border border-white">
                <UserIcon size={20} />
              </div>
              <div className="truncate">
                <p className="truncate text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-indigo-500/70 font-medium">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <Outlet />
      </main>
    </div>
  );
}
