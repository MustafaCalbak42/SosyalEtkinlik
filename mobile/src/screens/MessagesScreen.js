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
  StatusBar
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
  
  // Tab yönetimi için state
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'private', title: 'Özel Mesajlar' },
    { key: 'event', title: 'Etkinlik Mesajları' },
  ]);
  
  // Mesajlaşma için state
  const [privateConversations, setPrivateConversations] = useState([]);
  const [eventConversations, setEventConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
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
  
  // Özel konuşmaları yükle
  const fetchPrivateConversations = async () => {
    if (!token) {
      console.warn('[MessagesScreen] No token available for fetching private conversations');
      return;
    }
    
    try {
      console.log('[MessagesScreen] Fetching private conversations');
      const messageService = await import('../services/messageService');
      const result = await messageService.getPrivateConversations();
      
      if (result.success) {
        setPrivateConversations(result.data || []);
        console.log('[MessagesScreen] Private conversations loaded:', result.data?.length || 0);
      } else {
        console.warn('[MessagesScreen] Failed to load private conversations:', result.message);
        setPrivateConversations([]);
      }
    } catch (error) {
      console.error('[MessagesScreen] Konuşmalar yüklenirken hata:', error);
      setPrivateConversations([]);
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
    
    console.log('[MessagesScreen] Loading conversations...');
    setLoading(true);
    Promise.all([fetchPrivateConversations(), fetchEventConversations()])
      .finally(() => {
        setLoading(false);
        console.log('[MessagesScreen] Conversations loading completed');
      });
      
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
      return;
    }
    
    try {
      setLoading(true);
      console.log('[MessagesScreen] Opening private conversation with user:', userId);
      const messageService = await import('../services/messageService');
      const result = await messageService.getPrivateMessages(userId);
      
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
        setMessages([]);
      }
      
      // Mesaj listesini aşağı kaydır
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    } catch (error) {
      console.error('[MessagesScreen] Mesajlar yüklenirken hata:', error);
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
      
      // Gönderilen mesajı önce UI'a ekle (optimistik güncelleme)
      const tempMessage = {
        _id: `temp-${Date.now()}`,
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
          content
        });
      } else if (activeConversation.type === 'event') {
        // Etkinlik mesajı gönder
        console.log('[MessagesScreen] Sending event message to:', activeConversation.id);
        socket.emit('event_message', {
          eventId: activeConversation.id,
          content
        });
      }
      
      // Input alanını temizle
      setNewMessage('');
    } catch (error) {
      console.error('[MessagesScreen] Mesaj gönderme hatası:', error);
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
  
  // Input değiştiğinde yazıyor... bildirimi gönder
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
  };
  
  // Zaman formatla
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    } catch (error) {
      return '';
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
            onPress={() => navigation.navigate('UserList')}
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
            onPress={() => navigation.navigate('EventList')}
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
        return <PrivateConversationsTab />;
      case 'event':
        return <EventConversationsTab />;
      default:
        return null;
    }
  };
  
  // Giriş yapılmamışsa bilgi mesajı göster
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={THEME.primary} barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mesajlar</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="login" size={50} color={THEME.darkGray} />
          <Text style={styles.emptyText}>Mesajlaşmak için giriş yapmanız gerekiyor</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
          >
            <Text style={styles.emptyButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Ana bileşen render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={THEME.primary} barStyle="light-content" />
      
      {activeConversation ? (
        // Mesajlaşma ekranı
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
              {activeConversation.type === 'event' && (
                <Text style={styles.headerSubtitle}>Etkinlik Grup Sohbeti</Text>
              )}
            </View>
            
            {activeConversation.type === 'event' && (
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => navigation.navigate('EventDetail', { id: activeConversation.id })}
              >
                <MaterialIcons name="info-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Etkinlik bilgileri (eğer etkinlik mesajıysa) */}
          {activeConversation.type === 'event' && activeConversation.description && (
            <View style={styles.eventInfoContainer}>
              <MaterialIcons name="event" size={20} color={THEME.primary} style={{ marginRight: 8 }} />
              <View style={styles.eventInfoTextContainer}>
                <Text style={styles.eventInfoText} numberOfLines={2}>
                  {activeConversation.description}
                </Text>
              </View>
              <TouchableOpacity style={styles.participantsButton}>
                <Text style={styles.participantsButtonText}>Katılımcılar</Text>
              </TouchableOpacity>
            </View>
          )}
          
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
                    {activeConversation.type === 'event' 
                      ? `${activeConversation.name} etkinliğinde mesajlaşmaya başlayın.` 
                      : `${activeConversation.name} ile mesajlaşmaya başlayın.`
                    }
                  </Text>
                </View>
              }
              ListFooterComponent={
                Object.values(typingUsers).some(user => user !== null) && (
                  <View style={styles.typingContainer}>
                    <View style={styles.typingBubble}>
                      <Text style={styles.typingText}>
                        {Object.values(typingUsers)
                          .filter(user => user !== null)
                          .map(user => user.username)
                          .join(', ')} yazıyor...
                      </Text>
                      <View style={styles.typingAnimation}>
                        <View style={[styles.typingDot, { animationDelay: '0s' }]} />
                        <View style={[styles.typingDot, { animationDelay: '0.3s' }]} />
                        <View style={[styles.typingDot, { animationDelay: '0.6s' }]} />
                      </View>
                    </View>
                  </View>
                )
              }
            />
          )}
          
          {/* Mesaj Giriş Alanı */}
          <View style={styles.inputContainer}>
            <View style={styles.inputActionsContainer}>
              <TouchableOpacity style={styles.inputActionButton}>
                <MaterialIcons name="insert-emoticon" size={24} color={THEME.darkGray} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputActionButton}>
                <MaterialIcons name="attach-file" size={24} color={THEME.darkGray} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputActionButton}>
                <MaterialIcons name="photo-camera" size={24} color={THEME.darkGray} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={handleInputChange}
              placeholder={
                activeConversation.type === 'event'
                  ? "Etkinlik grubuna mesaj yazın..."
                  : "Mesajınızı yazın..."
              }
              multiline
            />
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
        </KeyboardAvoidingView>
      ) : (
        // Tab görünümü (konuşma listesi)
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mesajlar</Text>
          </View>
          
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: 100 }}
            renderTabBar={props => (
              <TabBar
                {...props}
                style={{ backgroundColor: THEME.primary }}
                indicatorStyle={{ backgroundColor: 'white' }}
                activeColor="white"
                inactiveColor="rgba(255, 255, 255, 0.7)"
                labelStyle={{ fontWeight: 'bold' }}
              />
            )}
          />
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default MessagesScreen; 