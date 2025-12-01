import { useState, useEffect } from 'react';
import api from '../services/api';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.message || 'Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const addProduct = async (productData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/products', productData);
      setProducts(prev => [...prev, response.data]);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add product';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id, productData) => {
    setLoading(true);
    try {
      const response = await api.put(`/api/products/${id}`, productData);
      setProducts(prev => prev.map(p => p.id === id ? response.data : p));
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update product';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete product';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (categoryData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/categories', categoryData);
      setCategories(prev => [...prev, response.data]);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add category';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id, categoryData) => {
    setLoading(true);
    try {
      const response = await api.put(`/api/categories/${id}`, categoryData);
      setCategories(prev => prev.map(c => c.id === id ? response.data : c));
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update category';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/api/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete category';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardStats = () => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock <= (p.min_stock || 5) && p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, product) => sum + ((product.price || 0) * (product.stock || 0)), 0);
    
    return {
      totalProducts,
      lowStock,
      outOfStock,
      totalValue: `$${totalValue.toLocaleString()}`,
      categoriesCount: categories.length
    };
  };

  return {
    products,
    categories,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    getDashboardStats,
    refetchProducts: fetchProducts,
    refetchCategories: fetchCategories,
    clearError: () => setError(null)
  };
};