import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import VideoPage from './pages/Video';
import Donate from './pages/Donate';
import Progress from './pages/Progress';
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
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Playground dropdown state
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);

  // Handler to add items to the cart
  const addToCart = (product: Product) => {
    setCartItems(prev => [...prev, product]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown="playground"]')) {
        setIsPlaygroundOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <nav className="bg-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Brand */}
              <div className="flex-shrink-0">
                <Link to="/" className="text-xl font-bold">VTS CRM</Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link to="/" className="hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                    Home
                  </Link>
                  <Link to="/contact" className="hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                    Contact
                  </Link>
                  <Link to="/admin" className="hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                    Admin
                  </Link>
                  
                  {/* Playground Dropdown */}
                  <div className="relative" data-dropdown="playground">
                    <button
                      onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
                      className="hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                    >
                      Playground
                      <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isPlaygroundOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        <Link
                          to="/videos"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsPlaygroundOpen(false)}
                        >
                          Videos
                        </Link>
                        <Link
                          to="/donate"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsPlaygroundOpen(false)}
                        >
                          Donate
                        </Link>
                        <Link
                          to="/progress"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsPlaygroundOpen(false)}
                        >
                          Progress
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <Link to="/cart" className="hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                    Cart ({cartItems.length})
                  </Link>
                </div>
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/contact"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  to="/admin"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
                
                {/* Playground section in mobile */}
                <div className="border-t border-gray-700 pt-2">
                  <div className="px-3 py-2 text-sm font-medium text-gray-300">Playground</div>
                  <Link
                    to="/videos"
                    className="block px-6 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Videos
                  </Link>
                  <Link
                    to="/donate"
                    className="block px-6 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Donate
                  </Link>
                  <Link
                    to="/progress"
                    className="block px-6 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Progress
                  </Link>
                </div>
                
                <Link
                  to="/cart"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cart ({cartItems.length})
                </Link>
              </div>
            </div>
          )}
        </nav>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} />} />
            <Route path="/videos" element={<VideoPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/cart" element={<Cart cartItems={cartItems} setCartItems={setCartItems} />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/progress" element={<Progress />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
