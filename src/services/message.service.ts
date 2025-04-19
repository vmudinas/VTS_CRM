/**
 * Message Service
 * Handles contact message-related API operations
 */

import apiService from './api.service';

// Message interface
export interface Message {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Message Service class for handling contact message-related API operations
 */
class MessageService {
  /**
   * Get all messages
   * @returns Promise with array of messages
   */
  async getAllMessages(): Promise<Message[]> {
    return apiService.get<Message[]>('/messages');
  }

  /**
   * Get a message by ID
   * @param id Message ID
   * @returns Promise with the message
   */
  async getMessageById(id: number): Promise<Message> {
    return apiService.get<Message>(`/messages/${id}`);
  }

  /**
   * Create a new message
   * @param messageData Message data
   * @returns Promise with the created message
   */
  async createMessage(messageData: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<{ id: number; message: string }> {
    return apiService.post<{ id: number; message: string }>('/messages', messageData);
  }

  /**
   * Mark a message as read
   * @param id Message ID
   * @returns Promise with the updated message
   */
  async markAsRead(id: number): Promise<Message> {
    return apiService.get<Message>(`/messages/${id}`);
  }

  /**
   * Delete a message
   * @param id Message ID
   * @returns Promise with the deletion result
   */
  async deleteMessage(id: number): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/messages/${id}`);
  }
}

// Create and export a singleton instance
const messageService = new MessageService();
export default messageService;
