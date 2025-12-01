import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';

const LowStockAlert = () => {
  const { products } = useProducts();

  const lowStockItems = products
    .filter(product => product.stock <= (product.min_stock || 5) && product.stock > 0)
    .slice(0, 3);
  if (lowStockItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h2>
        <div className="text-center py-4">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-gray-500">All products are well stocked</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
        <span className="bg-red-100 text-red-600 text-sm px-2 py-1 rounded-full">
          {lowStockItems.length} items
        </span>
      </div>
      
      <div className="space-y-3">
        {lowStockItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                <p className="text-xs text-yellow-600">
                  {item.stock} left (min: {item.min_stock || 5})
                </p>
              </div>
            </div>
            <button className="text-yellow-600 hover:text-yellow-700">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium text-center">
        View All Alerts
      </button>
    </div>
  );
};

export default LowStockAlert;