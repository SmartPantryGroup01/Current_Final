import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Custom Bottom Navigation Bar
 */

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.includes(path);
  };

  const handleHomePress = () => {
    // If already on home, stay; otherwise navigate home
    if (pathname !== '/') {
      router.push('/');
    }
  };

  const NavButton = ({ icon, label, route, activeName }) => {
    const active = isActive(activeName);
    
    return (
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => {
          if (activeName === '/') {
            handleHomePress();
          } else {
            router.push(route);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={active ? '#2196F3' : '#999'} 
          />
        </View>
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <NavButton 
        icon="home" 
        label="Home" 
        route="/" 
        activeName="/"
      />
      <NavButton 
        icon="nutrition" 
        label="Pantry" 
        route="/(tabs)/pantry" 
        activeName="/pantry"
      />
      <NavButton 
        icon="scan" 
        label="Scan" 
        route="/(tabs)/scanner" 
        activeName="/scanner"
      />
      <NavButton 
        icon="restaurant" 
        label="Meals" 
        route="/(tabs)/meals" 
        activeName="/meals"
      />
      <NavButton 
        icon="calendar" 
        label="Calendar" 
        route="/calendar" 
        activeName="/calendar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: '#E3F2FD',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
  },
  navLabelActive: {
    color: '#2196F3',
  },
});
