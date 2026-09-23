import { useEffect, useState } from 'react';
import api from '../services/api';
import { Bell, Check, TrendingDown, Target, Activity } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => {
    api.get('/alerts')
      .then(res => {
        setAlerts(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'READ' } : a));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Activity className="h-8 w-8 animate-pulse text-indigo-600" />
      </div>
    );
  }

  const unreadCount = alerts.filter(a => a.status === 'UNREAD').length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Notifications</h2>
          <p className="mt-1 text-sm text-gray-500">Stay updated on your tracked products.</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
            {unreadCount} unread
          </div>
        )}
      </div>
      
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full bg-indigo-50 p-4">
              <Bell size={48} className="text-indigo-200" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">No alerts yet</h3>
            <p className="max-w-sm text-gray-500">When your tracked products reach their target prices, you'll see notifications here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`flex items-start justify-between p-6 transition-colors ${alert.status === 'UNREAD' ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    alert.type === 'PRICE_DROP' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {alert.type === 'PRICE_DROP' ? <TrendingDown size={20} /> : <Target size={20} />}
                  </div>
                  
                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <span className={`text-sm font-bold uppercase tracking-wider ${
                        alert.type === 'PRICE_DROP' ? 'text-green-700' : 'text-amber-700'
                      }`}>
                        {alert.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(alert.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-base ${alert.status === 'UNREAD' ? 'font-semibold text-gray-900' : 'text-gray-700'} mb-2`}>
                      {alert.message}
                    </p>
                    {alert.email_status === 'sent' && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                        <Check size={12} /> Email sent
                      </span>
                    )}
                    {alert.email_status === 'failed' && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                        Email failed to send
                      </span>
                    )}
                  </div>
                </div>
                
                {alert.status === 'UNREAD' && (
                  <button 
                    onClick={() => markAsRead(alert.id)}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 text-indigo-600 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors tooltip"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
