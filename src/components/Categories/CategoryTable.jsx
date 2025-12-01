import React, { useState } from 'react';
import { Edit2, Trash2, Search, AlertCircle } from 'lucide-react';

const CategoryTable = ({ categories, products, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductsInCategory = (categoryName) => {
    return products.filter(product => product.category === categoryName);
  };

  const getLowStockCount = (categoryName) => {
    return getProductsInCategory(categoryName).filter(p => p.status === 'low-stock').length;
  };

  const getOutOfStockCount = (categoryName) => {
    return getProductsInCategory(categoryName).filter(p => p.status === 'out-of-stock').length;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredCategories.length} of {categories.length} categories
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCategories.map((category) => {
              const productCount = getProductsInCategory(category.name).length;
              const lowStockCount = getLowStockCount(category.name);
              const outOfStockCount = getOutOfStockCount(category.name);

              return (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">{category.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{productCount} products</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {lowStockCount > 0 && (
                        <div className="flex items-center text-xs text-warning-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {lowStockCount} low stock
                        </div>
                      )}
                      {outOfStockCount > 0 && (
                        <div className="flex items-center text-xs text-danger-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {outOfStockCount} out of stock
                        </div>
                      )}
                      {lowStockCount === 0 && outOfStockCount === 0 && (
                        <div className="text-xs text-success-600">All items in stock</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(category)}
                        className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(category)}
                        className="text-danger-600 hover:text-danger-900 p-1 rounded hover:bg-danger-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No categories found</div>
            <div className="text-gray-500 text-sm mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first category to get started'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryTable;