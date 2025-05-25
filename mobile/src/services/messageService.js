import api from '../shared/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../shared/constants';

/**
 * Özel konuşmaları getir
 * @returns {Promise<Object>}
 */
export const getPrivateConversations = async () => {
  try {
    console.log('[messageService] Fetching private conversations');
    
    // Token kontrolü
    const token = await AsyncStorage.getItem('token');
    if (!token || token.trim().length === 0) {
      return {
        success: false,
        message: 'Token bulunamadı'
      };
    }
    
    const response = await api.messages.getConversations();
    
    if (response.data && response.data.success) {
      console.log('[messageService] Private conversations loaded:', response.data.data?.length || 0);
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      console.warn('[messageService] Invalid response for private conversations:', response.data);
      return {
        success: false,
        message: 'Geçersiz API yanıtı',
        data: []
      };
    }
  } catch (error) {
    console.error('[messageService] Error fetching private conversations:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Konuşmalar yüklenirken hata oluştu',
      data: []
    };
  }
};

/**
 * Etkinlik konuşmalarını getir
 * @returns {Promise<Object>}
 */
export const getEventConversations = async () => {
  try {
    console.log('[messageService] Fetching event conversations');
    
    // Token kontrolü
    const token = await AsyncStorage.getItem('token');
    if (!token || token.trim().length === 0) {
      return {
        success: false,
        message: 'Token bulunamadı'
      };
    }
    
    const response = await api.messages.getEventConversations();
    
    if (response.data && response.data.success) {
      console.log('[messageService] Event conversations loaded:', response.data.data?.length || 0);
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      console.warn('[messageService] Invalid response for event conversations:', response.data);
      return {
        success: false,
        message: 'Geçersiz API yanıtı',
        data: []
      };
    }
  } catch (error) {
    console.error('[messageService] Error fetching event conversations:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinlik konuşmaları yüklenirken hata oluştu',
      data: []
    };
  }
};

/**
 * Özel mesajları getir
 * @param {string} userId - Diğer kullanıcının ID'si
 * @returns {Promise<Object>}
 */
export const getPrivateMessages = async (userId) => {
  try {
    console.log('[messageService] Fetching private messages for user:', userId);
    
    // Token kontrolü
    const token = await AsyncStorage.getItem('token');
    if (!token || token.trim().length === 0) {
      return {
        success: false,
        message: 'Token bulunamadı'
      };
    }
    
    const response = await api.messages.getPrivateMessages(userId);
    
    if (response.data && response.data.success) {
      console.log('[messageService] Private messages loaded:', response.data.data?.length || 0);
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      console.warn('[messageService] Invalid response for private messages:', response.data);
      return {
        success: false,
        message: 'Geçersiz API yanıtı',
        data: []
      };
    }
  } catch (error) {
    console.error('[messageService] Error fetching private messages:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Mesajlar yüklenirken hata oluştu',
      data: []
    };
  }
};

/**
 * Etkinlik mesajlarını getir
 * @param {string} eventId - Etkinlik ID'si
 * @returns {Promise<Object>}
 */
export const getEventMessages = async (eventId) => {
  try {
    console.log('[messageService] Fetching event messages for event:', eventId);
    
    // Token kontrolü
    const token = await AsyncStorage.getItem('token');
    if (!token || token.trim().length === 0) {
      return {
        success: false,
        message: 'Token bulunamadı'
      };
    }
    
    const response = await api.messages.getEventMessages(eventId);
    
    if (response.data && response.data.success) {
      console.log('[messageService] Event messages loaded:', response.data.data?.length || 0);
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      console.warn('[messageService] Invalid response for event messages:', response.data);
      return {
        success: false,
        message: 'Geçersiz API yanıtı',
        data: []
      };
    }
  } catch (error) {
    console.error('[messageService] Error fetching event messages:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinlik mesajları yüklenirken hata oluştu',
      data: []
    };
  }
};

/**
 * Özel mesaj gönder
 * @param {string} recipientId - Alıcının ID'si
 * @param {string} content - Mesaj içeriği
 * @returns {Promise<Object>}
 */
export const sendPrivateMessage = async (recipientId, content) => {
  try {
    console.log('[messageService] Sending private message to:', recipientId);
    
    const response = await api.messages.sendPrivateMessage(recipientId, content);
    
    if (response.data && response.data.success) {
      console.log('[messageService] Private message sent successfully');
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: 'Mesaj gönderilemedi'
      };
    }
  } catch (error) {
    console.error('[messageService] Error sending private message:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Mesaj gönderirken hata oluştu'
    };
  }
};

/**
 * Etkinlik mesajı gönder
 * @param {string} eventId - Etkinlik ID'si
 * @param {string} content - Mesaj içeriği
 * @returns {Promise<Object>}
 */
export const sendEventMessage = async (eventId, content) => {
  try {
    console.log('[messageService] Sending event message to:', eventId);
    
    const response = await api.messages.sendEventMessage(eventId, content);
    
    if (response.data && response.data.success) {
      console.log('[messageService] Event message sent successfully');
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: 'Etkinlik mesajı gönderilemedi'
      };
    }
  } catch (error) {
    console.error('[messageService] Error sending event message:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Etkinlik mesajı gönderirken hata oluştu'
    };
  }
};

/**
 * Kullanıcının katıldığı etkinlikleri getir
 * @returns {Promise<Object>}
 */
export const getParticipatedEvents = async () => {
  try {
    console.log('[messageService] Fetching participated events');
    
    // Token kontrolü
    const token = await AsyncStorage.getItem('token');
    if (!token || token.trim().length === 0) {
      return {
        success: false,
        message: 'Token bulunamadı'
      };
    }
    
    const response = await api.events.getParticipatedEvents();
    
    if (response.data && response.data.success) {
      console.log('[messageService] Participated events loaded:', response.data.data?.length || 0);
      return {
        success: true,
        data: response.data.data || []
      };
    } else if (response.data && Array.isArray(response.data)) {
      console.log('[messageService] Participated events loaded (alternative format):', response.data?.length || 0);
      return {
        success: true,
        data: response.data || []
      };
    } else {
      console.warn('[messageService] Invalid response for participated events:', response.data);
      return {
        success: false,
        message: 'Geçersiz API yanıtı',
        data: []
      };
    }
  } catch (error) {
    console.error('[messageService] Error fetching participated events:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Katılınan etkinlikler yüklenirken hata oluştu',
      data: []
    };
  }
}; 