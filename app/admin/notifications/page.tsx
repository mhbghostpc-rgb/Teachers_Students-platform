'use client';
import { useState, useEffect } from 'react';
import { FaBell, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/admin/alerts');
        const data = await res.json();
        if (data.alerts) setAlerts(data.alerts);
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <FaExclamationTriangle className="text-yellow-500" size={24} />;
      case 'error': return <FaTimesCircle className="text-red-500" size={24} />;
      case 'success': return <FaCheckCircle className="text-green-500" size={24} />;
      default: return <FaInfoCircle className="text-blue-500" size={24} />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <FaBell size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إشعارات النظام</h1>
          <p className="text-gray-500">متابعة التنبيهات والأحداث الهامة في المنصة</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">جاري تحميل الإشعارات...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">لا توجد إشعارات حالياً.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors flex gap-4 items-start">
                <div className="mt-1 shrink-0">
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{alert.title}</h3>
                    <span className="text-sm text-gray-500" dir="ltr">
                      {new Date(alert.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
