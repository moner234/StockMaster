import React from 'react';
import { Plus, Download, Upload, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: 'Add Product',
      description: 'Add new item to inventory',
      color: 'bg-primary-50 text-primary-600 hover:bg-primary-100',
      onClick: () => navigate('/products')
    },
    {
      icon: Upload,
      label: 'Import Data',
      description: 'Bulk import products',
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
      onClick: () => alert('Import functionality coming soon')
    },
    {
      icon: Download,
      label: 'Export Report',
      description: 'Download inventory report',
      color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
      onClick: () => alert('Export functionality coming soon')
    },
    {
      icon: Printer,
      label: 'Print Labels',
      description: 'Print product labels',
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      onClick: () => alert('Print functionality coming soon')
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`p-4 rounded-lg text-left transition-colors ${action.color} cursor-pointer`}
            >
              <Icon className="w-6 h-6 mb-2" />
              <p className="font-medium text-sm">{action.label}</p>
              <p className="text-xs opacity-75">{action.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;