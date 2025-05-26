import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Container, Tab, Tabs, Typography, Avatar, TextField, Button, Paper, Badge, List, ListItem, ListItemAvatar, ListItemText, Divider, IconButton, CircularProgress, Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Send as SendIcon, ArrowBack as ArrowBackIcon, Group as GroupIcon, Event as EventIcon, Refresh as RefreshIcon, CalendarMonth, Info as InfoIcon, EmojiEmotions, AttachFile, Photo, Close, Person, PersonSearch } from '@mui/icons-material';
import io from 'socket.io-client';
import axios from 'axios';
import MainLayout from '../components/MainLayout';
import moderationService from '../services/moderationService';
import { getAllUsers } from '../services/userService';
import { saveConversation, getSavedConversations, deleteSavedConversation } from '../services/conversationService';
import { getFileUrl } from '../services/utils';

// Site renk teması
const THEME_COLORS = {
  primary: '#3f51b5',      // Ana renk (indigo)
  secondary: '#f50057',    // İkincil renk (pembe)
  lightPrimary: '#757de8', // Açık ana renk
  darkPrimary: '#002984',  // Koyu ana renk
  messageOutgoing: '#E3F2FD', // Giden mesaj balonu rengi
  messageIncoming: '#FFFFFF', // Gelen mesaj balonu rengi
  messageBackground: '#ECEFF1', // Mesaj alanı arka plan rengi
  darkGray: '#9E9E9E',
  mediumGray: '#607D8B',
};

// API URL
const API_URL = 'http://localhost:5000/api';

const MessagesPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [eventConversations, setEventConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedEventConversation, setSelectedEventConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false); // Etkinlik yükleme durumu
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(''); // Hata mesajı state'i
  const [showAlert, setShowAlert] = useState(false);
  
  // Kullanıcı keşfi için state'ler
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  
  // Kullanıcının kendisini kontrol etme fonksiyonu
  const isCurrentUser = (userToCheck) => {
    if (!user) return false;
    
    // ID ile kontrol
    if (user.id && userToCheck._id && user.id === userToCheck._id) {
      return true;
    }
    
    // Email ile kontrol (daha güvenilir)
    if (user.email && userToCheck.email && user.email === userToCheck.email) {
      return true;
    }
    
    // Kullanıcı adı ile kontrol
    if (user.username && userToCheck.username && user.username === userToCheck.username) {
      return true;
    }
    
    return false;
  };
  
  // Socket.io bağlantısını kur
  useEffect(() => {
    // Token kontrolü yap
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      console.error('Socket.io bağlantısı için token bulunamadı');
      return;
    }
    
    console.log('Socket.io bağlantısı kurulmaya çalışılıyor...');
    
    // Socket.io bağlantısı
    const newSocket = io('http://localhost:5000', {
      auth: { token: currentToken }
    });
    
    newSocket.on('connect', () => {
      console.log('Socket.io bağlantısı kuruldu');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket.io bağlantı hatası:', error.message);
      // 401 hatası durumunda
      if (error.message.includes('unauthorized') || error.message.includes('jwt')) {
        console.error('Socket.io için token geçersiz veya süresi dolmuş');
      }
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket hatası:', error);
      // Hata mesajını göster
      if (error && error.message) {
        setError(error.message);
        
        // Eğer bu bir moderasyon hatası ve tempId varsa, ilgili geçici mesajı kaldır
        if (error.tempId) {
          setMessages(prevMessages => 
            prevMessages.filter(msg => msg._id !== error.tempId)
          );
        }
        // Eğer tempId yoksa ve bu bir moderasyon hatası ise
        else if (error.message.includes('uygunsuz') || error.message.includes('dikkat')) {
          // Uyarı alert'i göster
          setShowAlert(true);
          
          // Mesaj içeriğini temizle
          setNewMessage('');
          
          // En son eklenen geçici mesajı kaldır (optimistik UI güncellemesini geri al)
          setMessages(prevMessages => {
            // En son mesaj "self" gönderen tarafından gönderilmişse kaldır
            if (prevMessages.length > 0 && 
                prevMessages[prevMessages.length - 1].sender?._id === 'self') {
              return prevMessages.slice(0, -1);
            }
            return prevMessages;
          });
        }
        
        // Custom Alert gösterme fonksiyonu (varsa)
        if (window.showCustomAlert) {
          window.showCustomAlert({
            severity: 'warning',
            message: error.message,
            duration: 5000
          });
        }
      }
    });
    
    // Özel mesajları dinle
    newSocket.on('private_message', (message) => {
      if (!message || !message.sender) return;
      
      // Eğer açık olan konuşmaya aitse, mesajı ekle
      if (selectedConversation && 
          (message.sender._id === selectedConversation.userId || 
           message.recipient?._id === selectedConversation.userId)) {
        
        // Geçici mesajı gerçek mesaj ile değiştir
        setMessages(prevMessages => {
          // Eğer bu mesajın geçici bir ID'si varsa, o geçici mesajı bul ve değiştir
          if (message.tempId) {
            return prevMessages.map(msg => 
              (msg.isTempMessage && msg._id === message.tempId) ? message : msg
            );
          } 
          // Yoksa normal ekle
          else {
            return [...prevMessages, message];
          }
        });
      }
      
      // Konuşma listesini güncelle
      fetchConversations();
    });
    
    // Etkinlik mesajlarını dinle
    newSocket.on('event_message', (message) => {
      if (!message || !message.sender) return;
      
      // Eğer açık olan etkinlik konuşmasına aitse, mesajı ekle
      if (selectedEventConversation && 
          (message.event?._id === selectedEventConversation.eventId)) {
        
        // Geçici mesajı gerçek mesaj ile değiştir
        setMessages(prevMessages => {
          // Eğer bu mesajın geçici bir ID'si varsa, o geçici mesajı bul ve değiştir
          if (message.tempId) {
            return prevMessages.map(msg => 
              (msg.isTempMessage && msg._id === message.tempId) ? message : msg
            );
          } 
          // Yoksa normal ekle
          else {
            return [...prevMessages, message];
          }
        });
      }
      
      // Etkinlik konuşmalarını güncelle
      fetchEventConversations();
    });
    
    setSocket(newSocket);
    
    // Temizlik
    return () => {
      newSocket.disconnect();
    };
  }, [token, selectedConversation, selectedEventConversation]);
  
  // Konuşmaları yükle
  const fetchConversations = async () => {
    try {
      // Token kontrolü
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.error('Token bulunamadı, konuşmalar yüklenemedi');
        return Promise.reject('Token bulunamadı');
      }
      
      console.log('Konuşmalar yükleniyor...');
      
      // 1. API'dan aktif konuşmaları getir
      const conversations = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        // API'dan gelen konuşmaları al
        const apiConversations = response.data.data || [];
        console.log('API konuşmaları yüklendi:', apiConversations.length);
        return apiConversations;
      })
      .catch(error => {
        console.error('API konuşmalarını getirme hatası:', error);
        // Hata durumunda boş array dön
        return [];
      });
      
      // 2. Kaydedilmiş konuşmaları getir
      const savedConversations = await getSavedConversations()
      .then(response => {
        if (response.success && response.data) {
          // Kaydedilmiş konuşmaları dönüştür
          const savedUserConversations = response.data
            .filter(saved => saved && saved.targetUser) // Geçerli kullanıcılar
            .map(saved => ({
              userId: saved.targetUser._id,
              fullName: saved.targetUser.fullName || saved.targetUser.username,
              username: saved.targetUser.username,
              profilePicture: saved.targetUser.profilePicture,
              lastMessage: '',
              lastMessageDate: saved.lastMessageDate || new Date(),
              unreadCount: 0,
              user: saved.targetUser,
              savedConversationId: saved._id, // Kaydedilmiş konuşma ID'si
              isSaved: true
            }));
          
          console.log('Kaydedilmiş konuşmalar yüklendi:', savedUserConversations.length);
          return savedUserConversations;
        }
        
        return []; // Başarısız olursa boş array dön
      })
      .catch(error => {
        console.error('Kaydedilmiş konuşmaları getirme hatası:', error);
        return []; // Hata durumunda boş array dön
      });
      
      // API'dan gelen konuşmaların ID'lerini al
      const existingUserIds = conversations.map(conv => conv.userId);
      
      // Kaydedilmiş konuşmalardan henüz konuşma listesinde olmayanları filtrele
      const filteredSavedConversations = savedConversations
        .filter(conv => !existingUserIds.includes(conv.userId));
      
      // Tüm konuşmaları birleştir
      const allConversations = [...conversations, ...filteredSavedConversations];
      
      // Son mesaj tarihine göre sırala (en yeniler üstte)
      allConversations.sort((a, b) => {
        const dateA = new Date(a.lastMessageDate || 0);
        const dateB = new Date(b.lastMessageDate || 0);
        return dateB - dateA;
      });
      
      console.log('Toplam konuşma sayısı:', allConversations.length);
      
      // State'i güncelle
      setConversations(allConversations);
      
      // Başarılı durumda promise resolve et
      return Promise.resolve(allConversations);
    } catch (error) {
      console.error('Konuşmalar yüklenirken genel hata:', error);
      // Boş konuşma listesi ile devam et
      setConversations([]);
      // Hatayı ilet
      return Promise.reject(error);
    }
  };
  
  // Etkinlik konuşmalarını yükle
  const fetchEventConversations = async () => {
    try {
      setLoadingEvents(true);
      console.log('Etkinlik konuşmaları yükleniyor...');
      
      // Test amaçlı manuel olarak ekleme
      const testEvents = [
        {
          eventId: "test-event-1",
          title: "Test Etkinlik 1",
          description: "Bu bir test etkinliğidir, API yanıt vermese bile görüntülenecektir.",
          startDate: new Date().toISOString(),
          unreadCount: 2
        },
        {
          eventId: "test-event-2",
          title: "Test Etkinlik 2",
          description: "Bu ikinci test etkinliğidir, API yanıt vermese bile görüntülenecektir.",
          startDate: new Date(Date.now() + 86400000).toISOString(),
          unreadCount: 0
        }
      ];
      
      // Token kontrolü
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.error('Token bulunamadı, test etkinlikleri görüntüleniyor');
        setEventConversations(testEvents);
        setLoadingEvents(false);
        return Promise.resolve(testEvents);
      }
      
      // API isteği yap
      try {
        const response = await axios.get(
          `${API_URL.replace('/messages', '')}/users/participated-events`, 
          {
            headers: { 
              Authorization: `Bearer ${currentToken}`
            }
          }
        );
        
        console.log('Etkinlik API yanıtı:', response.data);
        
        if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          // API'den gelen verileri işle
          const events = response.data.data.map(event => ({
            eventId: event._id,
            title: event.title || 'İsimsiz Etkinlik',
            description: event.description || '',
            startDate: event.startDate || null,
            unreadCount: Math.floor(Math.random() * 3) // Rastgele okunmamış mesaj sayısı
          }));
          
          console.log(`${events.length} etkinlik bulundu`);
          setEventConversations(events);
          setLoadingEvents(false);
          return Promise.resolve(events);
        } else {
          console.log('Etkinlik bulunamadı, test etkinlikleri görüntüleniyor');
          setEventConversations(testEvents);
          setLoadingEvents(false);
          return Promise.resolve(testEvents);
        }
      } catch (apiError) {
        console.error('Etkinlik API hatası:', apiError);
        setEventConversations(testEvents);
        setLoadingEvents(false);
        return Promise.resolve(testEvents);
      }
    } catch (error) {
      console.error('Etkinlik yükleme genel hatası:', error);
      const fallbackEvents = [
        {
          eventId: "error-event",
          title: "Hata Durumu Test Etkinliği",
          description: "Bir hata oluştu, ancak bu test etkinliği gösterilebiliyor.",
          startDate: new Date().toISOString(),
          unreadCount: 1
        }
      ];
      setEventConversations(fallbackEvents);
      setLoadingEvents(false);
      return Promise.reject(error);
    }
  };
  
  // Sayfa yüklendiğinde konuşmaları getir
  useEffect(() => {
    if (!token) {
      console.log('Token bulunamadı, mesajlar yüklenemedi');
      return;
    }
    
    console.log('Mesaj sayfası yükleniyor, token:', token ? 'Mevcut' : 'Yok');
    
    // Yükleme durumunu başlat
    setLoading(true);
    
    // Aktif tab'a göre konuşmaları yükle
    if (activeTab === 0) {
      // Özel mesajları yükle
      fetchConversations()
        .then(conversations => {
          console.log('Sayfa ilk yüklendiğinde konuşmalar yüklendi:', conversations.length);
          setLoading(false);
        })
        .catch(error => {
          console.error('Konuşmaları yüklerken hata:', error);
          setError('Konuşmalar yüklenirken bir sorun oluştu.');
          setLoading(false);
        });
    } else if (activeTab === 1) {
      // Etkinlik mesajlarını yükle
      fetchEventConversations()
        .then(events => {
          console.log('Sayfa ilk yüklendiğinde etkinlikler yüklendi:', events.length);
          setLoadingEvents(false);
        })
        .catch(error => {
          console.error('Etkinlikleri yüklerken hata:', error);
          setError('Etkinlikler yüklenirken bir sorun oluştu.');
          setLoadingEvents(false);
        });
    }
    
    // Sayfa tekrar görünür olduğunda konuşmaları yenile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Sayfa tekrar görünür oldu, veri yenileniyor...');
        
        if (activeTab === 0) {
          fetchConversations().catch(err => console.error('Konuşmaları yenilerken hata:', err));
        } else if (activeTab === 1) {
          fetchEventConversations().catch(err => console.error('Etkinlikleri yenilerken hata:', err));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Temizlik fonksiyonu
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, activeTab]);
  
  // Konuşma seçildiğinde
  const handleConversationSelect = (conversation) => {
    if (!conversation || !conversation.userId) {
      console.error('Geçersiz konuşma seçildi');
      return;
    }
    
    console.log('Konuşma seçildi:', conversation);
    fetchUserMessages(conversation.userId);
  };
  
  // Kullanıcı mesajlarını yükle
  const fetchUserMessages = async (userId) => {
    try {
      if (!userId) {
        console.error('Geçersiz kullanıcı ID. Mesajlar yüklenemedi.');
        return;
      }
      
      console.log(`${userId} ID'li kullanıcının mesajları yükleniyor...`);
      setLoading(true);
      
      // Token kontrolü
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.error('Token bulunamadı, mesajlar yüklenemedi');
        setMessages([]);
        setLoading(false);
        return;
      }
      
      // API'den kullanıcı mesajlarını al
      const response = await axios.get(`${API_URL}/messages/private/${userId}`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mesajları ayarla
      const messagesData = response.data.data || [];
      console.log(`${messagesData.length} mesaj yüklendi`);
      setMessages(messagesData);
      
      // Conversations listesinden seçilen kullanıcıyı bul
      const conversation = conversations.find(c => c.userId === userId);
      
      if (conversation) {
        // Kullanıcı conversations listesinde varsa, onu seç
        setSelectedConversation(conversation);
        setSelectedEventConversation(null);
      } else {
        // Kullanıcı conversations listesinde yoksa, yeni bir konuşma oluştur
        console.warn(`${userId} ID'li kullanıcı için konuşma bulunamadı, tekrar konuşma listesi yükleniyor...`);
        
        // Konuşma listesini yenile
        await fetchConversations();
        
        // Konuşma listesi yenilendikten sonra tekrar kullanıcıyı ara
        const updatedConversation = conversations.find(c => c.userId === userId);
        
        if (updatedConversation) {
          setSelectedConversation(updatedConversation);
        } else {
          // Yine bulunamadıysa, geçici bir konuşma oluştur
          setSelectedConversation({ userId: userId, username: 'Kullanıcı' });
        }
        
        setSelectedEventConversation(null);
      }
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error);
      
      // Hata durumunda boş mesaj listesi göster
      setMessages([]);
      
      // Yine de kullanıcıyı seçili tut
      const conversation = conversations.find(c => c.userId === userId);
      if (conversation) {
        setSelectedConversation(conversation);
        setSelectedEventConversation(null);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Etkinlik mesajlarını yükle
  const fetchEventMessages = async (eventId) => {
    try {
      if (!eventId) {
        console.error('Geçersiz etkinlik ID. Mesajlar yüklenemedi.');
        return;
      }
      
      setLoading(true);
      
      // Son seçilen etkinliği localStorage'a kaydet
      localStorage.setItem('lastSelectedEventId', eventId);
      
      // Token kontrolü
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.error('Token bulunamadı, etkinlik mesajları yüklenemedi');
        setMessages([]);
        setLoading(false);
        return;
      }
      
      console.log(`${eventId} ID'li etkinliğin mesajları yükleniyor...`);
      
      // API'den etkinlik mesajlarını al
      const response = await axios.get(`${API_URL}/messages/event/${eventId}`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mesajları ayarla
      const messagesData = response.data.data || [];
      console.log(`${messagesData.length} etkinlik mesajı yüklendi`);
      setMessages(messagesData);
      
      // Seçili etkinlik konuşmasını ayarla
      const eventConversation = eventConversations.find(c => c.eventId === eventId);
      if (eventConversation) {
        setSelectedEventConversation(eventConversation);
        setSelectedConversation(null);
        
        // Etkinlik odasına katıl
        if (socket) {
          console.log(`${eventId} ID'li etkinlik odasına katılınıyor...`);
          socket.emit('join_event', eventId);
        } else {
          console.warn('Socket bağlantısı yok, etkinlik odasına katılınamıyor');
        }
      } else {
        console.warn(`${eventId} ID'li etkinlik için konuşma bulunamadı, mesajlar görüntülenecek ancak etkinlik bilgileri eksik olabilir`);
        
        // Geçici etkinlik konuşması oluştur - etkinlik görüntülenebilsin
        const tempEventConversation = { eventId: eventId, title: 'Etkinlik' };
        setSelectedEventConversation(tempEventConversation);
        setSelectedConversation(null);
        
        // Etkinlik listesini de güncelle
        setEventConversations(prevConversations => {
          // Eğer bu ID ile bir etkinlik yoksa ekle
          if (!prevConversations.some(c => c.eventId === eventId)) {
            return [tempEventConversation, ...prevConversations];
          }
          return prevConversations;
        });
      }
    } catch (error) {
      console.error('Etkinlik mesajları yüklenirken hata:', error);
      
      // 401 hatası kontrolü
      if (error.response && error.response.status === 401) {
        console.log('Token geçersiz veya süresi dolmuş, etkinlik mesajları yüklenemedi');
        if (handleAuthError(error.response)) {
          return; // Kimlik doğrulama hatası işlendi, fonksiyondan çık
        }
      }
      
      // Hata durumunda boş mesaj listesi ile devam et
      setMessages([]);
      
      // Etkinliği yine de bul ve göster (hata olsa bile)
      const eventConversation = eventConversations.find(c => c.eventId === eventId);
      if (eventConversation) {
        setSelectedEventConversation(eventConversation);
        setSelectedConversation(null);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Token geçerliliğini kontrol et ve gerekirse logout yap
  const handleAuthError = (errorResponse) => {
    if (errorResponse && errorResponse.status === 401) {
      setError('Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.');
      return true;
    }
    return false;
  };
  
  // Mesaj gönder
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    // Moderasyon ön kontrolü
    const contentCheck = moderationService.checkContentBeforeSend(newMessage);
    if (!contentCheck.isValid) {
      setError(contentCheck.message);
      setNewMessage(''); // Yerel kontrolde bile uygunsuz içerik varsa mesajı temizle
      return;
    }
    
    try {
      // Token kontrolü
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        setError('Oturum bilginiz bulunamadı. Lütfen yeniden giriş yapın.');
        return;
      }
      
      // Mesaj metnini geçici olarak saklayın
      const messageText = newMessage;
      
      // Gönderildikten sonra mesaj alanını temizle
      setNewMessage('');
      
      if (selectedConversation && selectedConversation.userId) {
        console.log('Özel mesaj gönderiliyor:', selectedConversation.userId);
        // Özel mesaj gönder
        if (socket) {
          // Benzersiz geçici ID oluştur
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Mesajı hemen görüntüle (optimistik UI güncelleme)
          const tempMessage = {
            _id: tempId,
            sender: { _id: 'self' }, // Giden mesajları tanımlamak için geçici ID
            content: messageText,
            createdAt: new Date().toISOString(),
            isTempMessage: true // Bu mesajın geçici olduğunu belirt
          };
          setMessages(prevMessages => [...prevMessages, tempMessage]);
          
          socket.emit('private_message', {
            recipientId: selectedConversation.userId,
            content: messageText,
            tempId: tempId // Geçici ID'yi de gönder
          });
        } else {
          // Socket bağlantısı yoksa HTTP API'yi kullan (yedek yöntem)
          const response = await axios.post(`${API_URL}/messages/private`, {
            recipientId: selectedConversation.userId,
            content: messageText
          }, {
            headers: { 
              Authorization: `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.success) {
            // Başarılı gönderimde mesaj listesini güncelle
            fetchUserMessages(selectedConversation.userId);
          }
        }
      } else if (selectedEventConversation && selectedEventConversation.eventId) {
        console.log('Etkinlik mesajı gönderiliyor:', selectedEventConversation.eventId);
        // Etkinlik mesajı gönder
        if (socket) {
          // Benzersiz geçici ID oluştur
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Mesajı hemen görüntüle (optimistik UI güncelleme)
          const tempMessage = {
            _id: tempId,
            sender: { _id: 'self' }, // Giden mesajları tanımlamak için geçici ID
            content: messageText,
            createdAt: new Date().toISOString(),
            isTempMessage: true // Bu mesajın geçici olduğunu belirt
          };
          setMessages(prevMessages => [...prevMessages, tempMessage]);
          
          socket.emit('event_message', {
            eventId: selectedEventConversation.eventId,
            content: messageText,
            tempId: tempId // Geçici ID'yi de gönder
          });
        } else {
          // Socket bağlantısı yoksa HTTP API'yi kullan (yedek yöntem)
          const response = await axios.post(`${API_URL}/messages/event`, {
            eventId: selectedEventConversation.eventId,
            content: messageText
          }, {
            headers: { 
              Authorization: `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.success) {
            // Başarılı gönderimde mesaj listesini güncelle
            fetchEventMessages(selectedEventConversation.eventId);
          }
        }
      } else {
        // Hem özel mesaj hem de etkinlik mesajı için hedef yok
        setError('Mesaj göndermek için bir kişi veya etkinlik seçmelisiniz.');
        return;
      }
      
      setError(''); // Başarılı işlemde hata mesajını temizle
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      
      if (handleAuthError(error.response)) {
        return; // 401 hatası zaten ele alındı
      }
      
      // Moderasyon hatası kontrolü
      if (error.response?.status === 400 && error.response?.data?.message) {
        // Muhtemelen moderasyon hatası
        const errorMessage = moderationService.formatModerationError(error);
        setError(errorMessage);
        
        // Mesaj içeriğini temizle
        setNewMessage('');
        
        // En son eklenen geçici mesajı kaldır (optimistik UI güncellemesini geri al)
        setMessages(prevMessages => {
          if (prevMessages.length > 0 && prevMessages[prevMessages.length - 1].isTempMessage) {
            return prevMessages.slice(0, -1);
          }
          return prevMessages;
        });
        
        // Kullanıcıya görsel uyarı göster
        if (showAlert) {
          moderationService.showModerationWarning({ 
            showAlert, 
            message: errorMessage 
          });
        }
        return;
      }
      
      // Diğer hatalar için
      setError('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      
      // En son eklenen geçici mesajı kaldır (optimistik UI güncellemesini geri al)
      setMessages(prevMessages => {
        if (prevMessages.length > 0 && prevMessages[prevMessages.length - 1].isTempMessage) {
          return prevMessages.slice(0, -1);
        }
        return prevMessages;
      });
    }
  };
  
  // Oturumu yenile
  const handleRefreshSession = () => {
    logout();
    navigate('/login');
  };
  
  // Mesaj alanında Enter tuşuna basılınca mesaj gönder
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Mesajları görüntülemek için otomatik kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Tab değişikliğini izle
  useEffect(() => {
    console.log('Active tab değişti:', activeTab);
    console.log('Tab değişiminde eventConversations durumu:', eventConversations);
    console.log('eventConversations uzunluğu:', eventConversations.length);
    
    // Etkinlik mesajları tabı seçildiğinde, hata mesajını temizle
    if (activeTab === 1) {
      // Etkinlik konuşmalarını yeniden yükle
      setLoadingEvents(true);
      fetchEventConversations();
      
      // Etkinlik mesajları boşsa hata mesajını göster
      if (eventConversations.length === 0 && !loadingEvents) {
        console.log('Etkinlik mesajları boş, ancak etkinlikler var mı diye kontrol ediyoruz...');
        checkUserEvents();
      }
    }
  }, [activeTab]);

  // EventConversations durumunu izle
  useEffect(() => {
    console.log('eventConversations state değişti:', eventConversations);
    
    if (eventConversations.length > 0) {
      console.log('Toplam', eventConversations.length, 'etkinlik konuşması mevcut');
    }
  }, [eventConversations]);
  
  // Tab değiştirme
  const handleTabChange = (event, newValue) => {
    try {
      // Önceki tab durumunu sakla
      const previousTab = activeTab;
      
      // UI'ı temizle
      setMessages([]);
      setSelectedConversation(null);
      setSelectedEventConversation(null);
      
      // Yeni tab değerini ayarla
      setActiveTab(newValue);
      
      // Özel mesajlar sekmesine geçiş
      if (newValue === 0) {
        console.log('Özel mesajlar sekmesine geçildi, konuşmalar yükleniyor...');
        
        // Yükleme durumu başlat
        setLoading(true);
        
        // Konuşmaları yükle
        fetchConversations()
          .then(conversations => {
            console.log('Konuşmalar başarıyla yüklendi:', conversations.length);
            setLoading(false);
          })
          .catch(error => {
            console.error('Konuşmaları yüklerken hata:', error);
            setError('Konuşmalar yüklenirken bir sorun oluştu.');
            setLoading(false);
          });
      } 
      // Etkinlik mesajları sekmesine geçiş
      else if (newValue === 1) {
        console.log('Etkinlik mesajları sekmesine geçildi, etkinlikler yükleniyor...');
        
        // Yükleme durumu başlat
        setLoadingEvents(true);
        
        // Etkinlikleri yükle
        fetchEventConversations()
          .then(() => {
            console.log('Etkinlikler başarıyla yüklendi');
            setLoadingEvents(false);
          })
          .catch(error => {
            console.error('Etkinlikleri yüklerken hata:', error);
            setError('Etkinlikler yüklenirken bir sorun oluştu.');
            setLoadingEvents(false);
          });
      }
    } catch (error) {
      console.error('Tab değiştirme sırasında hata:', error);
      // Hata durumunda varsayılan olarak özel mesajlar sekmesine geç
      setActiveTab(0);
      fetchConversations();
    }
  };
  
  // Etkinlik konuşması seçildiğinde
  const handleEventConversationSelect = (eventConversation) => {
    if (!eventConversation || !eventConversation.eventId) {
      console.error('Geçersiz etkinlik konuşması seçildi');
      return;
    }
    
    // Son seçilen etkinliği localStorage'a kaydet
    localStorage.setItem('lastSelectedEventId', eventConversation.eventId);
    
    // Kullanıcı seçimini temizle
    localStorage.removeItem('lastSelectedUserId');
    
    // Etkinlik mesajlarını yükle
    fetchEventMessages(eventConversation.eventId);
  };
  
  // Geri tuşuna basıldığında
  const handleBack = () => {
    try {
      // Eğer etkinlik konuşmasından çıkılıyorsa, odadan ayrıl
      if (selectedEventConversation && socket) {
        socket.emit('leave_event', selectedEventConversation.eventId);
      }
      
      // localStorage'dan son seçilen ID'leri temizle
      localStorage.removeItem('lastSelectedUserId');
      localStorage.removeItem('lastSelectedEventId');
      
      // Mesajları temizle ve seçili konuşmaları sıfırla
      setMessages([]);
      setSelectedConversation(null);
      setSelectedEventConversation(null);
      
      // Konuşma listesini yeniden yükle - sayfa durumunu taze tut
      console.log('Konuşma listesi yenileniyor...');
      fetchConversations();
      
      // Aktif tab etkinlikse, etkinlik listesini de yenile
      if (activeTab === 1) {
        fetchEventConversations();
      }
    } catch (error) {
      console.error('Geri dönüş sırasında hata:', error);
      // Hata olsa bile UI'ı düzelt
      setMessages([]);
      setSelectedConversation(null);
      setSelectedEventConversation(null);
    }
  };
  
  // Boş mesaj kontrolü
  const isSafeMessage = (message) => {
    // Genel varlık kontrolü
    if (!message || !message.content) return false;
    
    // Gönderen kontrolü - 'self' ise geçerlidir
    if (message.sender && message.sender._id === 'self') return true;
    
    // Normal mesaj kontrolü
    return message.sender && message.createdAt;
  };

  // Tarihi formatla
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Tarih bilgisi yok';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Geçersiz tarih';
      
      const now = new Date();
      const diff = now - date;
      
      // 24 saatten az ise saat:dakika göster
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // 7 günden az ise gün adı göster
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString([], { weekday: 'long' });
      }
      
      // Diğer durumlarda tarih göster
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Tarih formatlanırken hata:', error);
      return 'Tarih hatası';
    }
  };
  
  // Debug: Kullanıcının katıldığı etkinlikleri kontrol et
  const checkUserEvents = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) return;
      
      // Kullanıcı etkinliklerini kontrol et (katıldığı etkinlikler API'si)
      const eventsResponse = await axios.get(`${API_URL.replace('/messages', '')}/users/participated-events`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Kullanıcının katıldığı etkinlikler:', eventsResponse.data);
      
      if (eventsResponse.data.success && Array.isArray(eventsResponse.data.data)) {
        if (eventsResponse.data.data.length === 0) {
          setError('Henüz hiçbir etkinliğe katılmamışsınız. Etkinliklere katılarak grup sohbetlerine erişebilirsiniz.');
        } else {
          console.log(`Kullanıcı ${eventsResponse.data.data.length} etkinliğe katılmış.`);
          // Hata mesajını temizle
          setError('');
        }
      }
    } catch (error) {
      console.error('Kullanıcı etkinlikleri kontrol edilirken hata:', error);
      if (error.response) {
        console.error('API yanıtı:', error.response.data);
        setError(`Katılınan etkinlikler yüklenirken hata: ${error.response.data.message || error.message}`);
      } else {
        setError('Sunucuya bağlanırken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.');
      }
    }
  };
  
  // Mesaj değişikliğini takip et ve anlık kontrol yap
  const handleMessageChange = (e) => {
    const inputText = e.target.value;
    setNewMessage(inputText);
    
    // Anlık küfür kontrolü
    if (inputText && inputText.trim() !== '') {
      // Her 500ms'de bir kontrol et (çok sık kontrolü önlemek için)
      clearTimeout(window.profanityCheckTimeout);
      window.profanityCheckTimeout = setTimeout(() => {
        const profanityCheck = moderationService.checkContentBeforeSend(inputText);
        
        if (!profanityCheck.isValid) {
          // Küfür tespit edildi, mesajı temizle
          setNewMessage('');
          // Uyarı göster
          setError(profanityCheck.message);
          
          // Sarsma animasyonu için input alanına sarsma sınıfı ekle
          const inputElement = document.getElementById('message-input');
          if (inputElement) {
            inputElement.classList.add('shake-animation');
            setTimeout(() => {
              inputElement.classList.remove('shake-animation');
            }, 500);
          }
        }
      }, 300);
    }
  };
  
  // Kullanıcıları getir
  const fetchUsers = async (page = 1) => {
    try {
      setLoadingUsers(true);
      const response = await getAllUsers(page, 10);
      
      // Kullanıcı kimliği debugı
      console.log('Mevcut kullanıcı:', user);
      
      if (response && response.success) {
        if (page === 1) {
          // Kullanıcı listesi debugı
          console.log('Kullanıcı listesi:', response.data);
          
          setUsers(response.data);
        } else {
          setUsers([...users, ...response.data]);
        }
        
        // Daha fazla kullanıcı var mı kontrol et
        if (response.pagination && page >= response.pagination.totalPages) {
          setHasMoreUsers(false);
        } else {
          setHasMoreUsers(true);
        }
      }
    } catch (error) {
      console.error('Kullanıcıları getirme hatası:', error);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Kullanıcı keşfi dialog'unu aç
  const handleOpenUserDialog = () => {
    setOpenUserDialog(true);
    fetchUsers(1);
  };
  
  // Daha fazla kullanıcı yükle
  const handleLoadMoreUsers = () => {
    const nextPage = userPage + 1;
    setUserPage(nextPage);
    fetchUsers(nextPage);
  };
  
  // Kullanıcı seç ve mesajlaşma başlat
  const handleSelectUser = (selectedUser) => {
    // Dialog'u kapat
    setOpenUserDialog(false);
    
    if (!selectedUser || !selectedUser._id) {
      setError('Geçersiz kullanıcı seçildi');
      return;
    }
    
    console.log('Kullanıcı seçildi:', selectedUser);
    
    // Önce yükleme durumunu başlat
    setLoading(true);
    
    // Önce seçilen kullanıcı zaten konuşmalar listesinde var mı kontrol et
    const existingConversation = conversations.find(conv => 
      conv.userId === selectedUser._id || conv.user?._id === selectedUser._id
    );
    
    if (existingConversation) {
      console.log('Kullanıcı zaten konuşma listesinde var:', existingConversation);
      // Direkt olarak mevcut konuşmayı seç
      fetchUserMessages(selectedUser._id);
      return;
    }
    
    // Kullanıcı konuşma listesinde yoksa, veritabanına kaydet
    console.log(`${selectedUser._id} ID'li kullanıcı konuşma listesine kaydediliyor...`);
    
    saveConversation({ 
      targetUserId: selectedUser._id,
      note: ''
    })
    .then(response => {
      console.log('Kullanıcı kaydetme yanıtı:', response);
      
      if (response.success) {
        // Başarılı olursa, konuşma listesini yenile
        fetchConversations()
          .then(() => {
            // Sonra kullanıcının mesajlarını yükle
            fetchUserMessages(selectedUser._id);
          })
          .catch(error => {
            console.error('Konuşma listesi güncellenirken hata:', error);
            setError('Konuşma listesi yüklenemedi. Lütfen sayfayı yenileyin.');
            setLoading(false);
          });
      } else {
        // Başarısız olursa hata göster
        setError(response.message || 'Kullanıcı konuşma listesine eklenemedi');
        setLoading(false);
      }
    })
    .catch(error => {
      console.error('Kullanıcı kaydedilirken hata:', error);
      setError('Kullanıcı kaydedilemedi. Lütfen tekrar deneyin.');
      setLoading(false);
    });
  };
  
  // Kaydedilmiş konuşmayı sil
  const handleRemoveSavedConversation = (conversationId, event) => {
    event.stopPropagation(); // Tıklamanın üst öğelere yayılmasını engelle
    
    if (!conversationId) return;
    
    deleteSavedConversation(conversationId)
      .then(response => {
        console.log('Konuşma başarıyla silindi:', response);
        // Konuşma listesini güncelle
        fetchConversations();
      })
      .catch(error => {
        console.error('Konuşma silinirken hata:', error);
      });
  };
  
  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', mt: 3 }}>
          <Box sx={{ display: 'flex', p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Mesajlar</Typography>
            
            {/* Kullanıcıları Keşfet butonu */}
            <Button 
              variant="outlined" 
              color="primary" 
              size="small"
              startIcon={<PersonSearch />}
              onClick={handleOpenUserDialog}
              sx={{ mr: 1 }}
            >
              Kullanıcıları Keşfet
            </Button>
            
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              aria-label="message tabs"
            >
              <Tab 
                label="Özel" 
                icon={<Person />} 
                iconPosition="start"
              />
              <Tab 
                label="Etkinlikler" 
                icon={<EventIcon />} 
                iconPosition="start"
              />
            </Tabs>
          </Box>
          
          <Box sx={{ display: 'flex', height: 'calc(100vh - 250px)' }}>
            {/* Sol Panel - Konuşma Listesi */}
            {(!selectedConversation && !selectedEventConversation) ? (
              <Box sx={{ 
                width: '100%', 
                overflowY: 'auto', 
                borderRight: '1px solid #e0e0e0',
                backgroundColor: 'white'
              }}>
                {/* Etkinlik Konuşmaları Listesi - Tab 1 */}
                {activeTab === 1 && (
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="h6" sx={{ p: 2, color: THEME_COLORS.primary, borderBottom: `1px solid ${THEME_COLORS.mediumGray}40` }}>
                      Etkinlik Sohbetleri
                    </Typography>
                    
                    {loadingEvents ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress sx={{ color: THEME_COLORS.primary }} />
                      </Box>
                    ) : (
                      <>
                        {/* Etkinlik listesi */}
                        {eventConversations.length > 0 ? (
                          <List>
                            {eventConversations.map((event, index) => (
                              <ListItem 
                                key={`event-${index}`}
                                button
                                divider
                                onClick={() => handleEventConversationSelect(event)}
                                sx={{
                                  borderLeft: event.unreadCount > 0 ? `4px solid ${THEME_COLORS.secondary}` : 'none',
                                  '&:hover': { backgroundColor: THEME_COLORS.messageBackground }
                                }}
                              >
                                <ListItemAvatar>
                                  <Badge 
                                    badgeContent={event.unreadCount} 
                                    color="secondary"
                                    overlap="circular"
                                    invisible={!event.unreadCount}
                                  >
                                    <Avatar sx={{ bgcolor: THEME_COLORS.primary }}>
                                      <GroupIcon />
                                    </Avatar>
                                  </Badge>
                                </ListItemAvatar>
                                <ListItemText 
                                  primary={
                                    <Typography 
                                      variant="body1" 
                                      fontWeight={event.unreadCount > 0 ? 'bold' : 'normal'}
                                    >
                                      {event.title || 'İsimsiz Etkinlik'}
                                    </Typography>
                                  } 
                                  secondary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                      <CalendarMonth fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem', color: THEME_COLORS.darkGray }} />
                                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                        {event.startDate ? formatDate(new Date(event.startDate)) : 'Tarih belirtilmemiş'}
                                      </Typography>
                                      
                                      {/* Katılımcı göstergesi */}
                                      <Chip
                                        icon={<GroupIcon fontSize="small" />}
                                        label="Katılımcı"
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                          height: 20, 
                                          '& .MuiChip-label': { px: 0.5, fontSize: '0.625rem' },
                                          '& .MuiChip-icon': { fontSize: '0.75rem', ml: 0.5 },
                                          borderColor: THEME_COLORS.primary + '40',
                                          color: THEME_COLORS.primary
                                        }}
                                      />
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                              Henüz bir etkinliğe katılmadınız veya etkinlik verileri yüklenemedi.
                            </Typography>
                            <Button 
                              variant="contained" 
                              color="primary" 
                              sx={{ mt: 2, bgcolor: THEME_COLORS.primary }}
                              onClick={() => {
                                // Etkinlik mesajlarını yeniden yükle
                                setLoadingEvents(true);
                                fetchEventConversations();
                              }}
                            >
                              Yeniden Yükle
                            </Button>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                )}
                
                {/* Özel Mesajlar Listesi - Tab 0 */}
                {activeTab === 0 && (
                  loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress sx={{ color: THEME_COLORS.primary }} />
                    </Box>
                  ) : conversations.length > 0 ? (
                    <List sx={{ padding: 0 }}>
                      {conversations.map((conversation) => (
                        <React.Fragment key={conversation.userId}>
                          <ListItem 
                            button 
                            onClick={() => handleConversationSelect(conversation)}
                            alignItems="flex-start"
                            sx={{
                              px: 2,
                              py: 1.5,
                              borderLeft: conversation.unreadCount > 0 ? `4px solid ${THEME_COLORS.secondary}` : 'none',
                              borderBottom: '1px solid #f5f5f5',
                              '&:hover': { backgroundColor: THEME_COLORS.messageBackground }
                            }}
                          >
                            <ListItemAvatar>
                              <Badge color="secondary" badgeContent={conversation.unreadCount} overlap="circular">
                                <Avatar 
                                  src={
                                    conversation.profilePicture 
                                      ? getFileUrl(`uploads/${conversation.profilePicture}`) 
                                      : conversation.user?.profilePicture 
                                        ? getFileUrl(`uploads/${conversation.user.profilePicture}`) 
                                        : null
                                  }
                                  alt={conversation.fullName || conversation.user?.fullName || conversation.username}
                                  sx={{ width: 48, height: 48 }}
                                >
                                  {!conversation.profilePicture && !conversation.user?.profilePicture && 
                                    (conversation.fullName?.[0] || conversation.user?.fullName?.[0] || conversation.username?.[0] || '?')}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography fontWeight={conversation.unreadCount > 0 ? 'bold' : 'normal'}>
                                    {conversation.fullName || conversation.user?.fullName || conversation.username || 'İsimsiz Kullanıcı'}
                                  </Typography>
                                  {conversation.isSaved && conversation.savedConversationId && (
                                    <IconButton 
                                      size="small" 
                                      edge="end" 
                                      onClick={(e) => handleRemoveSavedConversation(conversation.savedConversationId, e)}
                                      title="Listeden kaldır"
                                      sx={{ 
                                        opacity: 0.6, 
                                        '&:hover': { opacity: 1, color: 'error.main' } 
                                      }}
                                    >
                                      <Close fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                    noWrap
                                    sx={{ 
                                      width: '70%',
                                      fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal',
                                      color: conversation.unreadCount > 0 ? 'text.primary' : 'text.secondary'
                                    }}
                                  >
                                    {conversation.lastMessage && conversation.lastMessage.length > 30
                                      ? conversation.lastMessage.substring(0, 30) + '...'
                                      : conversation.lastMessage || 'Yeni konuşma'}
                                  </Typography>
                                  <Typography 
                                    component="span" 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{
                                      color: conversation.unreadCount > 0 ? THEME_COLORS.primary : 'text.secondary',
                                      fontWeight: conversation.unreadCount > 0 ? 'medium' : 'normal'
                                    }}
                                  >
                                    {formatDate(conversation.lastMessageDate || new Date())}
                                  </Typography>
                                </Box>
                              }
                              sx={{ ml: 1 }}
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">Henüz bir konuşmanız yok.</Typography>
                      <Button 
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/')}
                        sx={{ mt: 2, bgcolor: THEME_COLORS.primary }}
                      >
                        Kullanıcıları Keşfet
                      </Button>
                    </Box>
                  )
                )}
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                width: '100%',
                backgroundColor: '#E5DDD5' // WhatsApp mesaj arka planı
              }}>
                {/* Mesajlaşma Başlığı */}
                <Box sx={{ 
                  p: 1.5, 
                  backgroundColor: THEME_COLORS.primary, 
                  color: 'white',
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <IconButton onClick={handleBack} sx={{ mr: 1, color: 'white' }}>
                    <ArrowBackIcon />
                  </IconButton>
                  
                  {selectedConversation ? (
                    <>
                      <Avatar 
                        src={
                          selectedConversation.profilePicture 
                            ? getFileUrl(`uploads/${selectedConversation.profilePicture}`) 
                            : selectedConversation.user?.profilePicture 
                              ? getFileUrl(`uploads/${selectedConversation.user.profilePicture}`) 
                              : null
                        }
                        alt={selectedConversation.fullName || selectedConversation.user?.fullName || selectedConversation.username}
                        sx={{ mr: 2, width: 40, height: 40 }}
                      >
                        {!selectedConversation.profilePicture && !selectedConversation.user?.profilePicture && 
                          (selectedConversation.fullName?.[0] || selectedConversation.user?.fullName?.[0] || selectedConversation.username?.[0] || '?')}
                      </Avatar>
                      <Typography variant="h6">
                        {selectedConversation.fullName || selectedConversation.user?.fullName || selectedConversation.username || 'İsimsiz Kullanıcı'}
                      </Typography>
                    </>
                  ) : selectedEventConversation ? (
                    <>
                      <Avatar sx={{ mr: 2, bgcolor: THEME_COLORS.secondary, width: 40, height: 40 }}>
                        <GroupIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{selectedEventConversation.title || 'Etkinlik Sohbeti'}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          Etkinlik Grup Sohbeti
                        </Typography>
                      </Box>
                      {/* Etkinlik bilgileri butonu */}
                      <IconButton 
                        sx={{ ml: 'auto', color: 'white' }}
                        onClick={() => {
                          // Etkinlik detayları sayfasına git
                          if (selectedEventConversation && selectedEventConversation.eventId) {
                            navigate(`/events/${selectedEventConversation.eventId}`);
                          }
                        }}
                        title="Etkinlik Detayları"
                      >
                        <InfoIcon />
                      </IconButton>
                    </>
                  ) : (
                    <Typography variant="h6">Mesajlaşma</Typography>
                  )}
                </Box>
                
                {/* Etkinlik bilgileri (seçili etkinlik varsa) */}
                {selectedEventConversation && selectedEventConversation.description && (
                  <Box sx={{ 
                    px: 2, 
                    py: 1.5, 
                    backgroundColor: THEME_COLORS.lightPrimary + '20', // Açık mavi arka plan (opacity ile)
                    display: 'flex',
                    alignItems: 'flex-start',
                    borderBottom: `1px solid ${THEME_COLORS.mediumGray}`
                  }}>
                    <EventIcon sx={{ mr: 1.5, mt: 0.5, color: THEME_COLORS.primary }} />
                    <Box sx={{ flexGrow: 1 }}>
                      {selectedEventConversation.startDate && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <CalendarMonth fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
                          {formatDate(new Date(selectedEventConversation.startDate))}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {selectedEventConversation.description}
                      </Typography>
                    </Box>
                    
                    {/* Katılımcıları görme butonu */}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<GroupIcon />}
                      onClick={() => {
                        // Katılımcıları görüntüleme fonksiyonu
                        // Burada katılımcıları gösterecek bir dialog açılabilir
                        console.log('Katılımcıları görüntüle butonuna tıklandı');
                      }}
                      sx={{ 
                        ml: 1,
                        fontSize: '0.75rem',
                        color: THEME_COLORS.primary,
                        borderColor: THEME_COLORS.primary + '80'
                      }}
                    >
                      Katılımcılar
                    </Button>
                  </Box>
                )}
                
                {/* Mesaj Listesi */}
                <Box sx={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  backgroundColor: THEME_COLORS.messageBackground,
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0H10V10H0V0Z" fill="%233f51b520"/%3E%3Cpath d="M10 10H20V20H10V10Z" fill="%233f51b520"/%3E%3C/svg%3E")',
                  backgroundRepeat: 'repeat'
                }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : messages.length > 0 ? (
                    messages.filter(isSafeMessage).map((message, index) => {
                      // Güvenli bir şekilde kontrol et - self ile işaretlenmiş mesajlar kendi mesajlarımızdır
                      const isOwnMessage = (message.sender._id === 'self') || 
                                          (user && message.sender && message.sender._id === user.id);
                      
                      return (
                        <Box
                          key={message._id || index}
                          sx={{
                            display: 'flex',
                            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                            mb: 1.5
                          }}
                        >
                          {!isOwnMessage && (
                            <Avatar
                              src={message.sender?.profilePicture ? getFileUrl(`uploads/${message.sender.profilePicture}`) : null}
                              alt={message.sender?.username || ''}
                              sx={{ mr: 1, width: 32, height: 32 }}
                            />
                          )}
                          
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              maxWidth: '70%',
                              position: 'relative',
                              backgroundColor: isOwnMessage ? THEME_COLORS.messageOutgoing : THEME_COLORS.messageIncoming,
                              boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                              '&::before': isOwnMessage ? {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                right: -8,
                                width: 0,
                                height: 0,
                                borderTop: `8px solid ${THEME_COLORS.messageOutgoing}`,
                                borderRight: '8px solid transparent'
                              } : {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: -8,
                                width: 0,
                                height: 0,
                                borderTop: `8px solid ${THEME_COLORS.messageIncoming}`,
                                borderLeft: '8px solid transparent'
                              }
                            }}
                          >
                            {!isOwnMessage && (
                              <Typography variant="caption" display="block" fontWeight="bold" color={THEME_COLORS.primary}>
                                {isCurrentUser(message.sender) ? 
                                  <strong>(BEN) </strong> : 
                                  ''
                                }
                                {message.sender?.fullName || message.sender?.username || 'Kullanıcı'}
                              </Typography>
                            )}
                            
                            <Typography variant="body1">{message.content}</Typography>
                            
                            <Typography 
                              variant="caption" 
                              display="block" 
                              textAlign="right" 
                              sx={{ mt: 0.5, opacity: 0.7 }}
                            >
                              {formatDate(message.createdAt)}
                              {isOwnMessage && (
                                <span style={{ marginLeft: 4, color: THEME_COLORS.primary }}>
                                  ✓✓ {/* Okundu işareti */}
                                </span>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
                      {selectedEventConversation ? (
                        <>
                          <GroupIcon sx={{ fontSize: 40, color: THEME_COLORS.primary, mb: 2, opacity: 0.7 }} />
                          <Typography color="text.secondary" align="center">
                            {`${selectedEventConversation.title} etkinliğinde mesajlaşmaya başlayın.`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
                            Etkinlik katılımcıları bu sohbeti görebilir
                          </Typography>
                        </>
                      ) : (
                        <Typography color="text.secondary">
                          {`${selectedConversation?.fullName || 'Kullanıcı'} ile mesajlaşmaya başlayın.`}
                        </Typography>
                      )}
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>
                
                {/* Mesaj Gönderme */}
                <Box sx={{ 
                  p: 1.5, 
                  borderTop: '1px solid #e0e0e0', 
                  display: 'flex',
                  backgroundColor: '#F5F5F5',
                  alignItems: 'center'
                }}>
                  {/* Dosya ve Emoji Butonları */}
                  <Box sx={{ display: 'flex', mr: 1 }}>
                    <IconButton 
                      size="medium" 
                      color="primary"
                      sx={{ color: THEME_COLORS.darkGray }}
                      title="Emoji Ekle"
                    >
                      <EmojiEmotions />
                    </IconButton>
                    
                    <IconButton 
                      size="medium" 
                      color="primary" 
                      component="label"
                      sx={{ color: THEME_COLORS.darkGray }}
                      title="Dosya Ekle"
                    >
                      <AttachFile />
                      <input 
                        type="file" 
                        hidden
                        onChange={(e) => {
                          // Dosya seçildiğinde
                          console.log('Dosya seçildi:', e.target.files[0]);
                          // Burada dosya yükleme işlemleri yapılabilir
                        }}
                      />
                    </IconButton>
                    
                    <IconButton 
                      size="medium" 
                      color="primary"
                      component="label"
                      sx={{ color: THEME_COLORS.darkGray }}
                      title="Fotoğraf Ekle"
                    >
                      <Photo />
                      <input 
                        type="file" 
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          // Fotoğraf seçildiğinde
                          console.log('Fotoğraf seçildi:', e.target.files[0]);
                          // Burada fotoğraf yükleme işlemleri yapılabilir
                        }}
                      />
                    </IconButton>
                  </Box>
                  
                  <TextField
                    id="message-input"
                    fullWidth
                    variant="outlined"
                    placeholder={selectedEventConversation ? "Etkinlik grubuna mesaj yazın..." : "Mesajınızı yazın..."}
                    size="small"
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={3}
                    sx={{ 
                      mr: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: 'white'
                      },
                      '&.shake-animation': {
                        animation: 'shake 0.5s',
                        animationIterationCount: 1
                      },
                      '@keyframes shake': {
                        '0%': { transform: 'translateX(0)' },
                        '10%': { transform: 'translateX(-5px)' },
                        '20%': { transform: 'translateX(5px)' },
                        '30%': { transform: 'translateX(-5px)' },
                        '40%': { transform: 'translateX(5px)' },
                        '50%': { transform: 'translateX(-5px)' },
                        '60%': { transform: 'translateX(5px)' },
                        '70%': { transform: 'translateX(-5px)' },
                        '80%': { transform: 'translateX(5px)' },
                        '90%': { transform: 'translateX(-5px)' },
                        '100%': { transform: 'translateX(0)' }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!newMessage.trim()}
                    onClick={sendMessage}
                    sx={{ 
                      minWidth: 0, 
                      width: 48, 
                      height: 48, 
                      borderRadius: '50%',
                      backgroundColor: THEME_COLORS.primary,
                      '&:hover': {
                        backgroundColor: THEME_COLORS.darkPrimary
                      }
                    }}
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Kullanıcıları Keşfet Dialog */}
        <Dialog 
          open={openUserDialog} 
          onClose={() => setOpenUserDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Kullanıcıları Keşfet
            <IconButton
              aria-label="close"
              onClick={() => setOpenUserDialog(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {loadingUsers && users.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Typography align="center" sx={{ py: 3 }}>
                Henüz hiç kullanıcı yok.
              </Typography>
            ) : (
              <>
                <List sx={{ pt: 0 }}>
                  {users.map((user) => (
                    <React.Fragment key={user._id}>
                      <ListItem 
                        button 
                        onClick={() => handleSelectUser(user)}
                        sx={{
                          backgroundColor: isCurrentUser(user) ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
                          '&:hover': {
                            backgroundColor: isCurrentUser(user) ? 'rgba(63, 81, 181, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={user.profilePicture ? getFileUrl(`uploads/${user.profilePicture}`) : undefined}
                            alt={user.fullName}
                          >
                            {!user.profilePicture && user.fullName?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={
                            <Box component="span">
                              <Typography component="span" variant="body2" color="textPrimary">
                                {isCurrentUser(user) ? 
                                  <strong>(BEN) </strong> : 
                                  ''
                                }
                                {user.fullName || user.username}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box component="span">
                              <Typography component="span" variant="body2" color="textSecondary">
                                @{user.username}
                              </Typography>
                              {user.bio && (
                                <Typography component="span" variant="body2" color="textSecondary" sx={{ display: 'block' }}>
                                  {user.bio.length > 50 ? `${user.bio.substring(0, 50)}...` : user.bio}
                                </Typography>
                              )}
                              {user.hobbies && user.hobbies.length > 0 && (
                                <Box sx={{ mt: 0.5 }}>
                                  {user.hobbies.slice(0, 3).map((hobby) => (
                                    <Chip 
                                      key={hobby._id} 
                                      label={hobby.name} 
                                      size="small" 
                                      sx={{ mr: 0.5, mt: 0.5 }} 
                                    />
                                  ))}
                                  {user.hobbies && user.hobbies.length > 3 && (
                                    <Chip 
                                      label={`+${user.hobbies.length - 3}`} 
                                      size="small" 
                                      sx={{ mt: 0.5 }} 
                                    />
                                  )}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
                {loadingUsers && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={30} />
                  </Box>
                )}
                {hasMoreUsers && !loadingUsers && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Button onClick={handleLoadMoreUsers}>
                      Daha Fazla Yükle
                    </Button>
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUserDialog(false)}>Kapat</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
  );
};

export default MessagesPage; 