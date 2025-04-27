import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import VideoPage from './pages/Video';
// Product interface describing the structure returned by the API
export interface Product {
  id?: number;
  name: string;
  price: number;
  image: string;
  badge?: string;
  description?: string;
  category: string;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
}

function App() {
  // Cart state
  const [cartItems, setCartItems] = useState<Product[]>([]);

  // Handler to add items to the cart
  const addToCart = (product: Product) => {
    setCartItems(prev => [...prev, product]);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <nav className="bg-gray-800 text-white p-4 flex space-x-4">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/videos" className="hover:underline">Videos</Link>
          <Link to="/contact" className="hover:underline">Contact</Link>
          <Link to="/admin" className="hover:underline">Admin</Link>
          <Link to="/cart" className="hover:underline">Cart ({cartItems.length})</Link>
        </nav>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} />} />
            <Route path="/videos" element={<VideoPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/cart" element={<Cart cartItems={cartItems} setCartItems={setCartItems} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
