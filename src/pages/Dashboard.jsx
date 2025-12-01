import React from 'react';
import StatsGrid from '../components/Dashboard/StatsGrid';
import RecentActivity from '../components/Dashboard/RecentActivity';
import QuickActions from '../components/Dashboard/QuickActions';
import LowStockAlert from '../components/Dashboard/LowStockAlert';
import Chart from '../components/Dashboard/Chart';
import { useProducts } from '../hooks/useProducts';

const Dashboard = () => {
  const { getDashboardStats } = useProducts();
  const stats = getDashboardStats();

  const statsData = [
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      change: '+12%',
      changeType: 'positive',
      icon: '📦',
      description: 'Across all categories'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStock.toString(),
      change: '+5%',
      changeType: 'negative',
      icon: '⚠️',
      description: 'Need restocking'
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStock.toString(),
      change: '-2%',
      changeType: 'positive',
      icon: '🚫',
      description: 'Urgent attention needed'
    },
    {
      title: 'Total Inventory Value',
      value: stats.totalValue,
      change: '+8%',
      changeType: 'positive',
      icon: '💰',
      description: 'Current stock value'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your inventory overview.</p>
        </div>
      </div>

      <StatsGrid stats={statsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        <div className="space-y-6">
          <QuickActions />
          <LowStockAlert />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Categories</span>
              <span className="text-sm font-medium text-gray-900">4</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Suppliers</span>
              <span className="text-sm font-medium text-gray-900">3</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">This Month Sales</span>
              <span className="text-sm font-medium text-gray-900">$12,450</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;