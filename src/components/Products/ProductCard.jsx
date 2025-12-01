import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const ProductCard = ({ product, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock': return 'bg-success-100 text-success-800';
      case 'low-stock': return 'bg-warning-100 text-warning-800';
      case 'out-of-stock': return 'bg-danger-100 text-danger-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in-stock': return 'In Stock';
      case 'low-stock': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="p-1.5 text-danger-600 hover:text-danger-900 hover:bg-danger-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Category</span>
          <span className="font-medium text-gray-900">{product.category}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Price</span>
          <span className="font-medium text-gray-900">${product.price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Stock</span>
          <span className="font-medium text-gray-900">{product.stock} units</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
          {getStatusText(product.status)}
        </span>
        <span className="text-xs text-gray-500">
          Updated: {new Date(product.lastUpdated).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;