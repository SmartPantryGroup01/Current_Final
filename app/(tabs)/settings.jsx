import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as PantryStorage from '../lib/pantryStorage';

/**
 * Settings Screen
 */

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const handleClearConsumedItems = async () => {
    Alert.alert(
      'Clear Consumed Items',
      'This will permanently delete all consumed items. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const consumedItems = await PantryStorage.getConsumedItems();
            for (const item of consumedItems) {
              await PantryStorage.deleteItem(item.id);
            }
            Alert.alert('Success', `Deleted ${consumedItems.length} consumed items`);
          },
        },
      ]
    );
  };

  const handleClearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL items and reset categories to defaults. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await PantryStorage.clearAllItems();
            await PantryStorage.resetCategories();
            Alert.alert('Reset Complete', 'All data has been cleared');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon-outline" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingSubtext}>Coming soon!</Text>
            </View>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={(value) => {
              Alert.alert('Coming Soon', 'Dark mode will be available in a future update!');
              setDarkModeEnabled(false);
            }}
            trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
            disabled={true}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Expiration Alerts</Text>
              <Text style={styles.settingSubtext}>Get notified before items expire</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(value) => {
              Alert.alert('Coming Soon', 'Notification settings will be available soon!');
              setNotificationsEnabled(value);
            }}
            trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
          />
        </View>

        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => Alert.alert('Coming Soon', 'Notification timing settings coming soon!')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="time-outline" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notification Timing</Text>
              <Text style={styles.settingSubtext}>When to receive alerts</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleClearConsumedItems}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="trash-outline" size={24} color="#FF9800" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Clear Consumed Items</Text>
              <Text style={styles.settingSubtext}>Remove items marked as consumed</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => Alert.alert('Coming Soon', 'Export feature coming soon!')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="download-outline" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Export Data</Text>
              <Text style={styles.settingSubtext}>Backup your pantry data</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleClearAllData}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="warning-outline" size={24} color="#f44336" />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: '#f44336' }]}>
                Clear All Data
              </Text>
              <Text style={styles.settingSubtext}>Reset app to defaults</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.aboutCard}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../asset/Crabby_BackgroundRemoved.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Hermit Crab</Text>
          <Text style={styles.appSubtitle}>Smart Pantry & Meal Planner</Text>
          <Text style={styles.version}>Version 0.5.0 (Beta)</Text>
          
          <View style={styles.credits}>
            <Text style={styles.creditsText}>
              Developed by Team Hermit Crab
            </Text>
            <Text style={styles.creditsText}>
              CS 4850 - Spring 2026
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  aboutCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  version: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  credits: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  creditsText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  footer: {
    height: 40,
  },
});
