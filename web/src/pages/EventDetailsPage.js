import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Button, 
  Avatar, 
  Chip, 
  CircularProgress, 
  Alert,
  IconButton,
  CardMedia,
  Stack,
  AvatarGroup,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import { 
  AccessTime, 
  LocationOn, 
  PeopleAlt, 
  ArrowBack, 
  Share, 
  Bookmark, 
  MonetizationOn, 
  Category,
  Close
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Navbar from '../components/Layout/Navbar';
import { getEventById, joinEvent, leaveEvent } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/Users/UserProfileModal';

// Convert category to color
const getCategoryColor = (category) => {
  const colors = {
    'Spor': '#4caf50',
    'Sanat': '#f44336',
    'Müzik': '#9c27b0',
    'Dans': '#ff9800',
    'Yemek': '#795548',
    'Seyahat': '#2196f3',
    'Eğitim': '#607d8b',
    'Teknoloji': '#00bcd4',
    'Doğa': '#8bc34a',
    'Diğer': '#9e9e9e'
  };
  
  return colors[category] || '#9e9e9e';
};

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  
  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);
  
  const fetchEventDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log(`Fetching event details for ID: ${eventId}`);
      const response = await getEventById(eventId);
      
      if (response.success && response.data) {
        console.log('Event details loaded:', response.data);
        
        // Normalize participant data to ensure consistency between web and mobile
        const eventData = normalizeEventData(response.data);
        setEvent(eventData);
        
        // Check if current user is a participant
        if (user && eventData.participants) {
          const participating = eventData.participants.some(
            p => {
              // Handle different participant data formats
              if (typeof p === 'object') {
                return (p._id === user._id) || 
                       (p.user && (p.user._id === user._id || p.user === user._id));
              }
              return p === user._id;
            }
          );
          setIsParticipant(participating);
        }
      } else {
        setError(response.message || 'Etkinlik bilgileri yüklenemedi');
      }
    } catch (err) {
      console.error('Error loading event details:', err);
      setError('Etkinlik bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Normalize event data to ensure consistency between web and mobile
  const normalizeEventData = (eventData) => {
    if (!eventData) return null;
    
    // Create a copy of the event data
    const normalizedEvent = { ...eventData };
    
    // If formattedParticipants exists, use it as the primary participant data
    if (eventData.formattedParticipants && Array.isArray(eventData.formattedParticipants)) {
      console.log('Using formattedParticipants array for consistent data format');
      normalizedEvent.participants = eventData.formattedParticipants;
    } 
    // If regular participants array exists but in participant.user format
    else if (eventData.participants && Array.isArray(eventData.participants)) {
      console.log('Normalizing participants array format');
      // Transform the participants into a consistent format
      normalizedEvent.participants = eventData.participants.map(participant => {
        // If participant is already in the expected format
        if (typeof participant === 'object' && participant._id) {
          return participant;
        }
        // If participant is in the user object format
        else if (typeof participant === 'object' && participant.user) {
          if (typeof participant.user === 'object') {
            return {
              _id: participant.user._id,
              username: participant.user.username,
              fullName: participant.user.fullName,
              profilePicture: participant.user.profilePicture,
              joinedAt: participant.joinedAt
            };
          } else {
            // If participant.user is just an ID
            return {
              _id: participant.user,
              fullName: 'Katılımcı',
              joinedAt: participant.joinedAt
            };
          }
        }
        // If participant is just an ID string
        else if (typeof participant === 'string') {
          return {
            _id: participant,
            fullName: 'Katılımcı'
          };
        }
        
        // Fallback for any other format
        return participant;
      });
    }
    
    console.log(`Normalized ${normalizedEvent.participants?.length || 0} participants`);
    return normalizedEvent;
  };
  
  const handleJoinEvent = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Etkinliğe katılmak için önce giriş yapmalısınız' }});
      return;
    }
    
    setJoining(true);
    
    try {
      const response = isParticipant 
        ? await leaveEvent(eventId) 
        : await joinEvent(eventId);
        
      if (response.success) {
        // Update local state
        setIsParticipant(!isParticipant);
        // Reload event details to get updated participants list
        fetchEventDetails();
      } else {
        setError(response.message || 'İşlem gerçekleştirilemedi');
      }
    } catch (err) {
      console.error('Error joining/leaving event:', err);
      setError('İşlem gerçekleştirilirken bir hata oluştu');
    } finally {
      setJoining(false);
    }
  };
  
  const handleParticipantClick = (participant) => {
    console.log('Participant clicked:', participant);
    
    // If participant is null or undefined, don't proceed
    if (!participant) {
      console.error('Invalid participant data: null or undefined');
      return;
    }
    
    let participantId;
    let participantData = null;
    
    // Extract the ID properly depending on the format
    // Our normalized data should have consistent format with _id field
    if (typeof participant === 'string') {
      participantId = participant;
      // For string participants, create minimal fallback data
      participantData = {
        _id: participant,
        fullName: 'Katılımcı',
        username: null,
        profilePicture: null
      };
    } else if (participant?._id) {
      participantId = participant._id;
      // Store participant data to use as fallback
      participantData = {
        _id: participant._id,
        fullName: participant.fullName || participant.username || 'Katılımcı',
        username: participant.username,
        profilePicture: participant.profilePicture,
        joinedAt: participant.joinedAt
      };
    } else if (participant?.id) {
      participantId = participant.id;
      participantData = { 
        _id: participant.id,
        ...participant 
      };
    } else if (participant?.user && typeof participant.user === 'object') {
      participantId = participant.user._id;
      participantData = {
        _id: participant.user._id,
        fullName: participant.user.fullName || participant.user.username || 'Katılımcı',
        username: participant.user.username,
        profilePicture: participant.user.profilePicture,
        joinedAt: participant.joinedAt
      };
    } else if (participant?.user && typeof participant.user === 'string') {
      participantId = participant.user;
      // For string user references, create minimal fallback data
      participantData = {
        _id: participant.user,
        fullName: 'Katılımcı',
        username: null,
        profilePicture: null,
        joinedAt: participant.joinedAt
      };
    } else {
      console.error('Could not determine participant ID format:', participant);
      // Create minimal fallback data for unknown formats
      participantData = {
        _id: 'unknown',
        fullName: typeof participant === 'object' && participant.name ? participant.name : 'Katılımcı',
        username: null,
        profilePicture: null
      };
    }
    
    // Make sure the ID is a string
    if (participantId && typeof participantId !== 'string') {
      participantId = participantId.toString();
    }
    
    // Debug - log the extracted ID
    console.log(`Opening profile modal for participant ID: ${participantId} (${typeof participantId})`);
    
    // Check if this is a valid MongoDB ObjectId format
    const isValidObjectId = participantId && participantId.match(/^[0-9a-fA-F]{24}$/);
    if (isValidObjectId) {
      console.log('This appears to be a valid MongoDB ObjectId format');
    } else {
      console.log('This does NOT appear to be a valid MongoDB ObjectId format');
      
      // If ID is invalid, we'll rely solely on participantData
      if (!participantId || participantId === 'unknown') {
        console.log('Using only fallback data without API call');
      }
    }
    
    setSelectedParticipant({
      id: isValidObjectId ? participantId : null,
      data: participantData
    });
    setProfileModalOpen(true);
  };
  
  const handleCloseProfileModal = () => {
    setProfileModalOpen(false);
    setSelectedParticipant(null);
  };
  
  // Helper functions to format data
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP', { locale: tr });
    } catch {
      return 'Tarih belirsiz';
    }
  };
  
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm', { locale: tr });
    } catch {
      return '--:--';
    }
  };
  
  const getLocationString = () => {
    if (!event) return 'Konum belirsiz';
    
    if (event.location) {
      if (typeof event.location === 'string') {
        return event.location;
      }
      if (typeof event.location === 'object' && event.location.address) {
        return event.location.address;
      }
    }
    
    return event.address || 'Konum belirtilmemiş';
  };
  
  const getEventCategory = () => {
    if (!event) return 'Diğer';
    
    if (event.hobby && typeof event.hobby === 'object') {
      return event.hobby.category;
    }
    
    return event.category || 'Diğer';
  };
  
  const getParticipantCount = () => {
    if (!event) return 0;
    
    if (event.participants && Array.isArray(event.participants)) {
      return event.participants.length;
    }
    
    return event.attendees || 0;
  };
  
  const getMaxParticipants = () => {
    if (!event) return 0;
    
    return event.maxParticipants || event.maxAttendees || 'Sınırsız';
  };
  
  // Etkinlik görsel URL'si formatla - HomePage ile aynı akıllı sistem
  const getEventImage = () => {
    if (!event) return 'https://via.placeholder.com/800x400?text=Etkinlik+Resmi';
    
    try {
      // Önce etkinliğin kendi görselini kontrol et
      if (event.image) {
        return event.image;
      }
      
      // Etkinliğin kategorisini al
      const category = getEventCategory();
      
      // Etkinlik başlığı ve açıklamasını küçük harfe çevir
      const title = (event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      const tags = Array.isArray(event.tags) ? event.tags.map(tag => tag.toLowerCase()) : [];
      const hobbyName = event.hobby && typeof event.hobby === 'object' ? (event.hobby.name || '').toLowerCase() : '';
      
      // Tüm içeriği birleştirerek daha güçlü bir arama yap
      const allContent = `${title} ${description} ${tags.join(' ')} ${hobbyName}`;
      
      // Kategori bazlı anahtar kelimeler ve görsel URL'leri - Güncellenmiş ve test edilmiş URL'ler
      const categoryKeywords = {
        // SPOR KATEGORİSİ
        'Spor': {
          'futbol': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'soccer': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'football': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'basketbol': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'basket': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'tenis': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'tennis': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'voleybol': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'volleyball': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'yüzme': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'swimming': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'havuz': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'koşu': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'running': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'bisiklet': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'cycling': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'bicycle': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'golf': 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'yoga': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'boks': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'boxing': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
        },
        
        // MÜZİK KATEGORİSİ
        'Müzik': {
          'gitar': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'guitar': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'piyano': 'https://images.unsplash.com/photo-1552422535-c45813c61732?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'piano': 'https://images.unsplash.com/photo-1552422535-c45813c61732?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'keman': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'violin': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'davul': 'https://images.unsplash.com/photo-1571327073757-af4cf4d52b1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'drums': 'https://images.unsplash.com/photo-1571327073757-af4cf4d52b1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'konser': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'concert': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'dj': 'https://images.unsplash.com/photo-1571266028027-a8bbe87a692d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'rock': 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'caz': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'jazz': 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'klasik müzik': 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'classical music': 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
        },
        
        // SANAT KATEGORİSİ
        'Sanat': {
          'resim': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'painting': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'heykel': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'sculpture': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'fotoğraf': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'photography': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'çizim': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'drawing': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'sergi': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'exhibition': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
        },
        
        // DANS KATEGORİSİ
        'Dans': {
          'bale': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'ballet': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'salsa': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'tango': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'hip hop': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'halk dansları': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'folk dance': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'modern dans': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'modern dance': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
        },
        
        // YEMEK KATEGORİSİ
        'Yemek': {
          'pasta': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'cake': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'kahve': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'barbekü': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'barbecue': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'bbq': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'sushi': 'https://images.unsplash.com/photo-1553621042-f6e147245754?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'türk mutfağı': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'turkish cuisine': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'italyan': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'italian': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
        },
        
        // SEYAHAT KATEGORİSİ
        'Seyahat': {
          'istanbul': 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'kapadokya': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'cappadocia': 'https://images.unsplash.com/photo-1570856033163-05f258ec9481?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'antalya': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'bodrum': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'londra': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'roma': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'rome': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'kamp': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
        },
        
        // TEKNOLOJİ KATEGORİSİ
        'Teknoloji': {
          'yazılım': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'software': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'kod': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'code': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'yapay zeka': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'artificial intelligence': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'ai': 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'robotik': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'robotics': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'robot': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'blockchain': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'bitcoin': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'siber güvenlik': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'cyber security': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
        },
        
        // DOĞA KATEGORİSİ
        'Doğa': {
          'dağ': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'mountain': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'göl': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'lake': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'deniz': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'sea': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'orman': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'forest': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'şelale': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'waterfall': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'mağara': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'cave': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
        },
        
        // EĞİTİM KATEGORİSİ
        'Eğitim': {
          'seminer': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'seminar': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'konferans': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'conference': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'atölye': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'workshop': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'dil': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'language': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'kitap': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'book': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          
          'bilim': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
          'science': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
        }
      };
      
      // Kategori bazlı varsayılan görseller - Detay sayfası için yüksek çözünürlük
      const categoryImages = {
        'Müzik': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        'Spor': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        'Sanat': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        'Dans': 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        'Yemek': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        'Seyahat': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        'Teknoloji': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        'Doğa': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        'Eğitim': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        'Diğer': 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60'
      };
      
      // Kategori bulunamadıysa varsayılan görsel döndür
      if (!category) {
        return categoryImages['Diğer'];
      }
      
      // Kategori alt türleri için anahtar kelimeler varsa kontrol et
      if (categoryKeywords[category]) {
        const keywords = categoryKeywords[category];
        
        // Anahtar kelimeleri ara
        for (const [keyword, imageUrl] of Object.entries(keywords)) {
          if (allContent.includes(keyword)) {
            return imageUrl;
          }
        }
      }
      
      // Alt kategori belirlenemezse ana kategori görseli kullan
      return categoryImages[category] || categoryImages['Diğer'];
    } catch (error) {
      console.error(`[getEventImage] Hata: "${event.title}" için görsel belirlenirken hata oluştu:`, error);
      // Hata durumunda varsayılan olarak genel etkinlik görseli döndür
      return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
    }
  };
  
  const getOrganizerName = () => {
    if (!event) return 'Bilinmeyen';
    
    if (event.organizer) {
      if (typeof event.organizer === 'object') {
        return event.organizer.fullName || event.organizer.username || 'İsimsiz Organizatör';
      }
      return event.organizer;
    }
    
    return 'Bilinmeyen';
  };
  
  // UI Rendering
  if (loading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
            <Button 
              onClick={() => navigate(-1)} 
              color="inherit" 
              size="small" 
              sx={{ ml: 2 }}
            >
              Geri Dön
            </Button>
          </Alert>
        </Container>
      </>
    );
  }
  
  if (!event) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
          <Alert severity="warning" sx={{ mt: 4 }}>
            Etkinlik bulunamadı
            <Button 
              onClick={() => navigate(-1)} 
              color="inherit" 
              size="small" 
              sx={{ ml: 2 }}
            >
              Geri Dön
            </Button>
          </Alert>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 8, pb: 4 }}>
        <Container maxWidth="md">
          {/* Back Button */}
          <Box sx={{ mb: 2 }}>
            <Button 
              startIcon={<ArrowBack />} 
              onClick={() => navigate(-1)}
              sx={{ mb: 2 }}
            >
              Geri
            </Button>
          </Box>
          
          {/* Event Cover Image */}
          <Paper 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              mb: 3,
              position: 'relative'
            }}
          >
            <CardMedia
              component="img"
              height="300"
              image={getEventImage()}
              alt={event.title}
              sx={{ objectFit: 'cover' }}
              onError={(e) => {
                console.error(`[EventDetailsPage] Görsel yüklenemedi: ${getEventImage()}`, e);
                // Hata durumunda varsayılan görsel kullan
                e.target.src = 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
              }}
            />
            
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                display: 'flex', 
                gap: 1 
              }}
            >
              <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}>
                <Share />
              </IconButton>
              <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}>
                <Bookmark />
              </IconButton>
            </Box>
            
            <Chip
              label={getEventCategory()}
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                bgcolor: getCategoryColor(getEventCategory()),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Paper>
          
          <Grid container spacing={3}>
            {/* Event Details */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                  {event.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ mr: 2 }}
                    alt={getOrganizerName()}
                    src={event.organizer?.profilePicture}
                  />
                  <Typography variant="subtitle1">
                    Organizatör: <strong>{getOrganizerName()}</strong>
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      {formatDate(event.startDate || event.date)} • {formatTime(event.startDate || event.date)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      {getLocationString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleAlt sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      {getParticipantCount()} katılımcı / {getMaxParticipants()} kapasite
                    </Typography>
                  </Box>
                  
                  {event.price && Number(event.price) > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MonetizationOn sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography>
                        {event.price} TL
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Category sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      Kategori: {getEventCategory()}
                    </Typography>
                  </Box>
                </Stack>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Etkinlik Açıklaması
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                  {event.description}
                </Typography>
                
                <Box sx={{ mt: 4 }}>
                  <Button 
                    variant="contained" 
                    color={isParticipant ? "error" : "primary"}
                    size="large" 
                    fullWidth
                    disabled={joining}
                    onClick={handleJoinEvent}
                    sx={{ py: 1.5 }}
                  >
                    {joining ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : isParticipant ? (
                      'Etkinlikten Ayrıl'
                    ) : (
                      'Etkinliğe Katıl'
                    )}
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              {/* Organizer Info */}
              <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Organizatör Hakkında
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ width: 64, height: 64, mr: 2 }}
                    alt={getOrganizerName()}
                    src={event.organizer?.profilePicture}
                  />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {getOrganizerName()}
                    </Typography>
                    {event.organizer?.bio && (
                      <Typography variant="body2" color="text.secondary">
                        {event.organizer.bio}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
              
              {/* Participants */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Katılımcılar ({getParticipantCount()})
                </Typography>
                
                {/* Information text about clicking participants */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Katılımcılar hakkında daha fazla bilgi için profil resimlerine tıklayabilirsiniz.
                </Typography>
                
                {event.participants && event.participants.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <AvatarGroup max={10} sx={{ justifyContent: 'center' }}>
                      {event.participants.map((participant, index) => {
                        // Make sure we're handling the participant data consistently
                        const participantId = participant._id || participant;
                        const participantName = 
                          (participant.fullName || participant.username) ||
                          (typeof participant === 'string' ? 'Katılımcı' : 'Katılımcı');
                            
                        return (
                          <Tooltip 
                            key={`avatar-${participantId}-${index}`}
                            title={participantName}
                            arrow
                          >
                            <Avatar 
                              onClick={() => handleParticipantClick(participant)}
                              alt={participantName}
                              src={participant.profilePicture || ''}
                              sx={{ 
                                width: 40, 
                                height: 40,
                                cursor: 'pointer',
                                '&:hover': {
                                  boxShadow: '0 0 0 3px #1976d2',
                                  transform: 'scale(1.1)',
                                  transition: 'all 0.2s ease-in-out'
                                }
                              }}
                            >
                              {(!participant.profilePicture && typeof participantName === 'string') ? 
                                participantName.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                          </Tooltip>
                        );
                      })}
                    </AvatarGroup>
                    
                    {/* Daha fazla katılımcı listesi */}
                    {event.participants.length > 10 && (
                      <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          startIcon={<PeopleAlt />}
                          onClick={() => {
                            // Show a dialog with all participants
                            setShowAllParticipants(true);
                          }}
                        >
                          Tüm Katılımcıları Göster ({event.participants.length})
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Henüz katılımcı yok. İlk katılan sen ol!
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* User Profile Modal */}
      <UserProfileModal
        open={profileModalOpen}
        onClose={handleCloseProfileModal}
        userId={selectedParticipant?.id}
        participantData={selectedParticipant?.data}
      />
      
      {/* All Participants Dialog */}
      <Dialog
        open={showAllParticipants}
        onClose={() => setShowAllParticipants(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Tüm Katılımcılar ({event?.participants?.length || 0})
          <IconButton
            aria-label="close"
            onClick={() => setShowAllParticipants(false)}
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Katılımcı profili hakkında daha fazla bilgi görmek için listedeki kişilere tıklayabilirsiniz.
          </Typography>
          
          {event?.participants && event.participants.length > 0 ? (
            <List sx={{ pt: 0 }}>
              {event.participants.map((participant, index) => {
                // Validate participant - provide fallbacks for missing data
                const isValidParticipant = participant !== null && participant !== undefined;
                
                if (!isValidParticipant) {
                  return (
                    <ListItem 
                      key={`unknown-${index}`}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            width: 50, 
                            height: 50,
                            mr: 1,
                            bgcolor: 'grey.400'
                          }}
                        >
                          ?
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium">
                            Bilinmeyen Katılımcı
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            Kullanıcı bilgisi alınamadı
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                }
                
                // Use consistent data structure with normalized participant data
                const participantId = participant._id || participant;
                const participantName = participant.fullName || participant.username || 'Katılımcı';
                
                // Add joined date info if available
                const joinedDate = participant.joinedAt ? new Date(participant.joinedAt) : null;
                const joinedInfo = joinedDate ? 
                  `Katılma: ${joinedDate.toLocaleDateString('tr-TR')}` : 
                  null;
                  
                return (
                  <ListItem 
                    key={`participant-${participantId}-${index}`}
                    button
                    onClick={() => {
                      handleParticipantClick(participant);
                      setShowAllParticipants(false); // Close this dialog when profile is opened
                    }}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { 
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        alt={participantName}
                        src={participant.profilePicture || ''}
                        sx={{ 
                          width: 50, 
                          height: 50,
                          mr: 1,
                          border: '1px solid #e0e0e0'
                        }}
                      >
                        {!participant.profilePicture && (typeof participantName === 'string' ? 
                          participantName.charAt(0).toUpperCase() : '?')}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={
                        <Typography variant="subtitle1" fontWeight="medium">
                          {participantName}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          {participant.username && (
                            <Typography variant="body2" color="text.secondary" component="div">
                              @{participant.username}
                            </Typography>
                          )}
                          {joinedInfo && (
                            <Typography variant="body2" color="text.secondary" component="div" 
                              sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                              {joinedInfo}
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Henüz katılımcı bulunmuyor.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAllParticipants(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventDetailsPage; 