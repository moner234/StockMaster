import React, { useState } from 'react';
import ProductTable from '../components/Products/ProductTable';
import ProductForm from '../components/Products/ProductForm';
import { Plus, Download, Upload } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';

const Products = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { products, categories, addProduct, updateProduct, deleteProduct, loading } = useProducts();

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleSave = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your inventory products and stock levels</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            disabled
            className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-400 cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button 
            disabled
            className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-400 cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setShowForm(true);
            }}
            disabled={loading}
            className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <ProductTable 
        products={products} 
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          categories={categories}
          loading={loading}
        />
      )}
    </div>
  );
};

export default Products;