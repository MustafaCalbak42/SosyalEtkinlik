import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  Button
} from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, COLORS } from '../shared/constants';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moderationService from '../services/moderationService';
import ShakeAnimation from '../components/ShakeAnimation';
import * as messageService from '../services/messageService';

// Socket.io için doğru URL'i oluştur (API_URL'den /api kısmını çıkar)
const SOCKET_URL = API_URL.replace('/api', '');

// Tema renkleri
const THEME = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  background: '#F5F5F5',
  messageOutgoing: '#E3F2FD',
  messageIncoming: '#FFFFFF',
  messageBackground: '#ECEFF1',
  lightPrimary: '#C5CAE9',
  darkPrimary: '#303F9F',
  darkGray: '#9E9E9E',
  mediumGray: '#607D8B',
  text: '#212121',
  lightText: '#757575',
};

const MessagesScreen = () => {
  const { userProfile, isLoggedIn } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savedRefreshing, setSavedRefreshing] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  
  // Tab yönetimi için state
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'private', title: 'Özel Mesajlar' },
    { key: 'event', title: 'Etkinlik Mesajları' },
  ]);
  
  // Mesajlaşma için state
  const [privateConversations, setPrivateConversations] = useState([]);
  const [savedConversations, setSavedConversations] = useState([]);
  const [eventConversations, setEventConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [shakeAnimation, setShakeAnimation] = useState(false);
  const [moderationError, setModerationError] = useState('');
  
  // Kullanıcı keşfi için state'ler
  const [userDiscoveryVisible, setUserDiscoveryVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  
  // Token'ı yükle
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken && storedToken.trim().length > 0) {
          setToken(storedToken.trim());
          console.log('[MessagesScreen] Token loaded for messaging');
        } else {
          console.warn('[MessagesScreen] No valid token found for messaging');
        }
      } catch (error) {
        console.error('[MessagesScreen] Error loading token:', error);
      }
    };
    
    if (isLoggedIn) {
      loadToken();
    }
  }, [isLoggedIn]);
  
  // Socket.io bağlantısı
  useEffect(() => {
    if (!token || !isLoggedIn) {
      console.log('[MessagesScreen] No token or not logged in, skipping socket connection');
      return;
    }
    
    console.log('[MessagesScreen] Establishing socket connection to:', SOCKET_URL);
    
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      timeout: 20000,
      forceNew: true
    });
    
    newSocket.on('connect', () => {
      console.log('[MessagesScreen] Socket.io bağlantısı kuruldu');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('[MessagesScreen] Socket bağlantı hatası:', error);
    });
    
    newSocket.on('error', (error) => {
      console.error('[MessagesScreen] Socket hatası:', error);
      
      // Moderasyon hatası kontrolü
      if (error && (error.message?.includes('uygunsuz') || error.message?.includes('dikkat'))) {
        // Uyarı mesajını göster
        setModerationError(error.message);
        moderationService.showModerationWarning({ message: error.message });
        setShakeAnimation(true);
        
        // Input alanına odaklan
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 800); // Animasyon bittikten sonra
        
        // Eğer geçici ID varsa, ilgili geçici mesajı kaldır
        if (error.tempId) {
          setMessages(prevMessages => 
            prevMessages.filter(msg => msg._id !== error.tempId)
          );
        } else {
          // En son eklenen geçici mesajı kaldır
          setMessages(prevMessages => {
            if (prevMessages.length > 0 && 
                prevMessages[prevMessages.length - 1].status === 'sending') {
              return prevMessages.slice(0, -1);
            }
            return prevMessages;
          });
        }
      }
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('[MessagesScreen] Socket bağlantısı kesildi:', reason);
    });
    
    // Özel mesajları dinle
    newSocket.on('private_message', (message) => {
      console.log('[MessagesScreen] Private message received:', message);
      // Eğer açık olan konuşmaya aitse, mesajı ekle
      if (activeConversation && activeConversation.type === 'private' &&
          (message.sender._id === activeConversation.id || 
           message.recipient._id === activeConversation.id)) {
        // Kendimin gönderdiği mesajsa, geçici mesajı gerçek mesajla değiştir
        if (message.sender._id === userProfile?.id) {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg._id.startsWith('temp-') && msg.content === message.content ? 
                { ...message, status: 'delivered' } : msg
            ).filter((msg, index, self) => 
              // Aynı içerikli geçici mesajlar varsa sadece bir tanesini göster
              index === self.findIndex(m => m._id === msg._id || 
                (msg._id.startsWith('temp-') && m.content === msg.content))
            )
          );
        } else {
          // Karşı tarafın mesajıysa, yeni mesaj ekle
          setMessages(prevMessages => [...prevMessages, message]);
          
          // Kişinin yazıyor durumunu kaldır
          setTypingUsers(prev => ({
            ...prev,
            [message.sender._id]: null
          }));
        }
        
        // Mesaj listesini aşağı kaydır
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
      
      // Konuşma listesini güncelle
      fetchPrivateConversations();
    });
    
    // Etkinlik mesajlarını dinle
    newSocket.on('event_message', (message) => {
      console.log('[MessagesScreen] Event message received:', message);
      // Eğer açık olan etkinlik konuşmasına aitse, mesajı ekle
      if (activeConversation && activeConversation.type === 'event' && 
          message.event._id === activeConversation.id) {
        // Geçici mesajı gerçek mesajla değiştir
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id.startsWith('temp-') && msg.content === message.content ? 
              { ...message, status: 'delivered' } : msg
          ).filter((msg, index, self) => 
            // Aynı içerikli geçici mesajlar varsa sadece bir tanesini göster
            index === self.findIndex(m => m._id === msg._id || 
              (msg._id.startsWith('temp-') && m.content === msg.content))
          )
        );
        
        // Mesaj listesini aşağı kaydır
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
      
      // Etkinlik konuşmalarını güncelle
      fetchEventConversations();
    });
    
    // Yazıyor bildirimlerini dinle (özel mesaj)
    newSocket.on('typing_private', (data) => {
      console.log('[MessagesScreen] Typing notification private:', data);
      if (activeConversation && activeConversation.type === 'private' && 
          data.senderId === activeConversation.id) {
        // Yazıyor durumunu güncelle
        setTypingUsers(prev => ({
          ...prev,
          [data.senderId]: data.isTyping ? {
            username: data.username,
            timestamp: Date.now()
          } : null
        }));
      }
    });
    
    // Yazıyor bildirimlerini dinle (etkinlik)
    newSocket.on('typing_event', (data) => {
      console.log('[MessagesScreen] Typing notification event:', data);
      if (activeConversation && activeConversation.type === 'event' && 
          data.senderId !== userProfile?.id) {
        // Yazıyor durumunu güncelle
        setTypingUsers(prev => ({
          ...prev,
          [data.senderId]: data.isTyping ? {
            username: data.username,
            timestamp: Date.now()
          } : null
        }));
      }
    });
    
    setSocket(newSocket);
    
    // Temizlik
    return () => {
      console.log('[MessagesScreen] Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [token, activeConversation, isLoggedIn]);
  
  // Özel konuşmaları getir
  const fetchPrivateConversations = async () => {
    try {
      setLoading(true);
      
      console.log('[MessagesScreen] Fetching private conversations');
      
      // Aktif konuşmaları getir
      const activeResult = await messageService.getPrivateConversations();
      let activeConversations = [];
      
      if (activeResult.success) {
        console.log('[MessagesScreen] Loaded active conversations:', activeResult.data?.length || 0);
        activeConversations = activeResult.data || [];
      } else {
        console.warn('[MessagesScreen] Failed to load active conversations:', activeResult.message);
      }
      
      // Kaydedilmiş konuşmaları getir
      const savedResult = await messageService.getSavedConversations();
      let savedConversationsData = [];
      
      if (savedResult.success) {
        console.log('[MessagesScreen] Loaded saved conversations:', savedResult.data?.length || 0);
        
        // Kaydedilmiş konuşmaları dönüştür
        savedConversationsData = (savedResult.data || [])
          .filter(saved => saved && saved.targetUser) // Geçerli kullanıcılar
          .map(saved => ({
            userId: saved.targetUser._id,
            fullName: saved.targetUser.fullName || saved.targetUser.username || 'İsimsiz Kullanıcı',
            username: saved.targetUser.username || 'kullanici',
            profilePicture: saved.targetUser.profilePicture || null,
            lastMessage: saved.lastMessage || '',
            lastMessageDate: saved.lastMessageDate || new Date(),
            unreadCount: 0,
            user: saved.targetUser,
            savedConversationId: saved._id, // Kaydedilmiş konuşma ID'si
            isSaved: true
          }));
        
        // Kaydedilmiş konuşmaları state'e kaydet
        setSavedConversations(savedConversationsData);
      } else {
        console.warn('[MessagesScreen] Failed to load saved conversations:', savedResult.message);
      }
      
      // Aktif konuşmaların ID'lerini al
      const existingUserIds = activeConversations
        .filter(conv => conv && conv.userId)
        .map(conv => conv.userId);
      
      // Kaydedilmiş konuşmalardan henüz konuşma listesinde olmayanları filtrele
      const uniqueSavedConversations = savedConversationsData
        .filter(conv => conv && conv.userId && !existingUserIds.includes(conv.userId));
      
      // Tüm konuşmaları birleştir
      const allConversations = [...activeConversations, ...uniqueSavedConversations];
      
      // Son mesaj tarihine göre sırala (en yeniler üstte)
      try {
        allConversations.sort((a, b) => {
          const dateA = a && a.lastMessageDate ? new Date(a.lastMessageDate) : new Date(0);
          const dateB = b && b.lastMessageDate ? new Date(b.lastMessageDate) : new Date(0);
          return dateB - dateA;
        });
      } catch (sortError) {
        console.error('[MessagesScreen] Error sorting conversations:', sortError);
      }
      
      console.log('[MessagesScreen] Total conversations after merge:', allConversations.length);
      setPrivateConversations(allConversations);
    } catch (error) {
      console.error('[MessagesScreen] Error in fetchPrivateConversations:', error);
      Alert.alert(
        'Hata',
        'Konuşmalar yüklenirken beklenmeyen bir hata oluştu'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Etkinlik konuşmalarını yükle - Kullanıcının katıldığı etkinliklerden
  const fetchEventConversations = async () => {
    if (!token) {
      console.warn('[MessagesScreen] No token available for fetching event conversations');
      return;
    }
    
    try {
      console.log('[MessagesScreen] Fetching participated events for conversations');
      const messageService = await import('../services/messageService');
      
      // Önce kullanıcının katıldığı etkinlikleri al
      const participatedResult = await messageService.getParticipatedEvents();
      
      if (participatedResult.success && participatedResult.data.length > 0) {
        console.log('[MessagesScreen] Participated events loaded:', participatedResult.data.length);
        
        // Katılınan etkinlikleri konuşma formatına dönüştür
        const conversations = participatedResult.data.map(event => ({
          eventId: event._id,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          location: event.location,
          imageUrl: event.imageUrl,
          participantCount: event.participants?.length || 0,
          unreadCount: 0, // Varsayılan olarak okunmamış mesaj yok
        }));
        
        setEventConversations(conversations);
        console.log('[MessagesScreen] Event conversations created from participated events:', conversations.length);
      } else {
        console.log('[MessagesScreen] No participated events found or error:', participatedResult.message);
        
        // Katılınan etkinlik yoksa, normal etkinlik konuşmalarını yüklemeyi dene
        const result = await messageService.getEventConversations();
        
        if (result.success) {
          setEventConversations(result.data || []);
          console.log('[MessagesScreen] Regular event conversations loaded as fallback:', result.data?.length || 0);
        } else {
          console.warn('[MessagesScreen] Failed to load any event conversations');
          setEventConversations([]);
        }
      }
    } catch (error) {
      console.error('[MessagesScreen] Etkinlik konuşmaları yüklenirken hata:', error);
      setEventConversations([]);
    }
  };
  
  // Sayfa yüklendiğinde konuşmaları getir
  useEffect(() => {
    if (!token || !isLoggedIn) {
      console.log('[MessagesScreen] No token or not logged in, skipping conversations fetch');
      setLoading(false);
      return;
    }
    
    const loadConversations = async () => {
      try {
        console.log('[MessagesScreen] Loading conversations...');
        setLoading(true);
        
        // Önce özel konuşmaları yükle
        await fetchPrivateConversations();
        
        // Sonra etkinlik konuşmalarını yükle
        await fetchEventConversations();
        
        console.log('[MessagesScreen] Conversations loading completed');
      } catch (error) {
        console.error('[MessagesScreen] Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
    
    // Route'dan gelen paramları kontrol et
    if (route.params?.type && route.params?.id) {
      if (route.params.type === 'private') {
        openPrivateConversation(route.params.id, route.params.name);
      } else if (route.params.type === 'event') {
        openEventConversation(route.params.id, route.params.title);
      }
    }
  }, [token, route.params, isLoggedIn]);
  
  // Özel konuşma aç
  const openPrivateConversation = async (userId, name) => {
    if (!token) {
      console.warn('[MessagesScreen] No token available for opening private conversation');
      Alert.alert('Hata', 'Oturum bilgisi bulunamadı, lütfen tekrar giriş yapın.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('[MessagesScreen] Opening private conversation with user:', userId);
      
      // İlk olarak PrivateMessages ile deniyoruz
      let result;
      try {
        result = await messageService.getPrivateMessages(userId);
      } catch (primaryError) {
        console.warn('[MessagesScreen] Error with getPrivateMessages, trying getMessages:', primaryError.message);
        
        // İlk metod başarısız olursa, getMessages ile deniyoruz
        try {
          result = await messageService.getMessages(userId);
        } catch (secondaryError) {
          console.error('[MessagesScreen] Both message fetching methods failed:', secondaryError.message);
          
          // İki yöntem de başarısız olursa, boş bir liste kullanacağız
          result = {
            success: true,
            data: []
          };
        }
      }
      
      // Konuşmayı aç
      if (result.success) {
        setMessages(result.data || []);
        setActiveConversation({
          type: 'private',
          id: userId,
          name: name || 'Kullanıcı'
        });
        console.log('[MessagesScreen] Private conversation opened, message count:', result.data?.length || 0);
      } else {
        console.warn('[MessagesScreen] Failed to load private messages:', result.message);
        // Hata durumunda bile konuşmayı açıyoruz, sadece boş liste gösteriyoruz
        setMessages([]);
        setActiveConversation({
          type: 'private',
          id: userId,
          name: name || 'Kullanıcı'
        });
      }
      
      // Mesaj listesini aşağı kaydır
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    } catch (error) {
      console.error('[MessagesScreen] Mesajlar yüklenirken hata:', error);
      // Hata durumunda bile konuşmayı açıyoruz
      setMessages([]);
      setActiveConversation({
        type: 'private',
        id: userId,
        name: name || 'Kullanıcı'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Etkinlik konuşması aç
  const openEventConversation = async (eventId, title) => {
    if (!token) {
      console.warn('[MessagesScreen] No token available for opening event conversation');
      return;
    }
    
    try {
      setLoading(true);
      console.log('[MessagesScreen] Opening event conversation for event:', eventId);
      const messageService = await import('../services/messageService');
      const result = await messageService.getEventMessages(eventId);
      
      if (result.success) {
        setMessages(result.data || []);
        setActiveConversation({
          type: 'event',
          id: eventId,
          name: title || 'Etkinlik'
        });
        console.log('[MessagesScreen] Event conversation opened, message count:', result.data?.length || 0);
      } else {
        console.warn('[MessagesScreen] Failed to load event messages:', result.message);
        setMessages([]);
      }
      
      // Etkinlik odasına katıl
      if (socket && socket.connected) {
        console.log('[MessagesScreen] Joining event room:', eventId);
        socket.emit('join_event', eventId);
      }
      
      // Mesaj listesini aşağı kaydır
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    } catch (error) {
      console.error('[MessagesScreen] Etkinlik mesajları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Mesaj gönder
  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversation || !socket) {
      console.warn('[MessagesScreen] Cannot send message: missing data or socket not connected');
      return;
    }
    
    try {
      // Mesaj içeriği
      const content = newMessage.trim();
      
      // Moderasyon ön kontrolü (yerel kontrol)
      const contentCheck = moderationService.checkContentBeforeSend(content);
      if (!contentCheck.isValid) {
        console.log('[MessagesScreen] Local moderation check failed:', contentCheck.message);
        setModerationError(contentCheck.message);
        setShakeAnimation(true);
        setNewMessage('');
        return;
      }
      
      // Benzersiz geçici ID oluştur
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Gönderilen mesajı önce UI'a ekle (optimistik güncelleme)
      const tempMessage = {
        _id: tempId,
        content,
        sender: {
          _id: userProfile?.id || 'self',
          fullName: userProfile?.fullName || 'Ben',
          username: userProfile?.username,
          profilePicture: userProfile?.profilePicture
        },
        createdAt: new Date().toISOString(),
        status: 'sending',
        isMine: true
      };
      
      // Konuşma tipine göre ek alanları ekle
      if (activeConversation.type === 'private') {
        tempMessage.recipient = { _id: activeConversation.id };
      } else {
        tempMessage.event = { _id: activeConversation.id };
      }
      
      // Mesajı UI'a ekle
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Mesaj listesini aşağı kaydır
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
      
      // Yazıyor... bildirimi göndermeyi durdur
      sendTypingStatus(false);
      
      if (activeConversation.type === 'private') {
        // Özel mesaj gönder
        console.log('[MessagesScreen] Sending private message to:', activeConversation.id);
        socket.emit('private_message', {
          recipientId: activeConversation.id,
          content,
          tempId // Geçici ID'yi gönder
        });
      } else if (activeConversation.type === 'event') {
        // Etkinlik mesajı gönder
        console.log('[MessagesScreen] Sending event message to:', activeConversation.id);
        socket.emit('event_message', {
          eventId: activeConversation.id,
          content,
          tempId // Geçici ID'yi gönder
        });
      }
      
      // Input alanını temizle
      setNewMessage('');
      
      // Hata mesajını temizle
      setModerationError('');
    } catch (error) {
      console.error('[MessagesScreen] Mesaj gönderme hatası:', error);
      
      // Moderasyon hatası kontrolü
      if (error.message && (error.message.includes('uygunsuz') || error.message.includes('dikkat'))) {
        setModerationError(error.message);
        setShakeAnimation(true);
        
        // En son eklenen mesajı kaldır (optimistik UI güncellemesini geri al)
        setMessages(prevMessages => {
          if (prevMessages.length > 0) {
            return prevMessages.slice(0, -1);
          }
          return prevMessages;
        });
      }
    }
  };
  
  // Konuşma sayfasını kapat
  const closeConversation = () => {
    // Eğer etkinlik konuşmasıysa, odadan ayrıl
    if (activeConversation && activeConversation.type === 'event' && socket && socket.connected) {
      console.log('[MessagesScreen] Leaving event room:', activeConversation.id);
      socket.emit('leave_event', activeConversation.id);
    }
    
    setActiveConversation(null);
    setMessages([]);
  };
  
  // Yazıyor... bildirimi gönder
  const sendTypingStatus = (isTyping) => {
    if (!socket || !activeConversation) return;
    
    // Mevcut yazıyor bildirimi ile aynıysa ve true ise tekrar gönderme
    if (isTyping === isTyping) return;
    
    setIsTyping(isTyping);
    
    try {
      if (activeConversation.type === 'private') {
        socket.emit('typing_private', {
          recipientId: activeConversation.id,
          isTyping
        });
      } else if (activeConversation.type === 'event') {
        socket.emit('typing_event', {
          eventId: activeConversation.id,
          isTyping
        });
      }
    } catch (error) {
      console.error('[MessagesScreen] Error sending typing status:', error);
    }
  };
  
  // Input değiştiğinde yazıyor... bildirimi gönder ve küfür kontrolü yap
  const handleInputChange = (text) => {
    setNewMessage(text);
    
    // Yazıyor bildirimi gönderme
    if (text.length > 0 && !isTyping) {
      sendTypingStatus(true);
    } else if (text.length === 0 && isTyping) {
      sendTypingStatus(false);
    }
    
    // Yazıyor bildirimi için zamanlayıcı
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 3 saniye sonra yazıyor durumunu kapat
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        sendTypingStatus(false);
      }
    }, 3000);
    
    // Anlık küfür kontrolü
    if (text && text.trim() !== '') {
      // Performans için az sıklıkta kontrol et (her tuş vuruşunda değil)
      clearTimeout(window.profanityCheckTimeout);
      window.profanityCheckTimeout = setTimeout(() => {
        const profanityCheck = moderationService.checkContentBeforeSend(text);
        
        if (!profanityCheck.isValid) {
          // Küfür tespit edildi, mesajı temizle
          setNewMessage('');
          // Kullanıcıya uyarı göster
          moderationService.showModerationWarning({ 
            message: profanityCheck.message 
          });
          
          // Yazıyor bildirimini kapat
          sendTypingStatus(false);
          
          // Input referansı için sarsma state'ini aktif et
          setShakeAnimation(true);
        }
      }, 300);
    }
  };
  
  // Zaman formatla
  const formatTime = (dateString) => {
    try {
      if (!dateString) return '';
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: tr });
    } catch (error) {
      console.error('[MessagesScreen] Tarih formatlanırken hata:', error);
      return '';
    }
  };
  
  // Kullanıcıları getir
  const fetchUsers = async (page = 1) => {
    try {
      setLoadingUsers(true);
      
      console.log('[MessagesScreen] Kullanıcılar getiriliyor, sayfa:', page);
      const userService = await import('../services/userService');
      const result = await userService.getAllUsers(page, 10);
      
      if (result.success) {
        if (page === 1) {
          // Kullanıcı listesini sıfırla
          setUsers(result.data);
        } else {
          // Mevcut listeye ekle
          setUsers(prevUsers => [...prevUsers, ...result.data]);
        }
        
        // Daha fazla kullanıcı var mı kontrol et
        if (result.pagination && page >= result.pagination.totalPages) {
          setHasMoreUsers(false);
        } else {
          setHasMoreUsers(true);
        }
        
        console.log('[MessagesScreen] Kullanıcılar yüklendi:', result.data.length);
      } else {
        console.warn('[MessagesScreen] Kullanıcılar yüklenemedi:', result.message);
      }
    } catch (error) {
      console.error('[MessagesScreen] Kullanıcıları getirme hatası:', error);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Kullanıcı keşfetme modalını aç
  const openUserDiscovery = () => {
    setUserDiscoveryVisible(true);
    // Kullanıcıları yükle
    setUserPage(1);
    fetchUsers(1);
  };
  
  // Daha fazla kullanıcı yükle
  const loadMoreUsers = () => {
    if (loadingUsers || !hasMoreUsers) return;
    
    const nextPage = userPage + 1;
    setUserPage(nextPage);
    fetchUsers(nextPage);
  };
  
  // Kullanıcı seç ve mesajlaşma başlat
  const handleSelectUser = async (selectedUser) => {
    // Modalı kapat
    setUserDiscoveryVisible(false);
    
    if (!selectedUser || !selectedUser._id) {
      Alert.alert('Hata', 'Geçersiz kullanıcı seçildi');
      return;
    }
    
    console.log('[MessagesScreen] Kullanıcı seçildi:', selectedUser.username);
    
    try {
      // Önce yükleme durumunu başlat
      setLoading(true);
      
      // Önce seçilen kullanıcı zaten konuşmalar listesinde var mı kontrol et
      const existingConversation = privateConversations.find(conv => 
        conv.userId === selectedUser._id || conv.user?._id === selectedUser._id
      );
      
      if (existingConversation) {
        console.log('[MessagesScreen] Kullanıcı zaten konuşma listesinde var:', existingConversation.username);
        // Direkt olarak mevcut konuşmayı aç
        openPrivateConversation(selectedUser._id, selectedUser.fullName || selectedUser.username);
        return;
      }
      
      // Kullanıcı konuşma listesinde yoksa, veritabanına kaydet
      console.log(`[MessagesScreen] ${selectedUser._id} ID'li kullanıcı konuşma listesine kaydediliyor...`);
      
      // Kaydetme işlemini gerçekleştir
      const saveResult = await messageService.saveConversation({ 
        targetUserId: selectedUser._id,
        note: ''
      });
      
      if (saveResult.success) {
        console.log('[MessagesScreen] Kullanıcı başarıyla kaydedildi');
        
        // Konuşma listesini yenile
        await fetchPrivateConversations();
        
        // Sonra kullanıcının mesajlarını yükle
        openPrivateConversation(selectedUser._id, selectedUser.fullName || selectedUser.username);
      } else {
        console.warn('[MessagesScreen] Kullanıcı kaydedilemedi:', saveResult.message);
        
        // Kaydetme başarısız olsa bile konuşmayı açmayı dene
        console.log('[MessagesScreen] Kaydetme başarısız oldu, konuşmayı açmayı deniyorum...');
        openPrivateConversation(selectedUser._id, selectedUser.fullName || selectedUser.username);
        
        // Kullanıcıya bilgi ver
        Alert.alert('Bilgi', 'Kullanıcı konuşma listesine eklenemedi, ancak mesajlaşabilirsiniz.');
      }
    } catch (error) {
      console.error('[MessagesScreen] Kullanıcı seçme hatası:', error);
      
      // Hata olsa bile konuşmayı açmayı dene
      try {
        console.log('[MessagesScreen] Hata oluştu, konuşmayı açmayı deniyorum...');
        openPrivateConversation(selectedUser._id, selectedUser.fullName || selectedUser.username);
        Alert.alert('Bilgi', 'Konuşma listesine ekleme başarısız oldu, ancak mesajlaşabilirsiniz.');
      } catch (openError) {
        console.error('[MessagesScreen] Konuşma açma hatası:', openError);
        Alert.alert('Hata', 'Mesajlaşma başlatılamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Kaydedilmiş konuşmaları getir
  const fetchSavedConversations = async () => {
    try {
      setSavedLoading(true);
      
      console.log('[MessagesScreen] Fetching saved conversations');
      const result = await messageService.getSavedConversations();
      
      if (result.success) {
        console.log('[MessagesScreen] Loaded saved conversations:', result.data?.length || 0);
        
        // Kaydedilmiş konuşmaları dönüştür
        const savedConversationsData = (result.data || [])
          .filter(saved => saved && saved.targetUser) // Geçerli kullanıcılar
          .map(saved => ({
            userId: saved.targetUser._id,
            fullName: saved.targetUser.fullName || saved.targetUser.username || 'İsimsiz Kullanıcı',
            username: saved.targetUser.username || 'kullanici',
            profilePicture: saved.targetUser.profilePicture || null,
            lastMessage: saved.lastMessage || '',
            lastMessageDate: saved.lastMessageDate || new Date(),
            unreadCount: 0,
            user: saved.targetUser,
            savedConversationId: saved._id, // Kaydedilmiş konuşma ID'si
            isSaved: true
          }));
        
        setSavedConversations(savedConversationsData);
      } else {
        console.warn('[MessagesScreen] Failed to load saved conversations:', result.message);
        // Hata durumunda kullanıcıya bilgi ver
        Alert.alert(
          'Bilgi',
          result.message || 'Kaydedilmiş konuşmalar yüklenemedi'
        );
        // Mevcut kaydedilmiş konuşmaları koruyalım
      }
    } catch (error) {
      console.error('[MessagesScreen] Error in fetchSavedConversations:', error);
      Alert.alert(
        'Hata',
        'Kaydedilmiş konuşmalar yüklenirken beklenmeyen bir hata oluştu'
      );
    } finally {
      setSavedLoading(false);
      setSavedRefreshing(false);
    }
  };
  
  // Özel mesajlar tabı
  const PrivateConversationsTab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
              ) : privateConversations.length > 0 ? (
        <FlatList
          data={privateConversations}
          keyExtractor={(item) => item.userId || item._id || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.conversationItem,
                item.unreadCount > 0 && { borderLeftWidth: 4, borderLeftColor: THEME.secondary }
              ]}
              onPress={() => openPrivateConversation(item.userId, item.fullName)}
            >
              <View style={styles.avatarContainer}>
                {item.profilePicture ? (
                  <Image
                    source={{ uri: `${API_URL}/uploads/${item.profilePicture}` }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: THEME.lightPrimary }]}>
                    <Text style={{ color: THEME.primary, fontWeight: 'bold' }}>
                      {item.fullName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
                {item.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.conversationDetails}>
                <View style={styles.conversationHeader}>
                  <Text 
                    style={[
                      styles.conversationName, 
                      item.unreadCount > 0 && styles.boldText
                    ]}
                    numberOfLines={1}
                  >
                    {item.fullName}
                  </Text>
                  <Text style={styles.timeText}>{formatTime(item.lastMessageDate)}</Text>
                </View>
                <Text 
                  style={[
                    styles.lastMessage, 
                    item.unreadCount > 0 && styles.boldText
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="chat-bubble-outline" size={50} color={THEME.darkGray} />
          <Text style={styles.emptyText}>Henüz bir konuşmanız yok</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={openUserDiscovery}
          >
            <Text style={styles.emptyButtonText}>Kullanıcıları Keşfet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  // Etkinlik mesajları tabı
  const EventConversationsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabHeaderTitle}>Katıldığınız Etkinliklerin Mesaj Grupları</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
              ) : eventConversations.length > 0 ? (
        <FlatList
          data={eventConversations}
          keyExtractor={(item) => item.eventId || item._id || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.conversationItem,
                item.unreadCount > 0 && { borderLeftWidth: 4, borderLeftColor: THEME.secondary }
              ]}
              onPress={() => openEventConversation(item.eventId, item.title)}
            >
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: THEME.primary }]}>
                  <MaterialIcons name="group" size={22} color="white" />
                </View>
                {item.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.conversationDetails}>
                <View style={styles.conversationHeader}>
                  <Text 
                    style={[
                      styles.conversationName, 
                      item.unreadCount > 0 && styles.boldText
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.timeText}>
                    {item.startDate && formatTime(item.startDate)}
                  </Text>
                </View>
                <View style={styles.participantsInfo}>
                  <MaterialIcons name="people" size={14} color={THEME.darkGray} style={{marginRight: 4}} />
                  <Text style={styles.participantsText}>
                    {item.participantCount || 0} Katılımcı
                  </Text>
                </View>
                <View style={styles.eventInfoRow}>
                  <MaterialIcons name="calendar-today" size={14} color={THEME.darkGray} style={{marginRight: 4}} />
                  <Text 
                    style={styles.lastMessage}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.description || 'Etkinlik grup sohbeti'}
                  </Text>
                </View>
                <View style={styles.chipContainer}>
                  <View style={styles.chip}>
                    <MaterialIcons name="group" size={12} color={THEME.primary} />
                    <Text style={styles.chipText}>Katılımcı</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-note" size={50} color={THEME.darkGray} />
          <Text style={styles.emptyText}>Katıldığınız etkinliklerin sohbetleri burada görünecek</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.emptyButtonText}>Etkinliklere Katıl</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Mesaj öğesini render et
  const renderMessageItem = ({ item }) => {
    const isOwnMessage = item.sender._id === userProfile?.id || item.sender._id === 'self';
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Image
            source={
              item.sender.profilePicture 
                ? { uri: `${API_URL}/uploads/${item.sender.profilePicture}` } 
                : require('../assets/default-avatar.png')
            }
            style={styles.messageAvatar}
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.messageSender}>
              {item.sender.fullName || item.sender.username || 'Kullanıcı'}
            </Text>
          )}
          
          <Text style={styles.messageText}>{item.content}</Text>
          
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isOwnMessage && (
              <View style={styles.messageStatus}>
                {item.status === 'sending' && (
                  <MaterialIcons 
                    name="schedule" 
                    size={14} 
                    color="#999" 
                    style={{ marginLeft: 4 }}
                  />
                )}
                {item.status === 'delivered' && (
                  <MaterialIcons 
                    name="done" 
                    size={14} 
                    color={THEME.primary} 
                    style={{ marginLeft: 4 }}
                  />
                )}
                {item.status === 'read' || !item.status && (
                  <MaterialIcons 
                    name="done-all" 
                    size={14} 
                    color={THEME.primary} 
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };
  
  // Tab içeriğini render et
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'private':
        return (
          activeConversation?.type === 'private' ? (
            <KeyboardAvoidingView
              style={styles.container}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
              {/* Başlık */}
              <View style={styles.header}>
                <TouchableOpacity onPress={closeConversation} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {activeConversation.name}
                  </Text>
                </View>
              </View>
              
              {/* Mesaj Listesi */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={THEME.primary} />
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item, index) => item._id || index.toString()}
                  renderItem={renderMessageItem}
                  contentContainerStyle={styles.messagesList}
                  ListEmptyComponent={
                    <View style={styles.emptyMessagesContainer}>
                      <Text style={styles.emptyMessagesText}>
                        {`${activeConversation.name} ile mesajlaşmaya başlayın.`}
                      </Text>
                    </View>
                  }
                />
              )}
              
              {/* Mesaj Giriş Alanı */}
              <View style={styles.inputContainer}>
                {/* Moderasyon hatası */}
                {moderationError && (
                  <Text style={styles.errorText}>{moderationError}</Text>
                )}
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Sarsma animasyonu ile input */}
                  <ShakeAnimation 
                    shake={shakeAnimation}
                    onAnimationEnd={() => setShakeAnimation(false)}
                    style={{ flex: 1 }}
                  >
                    <TextInput
                      ref={inputRef}
                      style={styles.input}
                      value={newMessage}
                      onChangeText={handleInputChange}
                      placeholder="Mesajınızı yazın..."
                      multiline
                    />
                  </ShakeAnimation>
                  
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !newMessage.trim() && styles.sendButtonDisabled
                    ]}
                    onPress={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Ionicons name="send" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <PrivateConversationsTab />
          )
        );
      case 'event':
        return (
          activeConversation?.type === 'event' ? (
            <KeyboardAvoidingView
              style={styles.container}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
              {/* Başlık */}
              <View style={styles.header}>
                <TouchableOpacity onPress={closeConversation} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {activeConversation.name}
                  </Text>
                  <Text style={styles.headerSubtitle}>Etkinlik Grup Sohbeti</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => navigation.navigate('EventDetail', { id: activeConversation.id })}
                >
                  <MaterialIcons name="info-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Mesaj Listesi */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={THEME.primary} />
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item, index) => item._id || index.toString()}
                  renderItem={renderMessageItem}
                  contentContainerStyle={styles.messagesList}
                  ListEmptyComponent={
                    <View style={styles.emptyMessagesContainer}>
                      <Text style={styles.emptyMessagesText}>
                        {`${activeConversation.name} etkinliğinde mesajlaşmaya başlayın.`}
                      </Text>
                    </View>
                  }
                />
              )}
              
              {/* Mesaj Giriş Alanı */}
              <View style={styles.inputContainer}>
                {/* Moderasyon hatası */}
                {moderationError && (
                  <Text style={styles.errorText}>{moderationError}</Text>
                )}
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Sarsma animasyonu ile input */}
                  <ShakeAnimation 
                    shake={shakeAnimation}
                    onAnimationEnd={() => setShakeAnimation(false)}
                    style={{ flex: 1 }}
                  >
                    <TextInput
                      ref={inputRef}
                      style={styles.input}
                      value={newMessage}
                      onChangeText={handleInputChange}
                      placeholder="Etkinlik grubuna mesaj yazın..."
                      multiline
                    />
                  </ShakeAnimation>
                  
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !newMessage.trim() && styles.sendButtonDisabled
                    ]}
                    onPress={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Ionicons name="send" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <EventConversationsTab />
          )
        );
      default:
        return null;
    }
  };
  
  // Kullanıcı Keşfetme Modalı
  const UserDiscoveryModal = () => (
    <Modal
      visible={userDiscoveryVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setUserDiscoveryVisible(false)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            onPress={() => setUserDiscoveryVisible(false)}
            style={{ padding: 10 }}
          >
            <Ionicons name="close" size={24} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Kullanıcıları Keşfet</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {loadingUsers && users.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.primary} />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz hiç kullanıcı yok.</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              // Kendisi mi kontrol et
              const isCurrentUser = userProfile?.id === item._id;
              
              return (
                <TouchableOpacity
                  onPress={() => !isCurrentUser && handleSelectUser(item)}
                  style={[
                    styles.userItem,
                    isCurrentUser && { backgroundColor: `${THEME.primary}20` }
                  ]}
                  disabled={isCurrentUser}
                >
                  <View style={styles.userItemAvatar}>
                    {item.profilePicture ? (
                      <Image 
                        source={{ uri: `${API_URL}/uploads/${item.profilePicture}` }}
                        style={styles.userAvatar}
                      />
                    ) : (
                      <View style={[styles.userAvatar, { backgroundColor: THEME.primary }]}>
                        <Text style={styles.userAvatarText}>
                          {item.fullName?.charAt(0) || item.username?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.userItemContent}>
                    <Text style={styles.userName}>
                      {isCurrentUser && <Text style={{ fontWeight: 'bold' }}>(BEN) </Text>}
                      {item.fullName || item.username}
                    </Text>
                    <Text style={styles.userUsername}>@{item.username}</Text>
                    {item.bio && (
                      <Text style={styles.userBio} numberOfLines={2}>
                        {item.bio}
                      </Text>
                    )}
                    {item.hobbies && item.hobbies.length > 0 && (
                      <View style={styles.userHobbies}>
                        {item.hobbies.slice(0, 3).map((hobby, index) => (
                          <View key={index} style={styles.hobbyChip}>
                            <Text style={styles.hobbyChipText}>
                              {typeof hobby === 'object' ? hobby.name : hobby}
                            </Text>
                          </View>
                        ))}
                        {item.hobbies.length > 3 && (
                          <View style={styles.hobbyChip}>
                            <Text style={styles.hobbyChipText}>+{item.hobbies.length - 3}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            onEndReached={loadMoreUsers}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              loadingUsers ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={THEME.primary} />
                </View>
              ) : !hasMoreUsers && users.length > 0 ? (
                <Text style={styles.endListText}>Başka kullanıcı bulunamadı</Text>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
  
  // Giriş yapılmamışsa bilgi mesajı göster
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={THEME.primary} barStyle="light-content" />
        <View style={styles.loginRequiredContainer}>
          <Text style={styles.loginRequiredText}>
            Mesajlaşma özelliğini kullanmak için giriş yapmalısınız.
          </Text>
          <Button
            title="Giriş Yap"
            onPress={() => navigation.navigate('Login')}
            color={THEME.primary}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Ana bileşen render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {!isLoggedIn ? (
        <View style={styles.loginRequiredContainer}>
          <Text style={styles.loginRequiredText}>
            Mesajlaşma özelliğini kullanmak için giriş yapmalısınız.
          </Text>
          <Button
            title="Giriş Yap"
            onPress={() => navigation.navigate('Login')}
            color={THEME.primary}
          />
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mesajlar</Text>
            
            {/* Kullanıcıları Keşfet butonu */}
            <TouchableOpacity 
              style={styles.discoverButton}
              onPress={openUserDiscovery}
            >
              <Ionicons name="people" size={16} color="white" style={{marginRight: 4}} />
              <Text style={styles.discoverButtonText}>Kullanıcıları Keşfet</Text>
            </TouchableOpacity>
          </View>
          
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: 100 }}
            renderTabBar={props => (
              <TabBar
                {...props}
                indicatorStyle={{ backgroundColor: THEME.primary }}
                style={{ backgroundColor: '#fff' }}
                labelStyle={{ color: THEME.text, textTransform: 'none' }}
                activeColor={THEME.primary}
                inactiveColor={THEME.lightText}
              />
            )}
            style={styles.tabView}
          />
          
          {/* Kullanıcı Keşfetme Modalı */}
          <UserDiscoveryModal />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: THEME.primary,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  tabHeader: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabHeaderTitle: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: 'bold',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 8,
    backgroundColor: THEME.secondary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#757575',
  },
  lastMessage: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#212121',
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantsText: {
    fontSize: 12,
    color: '#757575',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 10,
    color: THEME.primary,
    marginLeft: 4,
  },
  eventInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: THEME.lightPrimary + '20',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  eventInfoTextContainer: {
    flex: 1,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#424242',
  },
  participantsButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  participantsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 10,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 6,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  ownMessageBubble: {
    backgroundColor: THEME.messageOutgoing,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: THEME.messageIncoming,
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#212121',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 10,
    color: '#757575',
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingContainer: {
    padding: 8,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  typingAnimation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#999',
    marginHorizontal: 1,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'column',
    backgroundColor: '#FFF',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginVertical: 4,
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
  inputActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputActionButton: {
    padding: 6,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
    marginHorizontal: 8,
    backgroundColor: '#FFF',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginVertical: 16,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyMessagesText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 16,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text,
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userItemAvatar: {
    marginRight: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userItemContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  userUsername: {
    fontSize: 12,
    color: '#757575',
  },
  userBio: {
    fontSize: 14,
    color: '#757575',
  },
  userHobbies: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hobbyChip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 4,
  },
  hobbyChipText: {
    fontSize: 10,
    color: THEME.primary,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  endListText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginRequiredText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginVertical: 16,
  },
  discoverButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoverButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabView: {
    flex: 1,
  },
});

export default MessagesScreen; 