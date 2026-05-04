import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from 'expo-router';
import * as PantryStorage from './lib/pantryStorage';

/**
 * Calendar View Screen
 */

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    loadItems();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  useEffect(() => {
    if (pantryItems.length > 0) {
      updateMarkedDates();
    }
  }, [pantryItems, selectedDate]);

  const loadItems = async () => {
    setLoading(true);
    const items = await PantryStorage.getAllItems();
    setPantryItems(items);
    setLoading(false);
  };

  const updateMarkedDates = () => {
    const marked = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    pantryItems.forEach(item => {
      if (!item.expiration || item.expiration === 'N/A') return;

      const expDate = new Date(item.expiration);
      expDate.setHours(0, 0, 0, 0);
      const dateString = item.expiration;
      
      const daysUntilExp = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

      let color = '#4CAF50';
      if (daysUntilExp < 0) {
        color = '#f44336';
      } else if (daysUntilExp <= 3) {
        color = '#FF9800';
      } else if (daysUntilExp <= 7) {
        color = '#FFC107';
      }

      if (!marked[dateString]) {
        marked[dateString] = {
          marked: true,
          dotColor: color,
          items: [item],
        };
      } else {
        marked[dateString].items.push(item);
        if (marked[dateString].dotColor === '#4CAF50' || 
            (marked[dateString].dotColor === '#FFC107' && color !== '#4CAF50') ||
            (marked[dateString].dotColor === '#FF9800' && color === '#f44336')) {
          marked[dateString].dotColor = color;
        }
      }
    });

    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#2196F3';
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#2196F3',
      };
    }

    setMarkedDates(marked);
  };

  const getItemsForDate = (date) => {
    return pantryItems.filter(item => item.expiration === date);
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert(
      'Delete Item',
      'Remove this item from your pantry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await PantryStorage.deleteItem(itemId);
            if (success) {
              await loadItems();
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const expDate = new Date(item.expiration);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    
    const daysUntilExp = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    
    let statusColor = '#4CAF50';
    let statusText = `${daysUntilExp} days left`;
    
    if (daysUntilExp < 0) {
      statusColor = '#f44336';
      statusText = `Expired ${Math.abs(daysUntilExp)} days ago`;
    } else if (daysUntilExp === 0) {
      statusColor = '#f44336';
      statusText = 'Expires today!';
    } else if (daysUntilExp <= 3) {
      statusColor = '#FF9800';
      statusText = `${daysUntilExp} days left ⚠️`;
    }

    return (
      <View style={styles.itemCard}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
          <Text style={[styles.itemStatus, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const itemsForSelectedDate = getItemsForDate(selectedDate);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Calendar */}
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          todayTextColor: '#2196F3',
          arrowColor: '#2196F3',
          monthTextColor: '#333',
          textMonthFontWeight: 'bold',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#fff',
        }}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f44336' }]} />
          <Text style={styles.legendText}>Expired</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Expiring Soon</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
          <Text style={styles.legendText}>This Week</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Fresh</Text>
        </View>
      </View>

      {/* Items List */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>
          Items on {formatDate(selectedDate)}
        </Text>
        
        {itemsForSelectedDate.length > 0 ? (
          <FlatList
            data={itemsForSelectedDate}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.itemsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items expiring on this date</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  itemsSection: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemsList: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
