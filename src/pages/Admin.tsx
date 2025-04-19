import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../App';
import { apiService, productService, orderService, messageService } from '../services';
import { Order } from '../services/order.service';
import { Message } from '../services/message.service';

// Form state interfaces
interface ProductFormState {
  id?: number;
  name: string;
  price: string; // Use string for form input
  image: string;
  badge: string;
  description: string;
  category: string;
  quantity: string; // Use string for form input
  imageFile: File | null;
}

interface EmailFormState {
  to: string;
  subject: string;
  message: string;
}

// Removed unused interface

const Admin: React.FC = () => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'messages'>('products');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // Form state
  const emptyProductForm: ProductFormState = {
    name: '',
    price: '',
    image: '',
    badge: '',
    description: '',
    category: 'origami', // Default category
    quantity: '0',
    imageFile: null
  };
  
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [emailForm, setEmailForm] = useState<EmailFormState>({ to: '', subject: '', message: '' });
  // Removing unused orderStatusForm state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Removing unused API_URL constant as it's not being used anywhere

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const data = await apiService.login(loginForm.username, loginForm.password);
      
      // Store the token
      setToken(data.token);
      setIsLoggedIn(true);
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Login failed. Try admin/admin');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    apiService.logout();
    setToken(null);
    setIsLoggedIn(false);
  };
  
  // Fetch data based on active tab
  useEffect(() => {
    if (isLoggedIn && token) {
      if (activeTab === 'products') {
        // Fetch products from the API
        const fetchProducts = async () => {
          if (!token) return;
          
          setDataLoading(true);
          setError(null);
          
          try {
            // Set the token in the API service
            apiService.setToken(token);
            
            // Fetch products using the product service
            const data = await productService.getAllProducts();
            setProducts(data);
          } catch (err: any) {
            console.error('Error fetching products:', err);
            setError(err.message || 'Failed to fetch products');
          } finally {
            setDataLoading(false);
          }
        };
        
        fetchProducts();
      } else if (activeTab === 'orders') {
        // Fetch orders from the API
        const fetchOrders = async () => {
          if (!token) return;
          
          setDataLoading(true);
          setError(null);
          
          try {
            // Set the token in the API service
            apiService.setToken(token);
            
            // Fetch orders using the order service
            const data = await orderService.getAllOrders();
            setOrders(data);
          } catch (err: any) {
            console.error('Error fetching orders:', err);
            setError(err.message || 'Failed to fetch orders');
          } finally {
            setDataLoading(false);
          }
        };
        
        fetchOrders();
      } else if (activeTab === 'messages') {
        // Fetch messages from the API
        const fetchMessages = async () => {
          if (!token) return;
          
          setDataLoading(true);
          setError(null);
          
          try {
            // Set the token in the API service
            apiService.setToken(token);
            
            // Fetch messages using the message service
            const data = await messageService.getAllMessages();
            setMessages(data);
          } catch (err: any) {
            console.error('Error fetching messages:', err);
            setError(err.message || 'Failed to fetch messages');
          } finally {
            setDataLoading(false);
          }
        };
        
        fetchMessages();
      }
    }
  }, [isLoggedIn, token, activeTab]);
  
  // Product management functions
  const handleAddProduct = () => {
    setProductForm(emptyProductForm);
    setSelectedProduct(null);
    setShowProductModal(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      image: product.image,
      badge: product.badge || '',
      description: product.description || '',
      category: product.category || 'origami', // Default to origami if category is undefined
      quantity: product.quantity.toString(),
      imageFile: null
    });
    setSelectedProduct(product);
    setShowProductModal(true);
  };
  
  const handleDeleteProduct = async (productId: number | undefined) => {
    if (!token || productId === undefined) return;
    
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    setDataLoading(true);
    setError(null);
    
    try {
      // Set the token in the API service
      apiService.setToken(token);
      
      // Delete the product using the product service
      await productService.deleteProduct(productId);
      
      // Remove the product from the state
      setProducts(products.filter(p => p.id !== productId));
      setSuccessMessage('Product deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product');
    } finally {
      setDataLoading(false);
    }
  };
  
  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProductForm({
        ...productForm,
        imageFile: file
      });
    }
  };
  
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    // Validate form
    if (!productForm.name.trim()) {
      setError('Product name is required');
      return;
    }
    
    if (!productForm.price.trim() || isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
      setError('Valid price is required');
      return;
    }
    
    if (!productForm.category) {
      setError('Category is required');
      return;
    }
    
    // Validate quantity (must be a non-negative integer)
    if (productForm.quantity.trim() === '' || isNaN(parseInt(productForm.quantity)) || parseInt(productForm.quantity) < 0) {
      setError('Quantity must be a non-negative number');
      return;
    }
    
    // For new products, either an image file or image URL is required
    if (!productForm.id && !productForm.imageFile && !productForm.image) {
      setError('Product image is required');
      return;
    }
    
    setDataLoading(true);
    setError(null);
    
    try {
      // Set the token in the API service
      apiService.setToken(token);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('price', productForm.price);
      formData.append('category', productForm.category);
      formData.append('quantity', productForm.quantity);
      
      if (productForm.badge) {
        formData.append('badge', productForm.badge);
      }
      
      if (productForm.description) {
        formData.append('description', productForm.description);
      }
      
      // If there's a new image file, append it
      if (productForm.imageFile) {
        formData.append('image', productForm.imageFile);
      } else if (productForm.image) {
        formData.append('image', productForm.image);
      }
      
      let data: Product;
      
      if (productForm.id) {
        // Update existing product
        data = await productService.updateProduct(productForm.id, formData);
        
        // Update existing product in state
        setProducts(products.map(p => p.id === productForm.id ? data : p));
        setSuccessMessage('Product updated successfully');
      } else {
        // Create new product
        data = await productService.createProduct(formData);
        
        // Add new product to state
        setProducts([...products, data]);
        setSuccessMessage('Product created successfully');
      }
      
      // Close modal and reset form
      setShowProductModal(false);
      setProductForm(emptyProductForm);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || `Failed to ${productForm.id ? 'update' : 'create'} product`);
    } finally {
      setDataLoading(false);
    }
  };
  
  // Message management functions
  const handleMarkAsRead = async (messageId: number) => {
    if (!token) return;
    
    setDataLoading(true);
    setError(null);
    
    try {
      // Set the token in the API service
      apiService.setToken(token);
      
      // Mark message as read using the message service
      await messageService.getMessageById(messageId);
      
      // Update the message in state
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, isRead: true } : m
      ));
    } catch (err: any) {
      console.error('Error marking message as read:', err);
      setError(err.message || 'Failed to mark message as read');
    } finally {
      setDataLoading(false);
    }
  };
  
  const handleReplyToMessage = (message: Message) => {
    setEmailForm({
      to: message.email,
      subject: `Re: ${message.subject || 'Your message to Folds & Flavors'}`,
      message: ''
    });
    setSelectedMessage(message);
    setShowEmailModal(true);
  };
  
  const handleDeleteMessage = async (messageId: number) => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    setDataLoading(true);
    setError(null);
    
    try {
      // Set the token in the API service
      apiService.setToken(token);
      
      // Delete the message using the message service
      await messageService.deleteMessage(messageId);
      
      // Remove the message from state
      setMessages(messages.filter(m => m.id !== messageId));
      setSuccessMessage('Message deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting message:', err);
      setError(err.message || 'Failed to delete message');
    } finally {
      setDataLoading(false);
    }
  };
  
  // Order management functions
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };
  
  const handleUpdateOrderStatus = async (orderId: number, status: 'pending' | 'completed' | 'cancelled') => {
    if (!token) return;
    
    setDataLoading(true);
    setError(null);
    
    try {
      // Set the token in the API service
      apiService.setToken(token);
      
      // Update the order status using the order service
      await orderService.updateOrderStatus(orderId, status);
      
      // Update the order in state
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status } : o
      ));
      
      setSuccessMessage(`Order status updated to ${status}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
    } finally {
      setDataLoading(false);
    }
  };
  
  // No need for a second useEffect since we've moved the fetch functions inside the first one
  
  // Login form
  if (!isLoggedIn) {
    return (
      <div className="animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-800 mb-2">Admin Login</h1>
          <p className="text-gray-600">Please log in to access the admin dashboard</p>
          <p className="text-gray-500 text-sm mt-2">(Use username: admin, password: admin)</p>
        </div>
        
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {loginError}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                id="username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            
            <div className="text-center mt-4">
              <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
                Return to Store
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-300"
        >
          Logout
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'products'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'orders'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'messages'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {/* Loading indicator */}
        {dataLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        )}
        
        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}
        
        {/* Products Tab */}
        {activeTab === 'products' && !dataLoading && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-xl font-semibold text-gray-800">Products Management</h2>
              <button 
                onClick={handleAddProduct}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
              >
                Add New Product
              </button>
            </div>
            
            {products.length === 0 ? (
              <p className="text-gray-600 py-4">No products found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img src={product.image} alt={product.name} className="h-12 w-12 object-cover rounded" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.badge && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                              {product.badge}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${product.quantity === 0 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                            {product.quantity === 0 ? 'Out of Stock' : product.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Orders Tab */}
        {activeTab === 'orders' && !dataLoading && (
          <div>
            <h2 className="font-heading text-xl font-semibold text-gray-800 mb-4">Orders Management</h2>
            
            {orders.length === 0 ? (
              <p className="text-gray-600 py-4">No orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${order.totalAmount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleViewOrder(order)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            View
                          </button>
                          <div className="relative inline-block text-left">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as 'pending' | 'completed' | 'cancelled')}
                              className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Messages Tab */}
        {activeTab === 'messages' && !dataLoading && (
          <div>
            <h2 className="font-heading text-xl font-semibold text-gray-800 mb-4">Customer Messages</h2>
            
            {messages.length === 0 ? (
              <p className="text-gray-600 py-4">No messages found.</p>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`p-4 rounded-lg border ${message.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {message.subject || 'No Subject'}
                          {!message.isRead && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">New</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">From: {message.name} ({message.email})</p>
                        <p className="text-sm text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {!message.isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(message.id)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button 
                          onClick={() => handleReplyToMessage(message)}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Reply
                        </button>
                        <button 
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-gray-700">
                      <p>{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="font-heading text-2xl font-bold text-gray-800 mb-4">
              {productForm.id ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={productForm.name}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={productForm.category}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="origami">Origami</option>
                    <option value="candies">Candies</option>
                    <option value="snacks">Snacks</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="badge" className="block text-sm font-medium text-gray-700 mb-1">Badge (optional)</label>
                  <select
                    id="badge"
                    name="badge"
                    value={productForm.badge}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">No Badge</option>
                    <option value="New">New</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Popular">Popular</option>
                    <option value="Limited">Limited</option>
                    <option value="Premium">Premium</option>
                    <option value="Healthy">Healthy</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={productForm.quantity}
                    onChange={handleProductFormChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={productForm.description}
                    onChange={handleProductFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  ></textarea>
                </div>
                
                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  
                  {/* Current Image Preview */}
                  {productForm.image && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">Current Image:</p>
                      <img 
                        src={productForm.image} 
                        alt="Current product" 
                        className="h-24 w-24 object-cover rounded border border-gray-300" 
                      />
                    </div>
                  )}
                  
                  {/* File Upload */}
                  <div className="mt-2">
                    <label htmlFor="imageFile" className="block text-sm text-gray-600 mb-1">
                      {productForm.id ? 'Upload New Image (optional):' : 'Upload Image:'}
                    </label>
                    <input
                      type="file"
                      id="imageFile"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {productForm.imageFile && (
                      <p className="mt-1 text-sm text-green-600">
                        New image selected: {productForm.imageFile.name}
                      </p>
                    )}
                  </div>
                  
                  {/* Image URL (as fallback) */}
                  {!productForm.imageFile && (
                    <div className="mt-2">
                      <label htmlFor="image" className="block text-sm text-gray-600 mb-1">
                        Or Enter Image URL:
                      </label>
                      <input
                        type="text"
                        id="image"
                        name="image"
                        value={productForm.image}
                        onChange={handleProductFormChange}
                        placeholder="e.g., /images/product.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dataLoading}
                  className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-300 ${
                    dataLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {dataLoading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Order Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-heading text-2xl font-bold text-gray-800">
                Order #{selectedOrder.id}
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Customer Information</h3>
                <p><span className="font-medium">Name:</span> {selectedOrder.customerName}</p>
                <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</p>
                {selectedOrder.customerPhone && (
                  <p><span className="font-medium">Phone:</span> {selectedOrder.customerPhone}</p>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Order Details</h3>
                <p><span className="font-medium">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </p>
                <p><span className="font-medium">Total:</span> ${selectedOrder.totalAmount.toFixed(2)}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Order Items</h3>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                {item.image && (
                                  <img src={item.image} alt={item.productName} className="h-8 w-8 object-cover rounded mr-2" />
                                )}
                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-900">${item.price.toFixed(2)}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.quantity}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">No items found for this order.</p>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-heading text-2xl font-bold text-gray-800">
                Reply to Message
              </h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  id="to"
                  value={emailForm.to}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  id="message"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-300"
                >
                  Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
