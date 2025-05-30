import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Product } from '../App';
import { productService } from '../services';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// Using local ProductCard & CategoryTab definitions

// Product Card Component
export const ProductCard: React.FC<{   
  product: Product;
  onAddToCart: () => void;
}> = ({ product, onAddToCart }) => {
  // Check if product is available (quantity > 0)
  const isAvailable = product.quantity > 0;
  
  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className={`w-full h-48 object-cover object-center transition-transform duration-300 group-hover:scale-105 ${!isAvailable ? 'opacity-70' : ''}`} 
        />
        {product.badge && (
          <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${
            product.badge === 'Bestseller' ? 'bg-accent-500' :
            product.badge === 'New' ? 'bg-secondary-500' :
            product.badge === 'Limited' ? 'bg-red-500' :
            product.badge === 'Premium' ? 'bg-purple-600' :
            product.badge === 'Healthy' ? 'bg-green-500' :
            'bg-primary-500'
          } text-white`}>
            {product.badge}
          </span>
        )}
        
        {/* Show "Not Available" badge when quantity is 0 */}
        {!isAvailable && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full bg-red-500 text-white">
            Not Available
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h2 className="font-heading text-lg font-semibold text-gray-800 mb-1">{product.name}</h2>
        <p className="text-sm text-gray-600 mb-3 h-10 line-clamp-2">{product.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-primary-600">${product.price.toFixed(2)}</span>
          <button
            className={`px-3 py-2 rounded-lg transition-colors duration-300 flex items-center ${
              isAvailable 
                ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                : 'bg-gray-300 cursor-not-allowed text-gray-500'
            }`}
            onClick={isAvailable ? onAddToCart : undefined}
            disabled={!isAvailable}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            {isAvailable ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Category Tab Component
export const CategoryTab: React.FC<{   
  category: string;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ category, label, active, onClick }) => (
  <button
    className={`px-4 py-2 font-medium rounded-lg transition-colors ${
      active 
        ? 'bg-primary-600 text-white' 
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

const Home: React.FC<{ addToCart: (item: Product) => void }> = ({ addToCart }) => {
  // State for active category
  const [activeCategory, setActiveCategory] = useState<'Property' | 'IT' | 'All'>('Property');
  
  // State for products
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch products from the database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const products = await productService.getAllProducts();
        setAllProducts(products);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Get products for the active category
  const categoryProducts = allProducts.filter(product => 
    activeCategory === 'All' ? true : product.category === activeCategory
  );
  
  // Get featured products (products with badges)
  const featuredProducts = allProducts.filter(product => product.badge);
  
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Welcome to <span className="text-primary-600">VTS Capital Management</span>
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8 text-lg">
          Professional property management and IT consultancy services. 
          We help you maximize your property investments and optimize your technology infrastructure.
        </p>
        <div className="flex justify-center space-x-4">
          <a href="#featured" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300">
            View Services
          </a>
          <a href="#about" className="bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-lg font-medium transition-colors duration-300">
            Learn More
          </a>
        </div>
      </section>
      
      {/* Loading and Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
          <p className="font-medium">{error}</p>
          <p className="mt-1">Please try refreshing the page or check back later.</p>
        </div>
      )}
      
      {/* Content when products are loaded */}
      {!loading && !error && (
        <>
          {/* Featured Products */}
          <section id="featured" className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800">
                Featured Services
              </h2>
              <div className="flex space-x-2">
                <button className="swiper-button-prev-custom bg-white rounded-full p-2 shadow hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button className="swiper-button-next-custom bg-white rounded-full p-2 shadow hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            {featuredProducts.length > 0 ? (
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                navigation={{
                  prevEl: '.swiper-button-prev-custom',
                  nextEl: '.swiper-button-next-custom',
                }}
                pagination={{ clickable: true }}
                loop={featuredProducts.length > 1}
                autoplay={featuredProducts.length > 1 ? { delay: 5000, disableOnInteraction: false } : false}
                className="pb-12"
              >
                {featuredProducts.map((product) => (
                  <SwiperSlide key={product.id || product.name} className="pb-4">
                    <ProductCard 
                      product={product} 
                      onAddToCart={() => addToCart(product)} 
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No featured services available at the moment.</p>
              </div>
            )}
          </section>
          
          {/* Product Categories */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800">
                Our Services
              </h2>
              <div className="flex space-x-2">
                <CategoryTab 
                  category="Property" 
                  label="Property Management" 
                  active={activeCategory === 'Property'} 
                  onClick={() => setActiveCategory('Property')} 
                />
                <CategoryTab 
                  category="IT" 
                  label="IT Consultancy" 
                  active={activeCategory === 'IT'} 
                  onClick={() => setActiveCategory('IT')} 
                />
                <CategoryTab 
                  category="All" 
                  label="All" 
                  active={activeCategory === 'All'} 
                  onClick={() => setActiveCategory('All')} 
                />
              </div>
            </div>
            
            {categoryProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map((product) => (
                  <ProductCard 
                    key={product.id || product.name}
                    product={product} 
                    onAddToCart={() => addToCart(product)} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No services available in this category at the moment.</p>
                <p className="text-gray-500 mt-2">Please check back later or try another category.</p>
              </div>
            )}
          </section>
        </>
      )}
      
      {/* About Section */}
      <section id="about" className="bg-primary-50 rounded-xl p-8 mb-12">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              About VTS Capital Management
            </h2>
            <p className="text-gray-700 mb-4">
              VTS Capital Management began with a vision to provide comprehensive property management 
              and IT consultancy services. Our expertise spans across real estate investment optimization 
              and cutting-edge technology solutions for businesses.
            </p>
            <p className="text-gray-700">
              Each client partnership is built on trust, transparency, and results. 
              We combine deep market knowledge with innovative technology to deliver 
              exceptional value for property investors and businesses seeking IT excellence.
            </p>
          </div>
          <div className="md:w-1/2 grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-primary-600 mb-2">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">Professional</h3>
              <p className="text-sm text-gray-600">Expert property management with proven results.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-secondary-600 mb-2">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">Trusted Partners</h3>
              <p className="text-sm text-gray-600">Building lasting relationships with our clients.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-accent-500 mb-2">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">IT Solutions</h3>
              <p className="text-sm text-gray-600">Custom technology consulting for your business needs.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-green-600 mb-2">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.632 3.533A2 2 0 016.577 2h6.846a2 2 0 011.945 1.533l1.976 8.234A3.489 3.489 0 0016 11.5H4c-.476 0-.93.095-1.344.267l1.976-8.234z" clipRule="evenodd"></path>
                  <path fillRule="evenodd" d="M4 13a2 2 0 100 4h12a2 2 0 100-4H4zm11.24 2a.75.75 0 01.75-.75H16a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V15zm-2.25-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75h-.01z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1">Sustainable Growth</h3>
              <p className="text-sm text-gray-600">Long-term strategies for property investment success.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
