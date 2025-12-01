import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import CategoryForm from '../components/Categories/CategoryForm';
import CategoryTable from '../components/Categories/CategoryTable';

const Categories = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const { categories, products, deleteCategory, addCategory, updateCategory, loading, error } = useProducts();

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (category) => {
    const productsInCategory = products.filter(p => p.category === category.name);
    
    if (productsInCategory.length > 0) {
      alert(`Cannot delete category "${category.name}" because it has ${productsInCategory.length} product(s) assigned to it.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      try {
        await deleteCategory(category.id);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleSave = async (categoryData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
      } else {
        await addCategory(categoryData);
      }
      setShowForm(false);
      setEditingCategory(null);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage product categories and organization</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setShowForm(true);
          }}
          disabled={loading}
          className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <CategoryTable 
        categories={categories}
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

export default Categories;