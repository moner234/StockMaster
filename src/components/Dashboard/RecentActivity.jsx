import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, Plus, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/activity-logs?limit=10');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'PRODUCT_CREATED':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'PRODUCT_UPDATED':
      case 'STOCK_INCREASED':
      case 'STOCK_DECREASED':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <button 
          onClick={fetchActivities}
          disabled={loading}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-4">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No activity yet</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <span className="truncate">
                    {activity.user_name || 'System'} • {activity.product_name || 'General'}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap">
                {formatTime(activity.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-center">
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All Activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;