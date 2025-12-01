import React, { useState, useEffect } from 'react';
import { Save, Download, Bell, Shield, User, Moon, Sun, Globe, Eye, RefreshCw } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    notifications_enabled: true,
    email_notifications: true,
    items_per_page: 10,
    default_view: 'table',
    low_stock_threshold: 5,
    auto_refresh: false,
    refresh_interval: 30
  });

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const response = await api.get('/api/user-settings');
      const data = response.data;
      
      // Ensure all fields have values (no undefined)
      setSettings({
        theme: data.theme || 'light',
        language: data.language || 'en',
        notifications_enabled: Boolean(data.notifications_enabled),
        email_notifications: Boolean(data.email_notifications),
        items_per_page: parseInt(data.items_per_page) || 10,
        default_view: data.default_view || 'table',
        low_stock_threshold: parseInt(data.low_stock_threshold) || 5,
        auto_refresh: Boolean(data.auto_refresh),
        refresh_interval: parseInt(data.refresh_interval) || 30
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepare data for API
      const settingsToSend = {
        ...settings,
        notifications_enabled: settings.notifications_enabled,
        email_notifications: settings.email_notifications,
        auto_refresh: settings.auto_refresh,
        items_per_page: parseInt(settings.items_per_page),
        low_stock_threshold: parseInt(settings.low_stock_threshold),
        refresh_interval: parseInt(settings.refresh_interval)
      };
      
      await api.put('/api/user-settings', settingsToSend);
      alert('Settings saved successfully!');
      
      // Apply theme immediately
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = {
      settings: settings,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stockmaster-settings.json';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your preferences and system settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Settings</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <nav className="space-y-2 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            {['Appearance', 'Notifications', 'Interface', 'Inventory'].map((item) => (
              <button
                key={item}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Appearance Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              {settings.theme === 'dark' ? (
                <Moon className="w-6 h-6 text-primary-600" />
              ) : (
                <Sun className="w-6 h-6 text-primary-600" />
              )}
              <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Theme</p>
                  <p className="text-sm text-gray-500">Choose light or dark mode</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSettings({...settings, theme: 'light'})}
                    className={`px-4 py-2 rounded-lg ${settings.theme === 'light' ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setSettings({...settings, theme: 'dark'})}
                    className={`px-4 py-2 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-6 h-6 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Enable Notifications</p>
                  <p className="text-sm text-gray-500">Receive in-app notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications_enabled}
                    onChange={(e) => setSettings({...settings, notifications_enabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive email alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_notifications}
                    onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Interface Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Eye className="w-6 h-6 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Interface</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items Per Page
                </label>
                <select
                  value={settings.items_per_page}
                  onChange={(e) => setSettings({...settings, items_per_page: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                >
                  <option value={10}>10 items</option>
                  <option value={25}>25 items</option>
                  <option value={50}>50 items</option>
                  <option value={100}>100 items</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default View
                </label>
                <select
                  value={settings.default_view}
                  onChange={(e) => setSettings({...settings, default_view: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                >
                  <option value="table">Table View</option>
                  <option value="card">Card View</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <RefreshCw className="w-6 h-6 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Inventory Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.low_stock_threshold}
                  onChange={(e) => setSettings({...settings, low_stock_threshold: parseInt(e.target.value) || 5})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Products with stock below this will be marked as low stock
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Auto Refresh</p>
                  <p className="text-sm text-gray-500">Automatically refresh data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_refresh}
                    onChange={(e) => setSettings({...settings, auto_refresh: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {settings.auto_refresh && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refresh Interval (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={settings.refresh_interval}
                    onChange={(e) => setSettings({...settings, refresh_interval: parseInt(e.target.value) || 30})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;