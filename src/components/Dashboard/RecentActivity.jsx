import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, LogIn, LogOut, Package, 
  Tag, User, Settings, AlertTriangle, RefreshCw, 
  ArrowUp, ArrowDown, Activity, Clock 
} from 'lucide-react';
import api from '../../services/api';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/dashboard/recent-activities');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Refresh every 30 seconds if auto-refresh is enabled
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'USER_REGISTERED':
      case 'PRODUCT_CREATED':
      case 'CATEGORY_CREATED':
        return <Plus className="w-4 h-4 text-green-600" />;
      
      case 'USER_LOGIN':
        return <LogIn className="w-4 h-4 text-blue-600" />;
      
      case 'USER_LOGOUT':
        return <LogOut className="w-4 h-4 text-gray-600" />;
      
      case 'PRODUCT_UPDATED':
      case 'CATEGORY_UPDATED':
      case 'PROFILE_UPDATED':
      case 'SETTINGS_UPDATED':
        return <Edit className="w-4 h-4 text-yellow-600" />;
      
      case 'PRODUCT_DELETED':
      case 'CATEGORY_DELETED':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      
      case 'STOCK_INCREASED':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      
      case 'STOCK_DECREASED':
      case 'STOCK_ADJUSTED':
        return <ArrowDown className="w-4 h-4 text-orange-600" />;
      
      case 'USER_UPDATED':
        return <User className="w-4 h-4 text-purple-600" />;
      
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    if (type.includes('CREATED')) return 'bg-green-50 border-green-100';
    if (type.includes('LOGIN') || type.includes('LOGOUT')) return 'bg-blue-50 border-blue-100';
    if (type.includes('UPDATED')) return 'bg-yellow-50 border-yellow-100';
    if (type.includes('DELETED')) return 'bg-red-50 border-red-100';
    if (type.includes('STOCK')) return 'bg-orange-50 border-orange-100';
    return 'bg-gray-50 border-gray-100';
  };

  const renderMetadata = (metadata, activity) => {
    if (!metadata) return null;
    
    const items = [];
    
    if (metadata.sku) items.push(`SKU: ${metadata.sku}`);
    if (metadata.price) items.push(`Price: $${metadata.price}`);
    if (metadata.stock !== undefined) items.push(`Stock: ${metadata.stock}`);
    if (metadata.quantity) items.push(`Quantity: ${metadata.quantity}`);
    if (metadata.theme) items.push(`Theme: ${metadata.theme}`);
    if (metadata.stock_change) items.push(`Stock Δ: ${metadata.stock_change > 0 ? '+' : ''}${metadata.stock_change}`);
    
    if (items.length === 0) return null;
    
    return (
      <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-1">
        {items.map((item, index) => (
          <span key={index} className="px-2 py-0.5 bg-gray-100 rounded">
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-500">Latest actions in your inventory</p>
        </div>
        <button 
          onClick={fetchActivities}
          disabled={loading}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50 flex items-center"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400 mt-1">Actions will appear here as you use the system</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)} transition-colors`}
            >
              <div className="mt-1 flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                
                {/* Render metadata if available */}
                {renderMetadata(activity.metadata, activity)}
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span className="font-medium">{activity.user_name}</span>
                    
                    {activity.product_name && (
                      <>
                        <span>•</span>
                        <span className="flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          {activity.product_name}
                        </span>
                      </>
                    )}
                    
                    {activity.category_name && (
                      <>
                        <span>•</span>
                        <span className="flex items-center">
                          <Tag className="w-3 h-3 mr-1" />
                          {activity.category_name}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(activity.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 text-center">
        <button 
          onClick={() => {
            console.log('View all activities');
          }}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View All Activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;