import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as PantryStorage from './lib/pantryStorage';
import BottomNav from './components/BottomNav';

/**
 * Home Dashboard - UI OVERHAUL (Phase 1)
 */

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    expiringSoon: 0,
    expired: 0,
  });
  
  // Widget data
  const [weekItems, setWeekItems] = useState([]);
  const [dailyCheckItems, setDailyCheckItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  
  // Modal for day view
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedDayItems, setSelectedDayItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      // Stats
      const items = await PantryStorage.getActiveItems();
      const expiringSoonItems = await PantryStorage.getExpiringSoonItems(3);
      const expiredItems = await PantryStorage.getExpiredItems();

      setStats({
        totalItems: items.length,
        expiringSoon: expiringSoonItems.length,
        expired: expiredItems.length,
      });

      // This week items
      const weekItems = await PantryStorage.getItemsExpiringThisWeek();
      setWeekItems(weekItems);

      // Daily check - combine expired and expiring soon, sort by urgency
      const expiredUnique = expiredItems.filter(item => 
        !expiringSoonItems.some(existing => existing.id === item.id)
      );
      
      const urgent = [...expiredUnique, ...expiringSoonItems]
        .sort((a, b) => {
          const dateA = new Date(a.expiration);
          const dateB = new Date(b.expiration);
          return dateA - dateB;
        })
        .slice(0, 3); // Top 3 most urgent
      setDailyCheckItems(urgent);

      // Recent items
      const recent = await PantryStorage.getRecentlyAddedItems(3);
      setRecentItems(recent);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsConsumed = async (itemId) => {
    const success = await PantryStorage.markAsConsumed(itemId);
    if (success) {
      await loadData(); // Refresh to show next item
    }
  };

  const handleDayPress = async (date) => {
    const itemsOnDay = await PantryStorage.getItemsByDate(date);
    setSelectedDayItems(itemsOnDay);
    setSelectedDate(date);
    setDayModalVisible(true);
  };

  // Get next 7 days
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      
      // Count items expiring on this day
      const itemCount = weekItems.filter(item => item.expiration === dateString).length;
      
      days.push({
        dateString,
        dayName,
        dayNumber,
        itemCount,
        isToday: i === 0,
      });
    }
    
    return days;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const getDaysUntilExpiration = (expirationDate) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const next7Days = getNext7Days();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.headerTitle}>Hermit Crab</Text>
              <Text style={styles.headerSubtitle}>Smart Pantry</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => {
              // TODO: Add functionality later (maybe settings or profile)
              console.log('Logo tapped - add functionality later');
            }}
            activeOpacity={0.8}
          >
            {/* Hermit Crab Logo - Top Right */}
            <Image 
              source={require('../assets/Crabby_BackgroundRemoved.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* This Week Widget */}
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            <Text style={styles.widgetTitle}>This Week</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weekScroll}
          >
            {next7Days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  day.isToday && styles.dayCardToday,
                ]}
                onPress={() => handleDayPress(day.dateString)}
              >
                <Text style={[
                  styles.dayName,
                  day.isToday && styles.dayNameToday,
                ]}>
                  {day.dayName}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  day.isToday && styles.dayNumberToday,
                ]}>
                  {day.dayNumber}
                </Text>
                {day.itemCount > 0 && (
                  <View style={styles.dayDots}>
                    {[...Array(Math.min(day.itemCount, 3))].map((_, i) => (
                      <View key={i} style={styles.dayDot} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Daily Check Widget */}
        {dailyCheckItems.length > 0 && (
          <View style={[styles.widget, styles.urgentWidget]}>
            <View style={styles.widgetHeader}>
              <Ionicons name="alert-circle" size={20} color="#FF9800" />
              <Text style={styles.widgetTitle}>Daily Check</Text>
              <Text style={styles.urgentBadge}>{dailyCheckItems.length}</Text>
            </View>
            <FlatList
              data={dailyCheckItems}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const daysLeft = getDaysUntilExpiration(item.expiration);
                const isExpired = daysLeft < 0;
                
                return (
                  <View style={styles.urgentItem}>
                    <View style={styles.urgentItemLeft}>
                      <Text style={styles.urgentItemName}>{item.name}</Text>
                      <Text style={[
                        styles.urgentItemExpiry,
                        isExpired && styles.urgentItemExpired,
                      ]}>
                        {isExpired 
                          ? `Expired ${Math.abs(daysLeft)}d ago` 
                          : daysLeft === 0
                          ? 'Expires today!'
                          : `${daysLeft}d left`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.consumeButton}
                      onPress={() => handleMarkAsConsumed(item.id)}
                    >
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* Recently Added Widget */}
        {recentItems.length > 0 && (
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Ionicons name="time-outline" size={20} color="#4CAF50" />
              <Text style={styles.widgetTitle}>Recently Added</Text>
            </View>
            {recentItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentItem}
                onPress={() => router.push('/(tabs)/pantry')}
              >
                <View style={styles.recentItemContent}>
                  <Text style={styles.recentItemName}>{item.name}</Text>
                  <Text style={styles.recentItemTime}>
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Grocery List Placeholder */}
        <View style={[styles.widget, styles.placeholderWidget]}>
          <View style={styles.widgetHeader}>
            <Ionicons name="cart-outline" size={20} color="#9C27B0" />
            <Text style={styles.widgetTitle}>Grocery List</Text>
            <Text style={styles.comingSoonBadge}>Coming Soon</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '60%' }]} />
          </View>
          <Text style={styles.progressText}>60% Complete</Text>
        </View>

        {/* Bottom padding for nav bar */}
        <View style={styles.footer} />
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <BottomNav />

      {/* Day Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={dayModalVisible}
        onRequestClose={() => setDayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={() => setDayModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedDayItems.length > 0 ? (
              <FlatList
                data={selectedDayItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.modalItem}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <Text style={styles.modalItemQuantity}>{item.quantity}</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.modalEmpty}>No items expiring on this day</Text>
            )}
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setDayModalVisible(false);
                router.push('/calendar');
              }}
            >
              <Text style={styles.modalButtonText}>View Full Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1976D2',
  },
  headerLeft: {
    flex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
    opacity: 0.9,
  },
  widget: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentWidget: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  placeholderWidget: {
    opacity: 0.6,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: '#FF9800',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  comingSoonBadge: {
    backgroundColor: '#E0E0E0',
    color: '#666',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  weekScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dayCard: {
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    minWidth: 60,
  },
  dayCardToday: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  dayNameToday: {
    color: '#2196F3',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  dayNumberToday: {
    color: '#2196F3',
  },
  dayDots: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 3,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9800',
  },
  urgentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  urgentItemLeft: {
    flex: 1,
  },
  urgentItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  urgentItemExpiry: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 2,
  },
  urgentItemExpired: {
    color: '#f44336',
  },
  consumeButton: {
    padding: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recentItemTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9C27B0',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    height: 100, // Extra padding for bottom nav
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalItemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  modalEmpty: {
    textAlign: 'center',
    color: '#999',
    padding: 40,
    fontStyle: 'italic',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
