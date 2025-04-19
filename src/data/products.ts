import { Product } from '../App';

// Define a type that extends Product to include category
export interface CategoryProduct extends Product {
  category: 'origami' | 'candies' | 'snacks';
}

// Origami products (keeping the existing ones)
const origamiProducts: CategoryProduct[] = [
  { 
    name: 'Shuriken', 
    price: 0.50, 
    image: '/images/Shuriken.jpg',
    badge: 'Bestseller',
    description: 'Classic throwing star design, perfect for beginners.',
    category: 'origami',
    quantity: 50
  },
  { 
    name: 'Ddakji', 
    price: 1.00, 
    image: '/images/Ddakji.jpg',
    badge: 'Popular',
    description: 'Traditional Korean paper game, as seen in Squid Game.',
    category: 'origami',
    quantity: 100
  },
  { 
    name: 'Kunai', 
    price: 1.50, 
    image: '/images/Kunai.jpg',
    description: 'Inspired by Japanese ninja tools, elegant and precise.',
    category: 'origami',
    quantity: 75
  },
  { 
    name: 'Double Kunai', 
    price: 2.50, 
    image: '/images/DoubleKunai.jpg',
    badge: 'New',
    description: 'Dual-blade design for the advanced folder.',
    category: 'origami',
    quantity: 40
  },
  { 
    name: 'Mega Kunai', 
    price: 2.50, 
    image: '/images/MegaKunai.jpg',
    description: 'Larger version with impressive presence.',
    category: 'origami',
    quantity: 25
  },
  { 
    name: 'Double Edge Katana', 
    price: 2.75, 
    image: '/images/DoubleEdgeKatana.jpg',
    badge: 'Limited',
    description: 'Elegant sword design with double-edged precision.',
    category: 'origami',
    quantity: 20
  },
  { 
    name: 'Gauntlets', 
    price: 3.00, 
    image: '/images/Gauntlets.jpg',
    description: 'Wearable paper armor for your hands.',
    category: 'origami',
    quantity: 30
  },
  { 
    name: 'Lightsaber', 
    price: 5.00, 
    image: '/images/Lightsaber.jpg',
    badge: 'Premium',
    description: 'May the fold be with you. Our most intricate design.',
    category: 'origami',
    quantity: 15
  },
];

// Candy products (new)
const candyProducts: CategoryProduct[] = [
  {
    name: 'Chocolate Bar',
    price: 1.25,
    image: '/images/ChocolateBar.jpg',
    badge: 'Bestseller',
    description: 'Rich and creamy milk chocolate that melts in your mouth.',
    category: 'candies',
    quantity: 60
  },
  {
    name: 'Gummy Bears',
    price: 0.99,
    image: '/images/GummyBears.jpg',
    description: 'Chewy, fruity gummy bears in assorted flavors.',
    category: 'candies',
    quantity: 80
  },
  {
    name: 'Sour Worms',
    price: 1.50,
    image: '/images/SourWorms.jpg',
    description: 'Tangy and sweet sour worms that pack a punch.',
    category: 'candies',
    quantity: 45
  },
  {
    name: 'Lollipops',
    price: 0.75,
    image: '/images/Lollipops.jpg',
    description: 'Colorful swirl lollipops in various fruit flavors.',
    category: 'candies',
    quantity: 70
  },
  {
    name: 'Caramel Chews',
    price: 1.25,
    image: '/images/CaramelChews.jpg',
    badge: 'New',
    description: 'Soft, chewy caramels that melt in your mouth.',
    category: 'candies',
    quantity: 35
  },
  {
    name: 'Mint Chocolates',
    price: 1.75,
    image: '/images/MintChocolates.jpg',
    description: 'Refreshing mint-filled chocolate squares.',
    category: 'candies',
    quantity: 0 // Out of stock example
  },
];

// Snack products (new)
const snackProducts: CategoryProduct[] = [
  {
    name: 'Potato Chips',
    price: 1.50,
    image: '/images/PotatoChips.jpg',
    badge: 'Popular',
    description: 'Crispy, salted potato chips made from premium potatoes.',
    category: 'snacks',
    quantity: 55
  },
  {
    name: 'Pretzels',
    price: 1.25,
    image: '/images/Pretzels.jpg',
    description: 'Crunchy, salted pretzels perfect for snacking.',
    category: 'snacks',
    quantity: 65
  },
  {
    name: 'Trail Mix',
    price: 2.00,
    image: '/images/TrailMix.jpg',
    badge: 'Healthy',
    description: 'A nutritious blend of nuts, dried fruits, and chocolate pieces.',
    category: 'snacks',
    quantity: 40
  },
  {
    name: 'Cheese Crackers',
    price: 1.75,
    image: '/images/CheeseCrackers.jpg',
    description: 'Savory cheese-flavored crackers that are irresistibly tasty.',
    category: 'snacks',
    quantity: 50
  },
  {
    name: 'Popcorn',
    price: 1.50,
    image: '/images/Popcorn.jpg',
    description: 'Light and fluffy popcorn with just the right amount of salt.',
    category: 'snacks',
    quantity: 0 // Out of stock example
  },
  {
    name: 'Beef Jerky',
    price: 3.50,
    image: '/images/BeefJerky.jpg',
    badge: 'Premium',
    description: 'Savory, protein-packed beef jerky with a smoky flavor.',
    category: 'snacks',
    quantity: 25
  },
];

// Combine all products
export const allProducts: CategoryProduct[] = [
  ...origamiProducts,
  ...candyProducts,
  ...snackProducts
];

// Get products by category
export const getProductsByCategory = (category: 'origami' | 'candies' | 'snacks'): CategoryProduct[] => {
  return allProducts.filter(product => product.category === category);
};
