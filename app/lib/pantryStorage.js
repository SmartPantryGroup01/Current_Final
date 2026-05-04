import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Pantry Storage Service - Phase 3A (WITH CONSUMED STATUS)
 */

const PANTRY_STORAGE_KEY = '@smartpantry:items';
const CATEGORIES_STORAGE_KEY = '@smartpantry:categories';

// Default categories
const DEFAULT_CATEGORIES = [
  { id: 'fridge', name: 'Fridge', icon: '🥛', color: '#2196F3' },
  { id: 'pantry', name: 'Pantry', icon: '🥫', color: '#FF9800' },
  { id: 'freezer', name: 'Freezer', icon: '❄️', color: '#00BCD4' },
];

// Get all pantry items
export const getAllItems = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PANTRY_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading pantry items:', error);
    return [];
  }
};

// Get only active (non-consumed) items
export const getActiveItems = async () => {
  try {
    const items = await getAllItems();
    return items.filter(item => !item.consumed);
  } catch (error) {
    console.error('Error loading active items:', error);
    return [];
  }
};

// Get consumed items (for restock list)
export const getConsumedItems = async () => {
  try {
    const items = await getAllItems();
    return items.filter(item => item.consumed);
  } catch (error) {
    console.error('Error loading consumed items:', error);
    return [];
  }
};

// Save all pantry items
export const saveAllItems = async (items) => {
  try {
    const jsonValue = JSON.stringify(items);
    await AsyncStorage.setItem(PANTRY_STORAGE_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving pantry items:', error);
    return false;
  }
};

// Add a single item
export const addItem = async (item) => {
  try {
    const items = await getAllItems();
    const newItem = {
      id: Date.now().toString(),
      category: item.category || 'pantry',
      consumed: false,
      ...item,
      createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    await saveAllItems(items);
    return newItem;
  } catch (error) {
    console.error('Error adding item:', error);
    return null;
  }
};

// Update an existing item
export const updateItem = async (id, updatedData) => {
  try {
    const items = await getAllItems();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Item not found');
    }
    
    items[index] = { ...items[index], ...updatedData };
    await saveAllItems(items);
    return items[index];
  } catch (error) {
    console.error('Error updating item:', error);
    return null;
  }
};

// Mark item as consumed
export const markAsConsumed = async (id) => {
  try {
    const items = await getAllItems();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Item not found');
    }
    
    items[index] = {
      ...items[index],
      consumed: true,
      consumedAt: new Date().toISOString(),
    };
    
    await saveAllItems(items);
    return items[index];
  } catch (error) {
    console.error('Error marking as consumed:', error);
    return null;
  }
};

// Restock item (mark as active again)
export const restockItem = async (id, newExpirationDate) => {
  try {
    const items = await getAllItems();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Item not found');
    }
    
    items[index] = {
      ...items[index],
      consumed: false,
      consumedAt: null,
      expiration: newExpirationDate || items[index].expiration,
      createdAt: new Date().toISOString(), // Reset creation date
    };
    
    await saveAllItems(items);
    return items[index];
  } catch (error) {
    console.error('Error restocking item:', error);
    return null;
  }
};

// Delete an item permanently
export const deleteItem = async (id) => {
  try {
    const items = await getAllItems();
    const filteredItems = items.filter(item => item.id !== id);
    await saveAllItems(filteredItems);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
};

// Get items by category (active only)
export const getItemsByCategory = async (categoryId) => {
  try {
    const items = await getActiveItems();
    return items.filter(item => item.category === categoryId);
  } catch (error) {
    console.error('Error getting items by category:', error);
    return [];
  }
};

// Get items grouped by category (active only)
export const getItemsGroupedByCategory = async () => {
  try {
    const items = await getActiveItems();
    const categories = await getAllCategories();
    
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat.id] = {
        category: cat,
        items: items.filter(item => item.category === cat.id),
      };
    });
    
    return grouped;
  } catch (error) {
    console.error('Error grouping items:', error);
    return {};
  }
};

// Get items expiring soon (within specified days) - ACTIVE ONLY
export const getExpiringSoonItems = async (daysThreshold = 3) => {
  try {
    const items = await getActiveItems();
    const today = new Date();
    
    return items.filter(item => {
      if (!item.expiration || item.expiration === 'N/A') return false;
      
      const expDate = new Date(item.expiration);
      const daysUntilExp = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      
      return daysUntilExp <= daysThreshold && daysUntilExp >= 0;
    });
  } catch (error) {
    console.error('Error getting expiring items:', error);
    return [];
  }
};

// Get expired items - ACTIVE ONLY
export const getExpiredItems = async () => {
  try {
    const items = await getActiveItems();
    const today = new Date();
    
    return items.filter(item => {
      if (!item.expiration || item.expiration === 'N/A') return false;
      
      const expDate = new Date(item.expiration);
      return expDate < today;
    });
  } catch (error) {
    console.error('Error getting expired items:', error);
    return [];
  }
};

// Get items expiring this week (next 7 days) - ACTIVE ONLY
export const getItemsExpiringThisWeek = async () => {
  try {
    const items = await getActiveItems();
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return items.filter(item => {
      if (!item.expiration || item.expiration === 'N/A') return false;
      
      const expDate = new Date(item.expiration);
      return expDate >= today && expDate <= nextWeek;
    });
  } catch (error) {
    console.error('Error getting items expiring this week:', error);
    return [];
  }
};

// Get items by date (for calendar) - ACTIVE ONLY
export const getItemsByDate = async (dateString) => {
  try {
    const items = await getActiveItems();
    return items.filter(item => item.expiration === dateString);
  } catch (error) {
    console.error('Error getting items by date:', error);
    return [];
  }
};

// Get recently added items (last N items) - ACTIVE ONLY
export const getRecentlyAddedItems = async (count = 3) => {
  try {
    const items = await getActiveItems();
    // Sort by createdAt descending
    const sorted = items.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    return sorted.slice(0, count);
  } catch (error) {
    console.error('Error getting recent items:', error);
    return [];
  }
};

// Clear all items
export const clearAllItems = async () => {
  try {
    await AsyncStorage.removeItem(PANTRY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing items:', error);
    return false;
  }
};

// ========== CATEGORY MANAGEMENT ==========

// Get all categories
export const getAllCategories = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    await saveAllCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  } catch (error) {
    console.error('Error loading categories:', error);
    return DEFAULT_CATEGORIES;
  }
};

// Save all categories
export const saveAllCategories = async (categories) => {
  try {
    const jsonValue = JSON.stringify(categories);
    await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving categories:', error);
    return false;
  }
};

// Add a custom category
export const addCategory = async (name, icon = '📦', color = '#9E9E9E') => {
  try {
    const categories = await getAllCategories();
    const newCategory = {
      id: `custom_${Date.now()}`,
      name,
      icon,
      color,
      isCustom: true,
    };
    categories.push(newCategory);
    await saveAllCategories(categories);
    return newCategory;
  } catch (error) {
    console.error('Error adding category:', error);
    return null;
  }
};

// Delete a category (and move items to "Pantry")
export const deleteCategory = async (categoryId) => {
  try {
    if (['fridge', 'pantry', 'freezer'].includes(categoryId)) {
      return false;
    }
    
    const items = await getAllItems();
    const updatedItems = items.map(item => 
      item.category === categoryId ? { ...item, category: 'pantry' } : item
    );
    await saveAllItems(updatedItems);
    
    const categories = await getAllCategories();
    const filtered = categories.filter(cat => cat.id !== categoryId);
    await saveAllCategories(filtered);
    
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

// Reset categories to defaults
export const resetCategories = async () => {
  try {
    await saveAllCategories(DEFAULT_CATEGORIES);
    return true;
  } catch (error) {
    console.error('Error resetting categories:', error);
    return false;
  }
};
