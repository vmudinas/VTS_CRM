/**
 * Product Service
 * Handles product-related API operations
 */

import apiService from './api.service';
import { Product } from '../App';

/**
 * Product Service class for handling product-related API operations
 */
class ProductService {
  /**
   * Get all products
   * @returns Promise with array of products
   */
  async getAllProducts(): Promise<Product[]> {
    return apiService.get<Product[]>('/products');
  }

  /**
   * Get a product by ID
   * @param id Product ID
   * @returns Promise with the product
   */
  async getProductById(id: number): Promise<Product> {
    return apiService.get<Product>(`/products/${id}`);
  }

  /**
   * Create a new product
   * @param productData Product data with file
   * @returns Promise with the created product
   */
  async createProduct(productData: FormData): Promise<Product> {
    return apiService.uploadFile<Product>('/products', productData);
  }

  /**
   * Update an existing product
   * @param id Product ID
   * @param productData Updated product data with file
   * @returns Promise with the updated product
   */
  async updateProduct(id: number, productData: FormData): Promise<Product> {
    return apiService.updateWithFile<Product>(`/products/${id}`, productData);
  }

  /**
   * Update product quantity
   * @param id Product ID
   * @param quantity New quantity
   * @returns Promise with the updated product
   */
  async updateProductQuantity(id: number, quantity: number): Promise<Product> {
    // Create a FormData object with just the quantity
    const formData = new FormData();
    formData.append('quantity', quantity.toString());
    
    // Get the current product to include required fields
    const currentProduct = await this.getProductById(id);
    formData.append('name', currentProduct.name);
    formData.append('price', currentProduct.price.toString());
    formData.append('category', currentProduct.category || 'origami'); // Default to origami if category is undefined
    formData.append('image', currentProduct.image);
    
    if (currentProduct.badge && typeof currentProduct.badge === 'string') {
      formData.append('badge', currentProduct.badge);
    }
    
    if (currentProduct.description && typeof currentProduct.description === 'string') {
      formData.append('description', currentProduct.description);
    }
    
    return this.updateProduct(id, formData);
  }

  /**
   * Delete a product
   * @param id Product ID
   * @returns Promise with the deletion result
   */
  async deleteProduct(id: number): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/products/${id}`);
  }

  /**
   * Upload a product image
   * @param id Product ID
   * @param imageFile Image file
   * @returns Promise with the updated product
   */
  async uploadProductImage(id: number, imageFile: File): Promise<Product> {
    // Get the current product to include required fields
    const currentProduct = await this.getProductById(id);
    
    // Create a FormData object with the image and required fields
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', currentProduct.name);
    formData.append('price', currentProduct.price.toString());
    formData.append('category', currentProduct.category || 'origami'); // Default to origami if category is undefined
    formData.append('quantity', currentProduct.quantity.toString());
    
    if (currentProduct.badge && typeof currentProduct.badge === 'string') {
      formData.append('badge', currentProduct.badge);
    }
    
    if (currentProduct.description && typeof currentProduct.description === 'string') {
      formData.append('description', currentProduct.description);
    }
    
    return this.updateProduct(id, formData);
  }
}

// Create and export a singleton instance
const productService = new ProductService();
export default productService;
