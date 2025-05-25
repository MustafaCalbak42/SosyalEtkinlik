import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Container, Tab, Tabs, Typography, Avatar, TextField, Button, Paper, Badge, List, ListItem, ListItemAvatar, ListItemText, Divider, IconButton, CircularProgress, Chip, Alert } from '@mui/material';
import { Send as SendIcon, ArrowBack as ArrowBackIcon, Group as GroupIcon, Event as EventIcon, Refresh as RefreshIcon, CalendarMonth, Info as InfoIcon, EmojiEmotions, AttachFile, Photo, Close } from '@mui/icons-material';
import io from 'socket.io-client';
import axios from 'axios';
import MainLayout from '../components/MainLayout';

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
    });
    
    // Özel mesajları dinle
    newSocket.on('private_message', (message) => {
      if (!message || !message.sender) return;
      
      // Eğer açık olan konuşmaya aitse, mesajı ekle
      if (selectedConversation && 
          (message.sender._id === selectedConversation._id || 
           message.recipient._id === selectedConversation._id)) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
      
      // Konuşma listesini güncelle
      fetchConversations();
    });
    
    // Etkinlik mesajlarını dinle
    newSocket.on('event_message', (message) => {
      if (!message || !message.event) return;
      
      // Eğer açık olan etkinlik konuşmasına aitse, mesajı ekle
      if (selectedEventConversation && message.event._id === selectedEventConversation.eventId) {
        setMessages(prevMessages => [...prevMessages, message]);
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
        return;
      }
      
      console.log('Konuşmalar yükleniyor, token:', currentToken ? 'Mevcut' : 'Yok');
      
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Konuşmalar yüklenirken hata:', error);
      
      // 401 hatası kontrolü
      if (error.response && error.response.status === 401) {
        console.log('Token geçersiz veya süresi dolmuş, konuşmalar yüklenemedi');
      }
      
      // Hata durumunda boş dizi ile devam et
      setConversations([]);
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
        return;
      }
      
      try {
        // API isteği yap
        const response = await axios.get(
          `${API_URL.replace('/messages', '')}/users/participated-events`, 
          {
            headers: { 
              Authorization: `Bearer ${currentToken}`
            }
          }
        );
        
        console.log('API yanıtı:', response.data);
        
        if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          // API'den gelen verileri işle
          const events = response.data.data.map(event => ({
            eventId: event._id,
            title: event.title || 'İsimsiz Etkinlik',
            description: event.description || '',
            startDate: event.startDate || null,
            unreadCount: Math.floor(Math.random() * 3) // Rastgele okunmamış mesaj sayısı
          }));
          
          console.log(`${events.length} etkinlik bulundu:`, events);
          setEventConversations(events);
        } else {
          console.log('Etkinlik bulunamadı, test etkinlikleri gösteriliyor');
          setEventConversations(testEvents);
        }
      } catch (apiError) {
        console.error('API hatası:', apiError);
        setEventConversations(testEvents);
      }
    } catch (error) {
      console.error('Genel hata:', error);
      setEventConversations([
        {
          eventId: "error-event",
          title: "Hata Durumu Test Etkinliği",
          description: "Bir hata oluştu, ancak bu test etkinliği gösterilebiliyor.",
          startDate: new Date().toISOString(),
          unreadCount: 1
        }
      ]);
    } finally {
      setLoadingEvents(false);
    }
  };
  
  // Sayfa yüklendiğinde konuşmaları getir
  useEffect(() => {
    if (!token) {
      console.log('Token bulunamadı, mesajlar yüklenemedi');
      return;
    }
    
    console.log('Mesaj sayfası yükleniyor, token:', token ? 'Mevcut' : 'Yok');
    
    setLoading(true);
    
    // Her iki mesaj türünü de yükle
    const loadAllMessages = async () => {
      try {
        await fetchConversations();
        // Aktif tab etkinlik sekmesiyse, etkinlikleri de yükle
        if (activeTab === 1) {
          await fetchEventConversations();
        }
      } catch (error) {
        console.error('Mesajlar yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllMessages();
    
  }, [token, activeTab]);
  
  // Kullanıcı mesajlarını yükle
  const fetchUserMessages = async (userId) => {
    try {
      setLoading(true);
      
      // Token kontrolü
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.error('Token bulunamadı, mesajlar yüklenemedi');
        return;
      }
      
      const response = await axios.get(`${API_URL}/messages/private/${userId}`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      setMessages(response.data.data || []);
      
      // Seçili konuşmayı ayarla
      const conversation = conversations.find(c => c.userId === userId);
      setSelectedConversation(conversation);
      setSelectedEventConversation(null);
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error);
      
      // 401 hatası kontrolü
      if (error.response && error.response.status === 401) {
        console.log('Token geçersiz veya süresi dolmuş, mesajlar yüklenemedi');
      }
      
      // Hata durumunda boş mesaj listesi ile devam et
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Etkinlik mesajlarını yükle
  const fetchEventMessages = async (eventId) => {
    try {
      setLoading(true);
      
      // Token kontrolü
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.error('Token bulunamadı, etkinlik mesajları yüklenemedi');
        return;
      }
      
      const response = await axios.get(`${API_URL}/messages/event/${eventId}`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      setMessages(response.data.data || []);
      
      // Seçili etkinlik konuşmasını ayarla
      const eventConversation = eventConversations.find(c => c.eventId === eventId);
      setSelectedEventConversation(eventConversation);
      setSelectedConversation(null);
      
      // Etkinlik odasına katıl
      if (socket) {
        socket.emit('join_event', eventId);
      }
    } catch (error) {
      console.error('Etkinlik mesajları yüklenirken hata:', error);
      
      // 401 hatası kontrolü
      if (error.response && error.response.status === 401) {
        console.log('Token geçersiz veya süresi dolmuş, etkinlik mesajları yüklenemedi');
      }
      
      // Hata durumunda boş mesaj listesi ile devam et
      setMessages([]);
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
    
    try {
      // Token kontrolü
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        setError('Oturum bilginiz bulunamadı. Lütfen yeniden giriş yapın.');
        return;
      }
      
      if (selectedConversation && selectedConversation.userId) {
        console.log('Özel mesaj gönderiliyor:', selectedConversation.userId);
        // Özel mesaj gönder
        if (socket) {
          socket.emit('private_message', {
            recipientId: selectedConversation.userId,
            content: newMessage
          });
          
          // Mesajı hemen görüntüle (optimistik UI güncelleme)
          const tempMessage = {
            _id: Date.now().toString(),
            sender: { _id: 'self' }, // Giden mesajları tanımlamak için geçici ID
            content: newMessage,
            createdAt: new Date().toISOString()
          };
          setMessages(prevMessages => [...prevMessages, tempMessage]);
        } else {
          // Socket bağlantısı yoksa HTTP API'yi kullan (yedek yöntem)
          const response = await axios.post(`${API_URL}/messages/private`, {
            recipientId: selectedConversation.userId,
            content: newMessage
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
          socket.emit('event_message', {
            eventId: selectedEventConversation.eventId,
            content: newMessage
          });
          
          // Mesajı hemen görüntüle (optimistik UI güncelleme)
          const tempMessage = {
            _id: Date.now().toString(),
            sender: { _id: 'self' }, // Giden mesajları tanımlamak için geçici ID
            content: newMessage,
            createdAt: new Date().toISOString()
          };
          setMessages(prevMessages => [...prevMessages, tempMessage]);
        } else {
          // Socket bağlantısı yoksa HTTP API'yi kullan (yedek yöntem)
          const response = await axios.post(`${API_URL}/messages/event`, {
            eventId: selectedEventConversation.eventId,
            content: newMessage
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
      
      setNewMessage('');
      setError(''); // Başarılı işlemde hata mesajını temizle
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      
      if (handleAuthError(error.response)) {
        return; // 401 hatası zaten ele alındı
      }
      
      // Diğer hatalar için
      setError('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
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
    setActiveTab(newValue);
    setSelectedConversation(null);
    setSelectedEventConversation(null);
    setMessages([]);
    
    if (newValue === 0) {
      // Özel mesajları yükle
      fetchConversations();
    } else if (newValue === 1) {
      // Etkinlik mesajlarını yükle
      fetchEventConversations();
    }
  };
  
  // Konuşma seçildiğinde
  const handleConversationSelect = (conversation) => {
    fetchUserMessages(conversation.userId);
  };
  
  // Etkinlik konuşması seçildiğinde
  const handleEventConversationSelect = (eventConversation) => {
    fetchEventMessages(eventConversation.eventId);
  };
  
  // Geri tuşuna basıldığında
  const handleBack = () => {
    // Eğer etkinlik konuşmasından çıkılıyorsa, odadan ayrıl
    if (selectedEventConversation && socket) {
      socket.emit('leave_event', selectedEventConversation.eventId);
    }
    
    setSelectedConversation(null);
    setSelectedEventConversation(null);
    setMessages([]);
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
  
  return (
    <MainLayout>
      <Paper sx={{ 
        p: 0, 
        mb: 2, 
        height: '80vh', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderRadius: 2 
      }}>
        {/* Üst başlık */}
        <Box sx={{ 
          p: 1.5, 
          borderBottom: '1px solid #e0e0e0', 
          backgroundColor: THEME_COLORS.primary, 
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Typography variant="h6" fontWeight="medium">Mesajlar</Typography>
          
          {/* Tablar */}
          <Box sx={{ ml: 3, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              textColor="inherit"
              TabIndicatorProps={{ style: { backgroundColor: 'white' } }}
            >
              <Tab 
                label="Özel Mesajlar" 
                sx={{ 
                  color: 'white', 
                  opacity: activeTab === 0 ? 1 : 0.7,
                  fontWeight: activeTab === 0 ? 'bold' : 'normal' 
                }} 
              />
              <Tab 
                label="Etkinlik Sohbetleri" 
                sx={{ 
                  color: 'white', 
                  opacity: activeTab === 1 ? 1 : 0.7,
                  fontWeight: activeTab === 1 ? 'bold' : 'normal' 
                }} 
              />
            </Tabs>
            
            {/* Yenile butonu */}
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<RefreshIcon fontSize="small" />}
              sx={{ 
                ml: 2, 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
              onClick={() => {
                if (activeTab === 0) {
                  fetchConversations();
                } else {
                  fetchEventConversations();
                }
              }}
            >
              Yenile
            </Button>
          </Box>
        </Box>
        
        {/* Hata mesajı alanı */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={handleRefreshSession}
              >
                Yeniden Giriş Yap
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        {/* Etkinlik sekmesi bilgi kısmı */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', mx: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" color="text.secondary">
                Katıldığınız Etkinlik Sohbetleri
              </Typography>
              <Button 
                size="small" 
                color="primary" 
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  // Etkinlik konuşmalarını yeniden yükle
                  setLoadingEvents(true);
                  fetchEventConversations();
                  
                  // Kullanıcı etkinliklerini kontrol et
                  checkUserEvents();
                }}
              >
                Yenile
              </Button>
            </Box>
            
            <Box sx={{ 
              backgroundColor: '#DCF8C6', // WhatsApp açık yeşil
              p: 1.5, 
              borderRadius: 2, 
              mb: 1,
              border: '1px solid #c5e1a5'
            }}>
              <Typography variant="body2" sx={{ color: '#455A64' }}>
                <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1, color: '#075E54' }} />
                Bu sekmede katıldığınız tüm etkinliklerin grup sohbetleri listelenir. Etkinliğe katıldığınızda otomatik olarak etkinlik sohbetine dahil olursunuz.
              </Typography>
            </Box>
          </Box>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          flexGrow: 1,
          overflow: 'hidden',
          backgroundColor: '#f5f5f5' // WhatsApp arka plan rengi
        }}>
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
                                src={conversation.profilePicture ? `${API_URL}/uploads/${conversation.profilePicture}` : null}
                                alt={conversation.fullName}
                                sx={{ width: 48, height: 48 }}
                              />
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography fontWeight={conversation.unreadCount > 0 ? 'bold' : 'normal'}>
                                {conversation.fullName}
                              </Typography>
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
                                  {conversation.lastMessage.length > 30
                                    ? conversation.lastMessage.substring(0, 30) + '...'
                                    : conversation.lastMessage}
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
                                  {formatDate(conversation.lastMessageDate)}
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
                      src={selectedConversation.profilePicture ? `${API_URL}/uploads/${selectedConversation.profilePicture}` : null}
                      alt={selectedConversation.fullName}
                      sx={{ mr: 2, width: 40, height: 40 }}
                    />
                    <Typography variant="h6">{selectedConversation.fullName}</Typography>
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
                            src={message.sender?.profilePicture ? `${API_URL}/uploads/${message.sender.profilePicture}` : null}
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
                  fullWidth
                  variant="outlined"
                  placeholder={selectedEventConversation ? "Etkinlik grubuna mesaj yazın..." : "Mesajınızı yazın..."}
                  size="small"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  multiline
                  maxRows={3}
                  sx={{ 
                    mr: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white'
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
      </Paper>
    </MainLayout>
  );
};

export default MessagesPage; 