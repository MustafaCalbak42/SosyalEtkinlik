import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../shared/theme/colors';
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';

const UpcomingEvents = ({ events = [], loading = false, error = '', onRetry }) => {
  const navigation = useNavigation();

  // Yükleme durumu
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary.main} />
        <Text style={styles.loadingText}>Yaklaşan etkinlikler yükleniyor...</Text>
      </View>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Etkinlik yoksa
  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar" size={36} color={colors.text.secondary} />
        <Text style={styles.emptyText}>
          Önümüzdeki 48 saat içinde etkinliğiniz bulunmuyor.
        </Text>
      </View>
    );
  }

  // Kalan süreyi formatla
  const formatTimeUntil = (eventDate) => {
    try {
      if (!eventDate) return '';
      
      const now = new Date();
      const eventDateTime = parseISO(eventDate);
      
      const hours = differenceInHours(eventDateTime, now);
      const minutes = differenceInMinutes(eventDateTime, now) % 60;
      
      if (hours < 1) {
        return `${minutes} dakika sonra`;
      } else if (hours < 24) {
        return `${hours} saat ${minutes} dakika sonra`;
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days} gün ${remainingHours} saat sonra`;
      }
    } catch (error) {
      console.error('Tarih formatlanırken hata:', error);
      return '';
    }
  };

  // Rol rengini belirle
  const getRoleColor = (userRole) => {
    switch (userRole) {
      case 'organizer':
        return colors.primary.main;
      case 'participant':
        return colors.success.main;
      default:
        return colors.grey[500];
    }
  };

  // Rol metnini belirle
  const getRoleText = (userRole) => {
    switch (userRole) {
      case 'organizer':
        return 'Organizatör';
      case 'participant':
        return 'Katılımcı';
      default:
        return '';
    }
  };

  // Etkinlik konumunu formatla ve kısalt
  const formatLocation = (location) => {
    let address = '';
    
    if (typeof location === 'string') {
      address = location;
    } else if (typeof location === 'object' && location.address) {
      address = location.address;
    } else {
      return 'Konum belirtilmemiş';
    }
    
    // Uzun adresleri kısalt
    if (address.length > 25) {
      // Virgülle ayrılmış adres parçalarını kontrol et
      const parts = address.split(',');
      if (parts.length > 1) {
        // İlk iki parçayı al (genellikle mahalle ve ilçe)
        const shortAddress = parts.slice(0, 2).join(', ').trim();
        return shortAddress.length > 25 ? shortAddress.substring(0, 22) + '...' : shortAddress;
      } else {
        // Virgül yoksa direkt kısalt
        return address.substring(0, 22) + '...';
      }
    }
    
    return address;
  };

  // Etkinlik detayına git
  const handleEventPress = (eventId) => {
    navigation.navigate('EventDetail', { eventId });
  };

  const renderEventItem = ({ item }) => {
    const eventDate = parseISO(item.startDate || item.date);
    const formattedDate = format(eventDate, 'd MMM', { locale: tr });
    const formattedTime = format(eventDate, 'HH:mm');
    const timeUntilText = formatTimeUntil(item.startDate || item.date);
    
    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => handleEventPress(item._id || item.id)}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventImageContainer}>
            <Ionicons name="calendar" size={24} color="#fff" />
          </View>
          
          <View style={styles.eventInfo}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {item.title}
              </Text>
              
              {item.userRole && (
                <View style={[styles.roleChip, { backgroundColor: getRoleColor(item.userRole) + '20', borderColor: getRoleColor(item.userRole) }]}>
                  <Text style={[styles.roleText, { color: getRoleColor(item.userRole) }]}>
                    {getRoleText(item.userRole)}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.eventDateRow}>
              <Ionicons name="time-outline" size={14} color={colors.text.secondary} style={styles.icon} />
              <Text style={styles.eventDateText}>
                {formattedDate} • {formattedTime}
              </Text>
            </View>
            
            {timeUntilText && (
              <Text style={styles.timeUntilText}>
                {timeUntilText}
              </Text>
            )}
            
            <View style={styles.eventLocationRow}>
              <Ionicons name="location-outline" size={14} color={colors.text.secondary} style={styles.icon} />
              <Text style={styles.eventLocationText} numberOfLines={1}>
                {formatLocation(item.location)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={events}
      renderItem={renderEventItem}
      keyExtractor={(item) => item._id || item.id}
      contentContainerStyle={styles.container}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: colors.text.secondary,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error.main,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  roleChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '500',
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  icon: {
    marginRight: 4,
  },
  eventDateText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  timeUntilText: {
    fontSize: 12,
    color: colors.primary.main,
    fontWeight: '500',
    marginBottom: 2,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 12,
    color: colors.text.secondary,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
});

export default UpcomingEvents; 