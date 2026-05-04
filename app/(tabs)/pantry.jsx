import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as PantryStorage from '../lib/pantryStorage';
import ItemDetailModal from '../components/ItemDetailModal';

/**
 * Pantry Screen - WITH IMAGES & NUTRITION
 * 
 * File location: app/(tabs)/pantry.jsx
 * 
 * NEW FEATURES:
 * - Product images in item cards
 * - Tap item → ItemDetailModal (shows nutrition, image, actions)
 * - Image fallback icon for items without photos
 * - Updated UI with better spacing
 */

// Available colors for categories
const CATEGORY_COLORS = [
  { id: 'blue', color: '#2196F3', name: 'Blue' },
  { id: 'orange', color: '#FF9800', name: 'Orange' },
  { id: 'cyan', color: '#00BCD4', name: 'Cyan' },
  { id: 'green', color: '#4CAF50', name: 'Green' },
  { id: 'purple', color: '#9C27B0', name: 'Purple' },
  { id: 'pink', color: '#E91E63', name: 'Pink' },
  { id: 'red', color: '#f44336', name: 'Red' },
  { id: 'teal', color: '#009688', name: 'Teal' },
  { id: 'indigo', color: '#3F51B5', name: 'Indigo' },
  { id: 'lime', color: '#CDDC39', name: 'Lime' },
];

export default function Pantry() {
  const [groupedItems, setGroupedItems] = useState({});
  const [categories, setCategories] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Item detail
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Item form state
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemCategory, setItemCategory] = useState('pantry');
  const [itemExpiration, setItemExpiration] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // New category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#9E9E9E');

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
    const grouped = await PantryStorage.getItemsGroupedByCategory();
    const cats = await PantryStorage.getAllCategories();
    setGroupedItems(grouped);
    setCategories(cats);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditMode(false);
    setEditingItem(null);
    setItemName('');
    setItemQuantity('');
    setItemCategory('pantry');
    setItemExpiration(new Date());
    setItemModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditMode(true);
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(item.quantity);
    setItemCategory(item.category);
    setItemExpiration(new Date(item.expiration));
    setItemModalVisible(true);
  };

  const saveItem = async () => {
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const expirationString = itemExpiration.toISOString().split('T')[0];

    try {
      if (editMode && editingItem) {
        await PantryStorage.updateItem(editingItem.id, {
          name: itemName,
          quantity: itemQuantity,
          category: itemCategory,
          expiration: expirationString,
        });
      } else {
        await PantryStorage.addItem({
          name: itemName,
          quantity: itemQuantity,
          category: itemCategory,
          expiration: expirationString,
        });
      }
      
      await loadData();
      setItemModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save item');
    }
  };

  const deleteItem = async (itemId, itemName) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${itemName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await PantryStorage.deleteItem(itemId);
            await loadData();
          },
        },
      ]
    );
  };

  const toggleSection = (categoryId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleCategoryLongPress = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category || !category.isCustom) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Delete "${category.name}"? Items will be moved to Pantry.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await PantryStorage.deleteCategory(categoryId);
            await loadData();
          },
        },
      ]
    );
  };

  const openAddCategoryModal = () => {
    setNewCategoryName('');
    setNewCategoryColor('#9E9E9E');
    setCategoryModalVisible(true);
  };

  const saveCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    await PantryStorage.addCategory(newCategoryName, '', newCategoryColor);
    await loadData();
    setCategoryModalVisible(false);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setItemExpiration(selectedDate);
    }
  };

  const isExpiringSoon = (expirationDate) => {
    if (expirationDate === 'N/A') return false;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 3 && daysUntilExpiration >= 0;
  };

  const isExpired = (expirationDate) => {
    if (expirationDate === 'N/A') return false;
    const today = new Date();
    const expDate = new Date(expirationDate);
    return expDate < today;
  };

  const handleItemPress = (item) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  const renderItem = ({ item }) => {
    const expiringSoon = isExpiringSoon(item.expiration);
    const expired = isExpired(item.expiration);
    
    return (
      <TouchableOpacity
        style={[
          styles.itemCard, 
          expiringSoon && styles.itemCardWarning,
          expired && styles.itemCardExpired,
        ]}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View style={styles.itemImageContainer}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color="#ccc" />
            </View>
          )}
        </View>

        {/* Item Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {item.brand && item.brand !== 'N/A' && (
            <Text style={styles.itemBrand} numberOfLines={1}>{item.brand}</Text>
          )}
          <Text style={styles.itemDetails}>Qty: {item.quantity}</Text>
          <Text style={[
            styles.itemExpiration,
            expired && styles.itemExpirationExpired,
            expiringSoon && styles.itemExpirationWarning,
          ]}>
            {expired ? '⚠️ Expired' : expiringSoon ? '⚠️ ' : ''}
            {item.expiration}
          </Text>
        </View>

        {/* Nutrition Indicator */}
        {item.nutrition && (
          <View style={styles.nutritionBadge}>
            <Ionicons name="nutrition-outline" size={16} color="#4CAF50" />
          </View>
        )}

        {/* Quick Delete */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            deleteItem(item.id, item.name);
          }}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderCategory = (categoryId) => {
    const data = groupedItems[categoryId];
    if (!data) return null;

    const { category, items } = data;
    const isCollapsed = collapsedSections[categoryId];

    return (
      <View key={categoryId} style={styles.categorySection}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleSection(categoryId)}
          onLongPress={() => handleCategoryLongPress(categoryId)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryHeaderLeft}>
            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <Text style={styles.categoryCount}>({items.length})</Text>
          </View>
          <Ionicons 
            name={isCollapsed ? 'chevron-down' : 'chevron-up'} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>

        {!isCollapsed && (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading pantry...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pantry</Text>
        <TouchableOpacity
          style={styles.addCategoryButton}
          onPress={openAddCategoryModal}
        >
          <Ionicons name="pricetag-outline" size={20} color="#2196F3" />
          <Text style={styles.addCategoryButtonText}>New Category</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <FlatList
        data={categories}
        renderItem={({ item }) => renderCategory(item.id)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      {/* Add Item Button */}
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Item</Text>
      </TouchableOpacity>

      {/* Add/Edit Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={itemModalVisible}
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Item' : 'Add New Item'}
            </Text>

            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Milk"
              value={itemName}
              onChangeText={setItemName}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryPicker}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    { borderColor: cat.color },
                    itemCategory === cat.id && { backgroundColor: cat.color + '20' },
                  ]}
                  onPress={() => setItemCategory(cat.id)}
                >
                  <View style={[styles.categoryOptionDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.categoryOptionText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1 gallon"
              value={itemQuantity}
              onChangeText={setItemQuantity}
            />

            <Text style={styles.inputLabel}>Expiration Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#2196F3" />
              <Text style={styles.dateButtonText}>
                {itemExpiration.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={itemExpiration}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setItemModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveItem}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  {editMode ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Category</Text>

            <Text style={styles.inputLabel}>Category Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Snacks"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorPicker}>
              {CATEGORY_COLORS.map((colorOption) => (
                <TouchableOpacity
                  key={colorOption.id}
                  style={[
                    styles.colorOption,
                    { backgroundColor: colorOption.color },
                    newCategoryColor === colorOption.color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setNewCategoryColor(colorOption.color)}
                >
                  {newCategoryColor === colorOption.color && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveCategory}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Item Detail Modal */}
      <ItemDetailModal
        visible={detailModalVisible}
        item={selectedItem}
        onClose={() => setDetailModalVisible(false)}
        onUpdate={loadData}
        onDelete={loadData}
      />
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addCategoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 100,
  },
  categorySection: {
    marginTop: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryCount: {
    fontSize: 14,
    color: '#999',
    marginLeft: 6,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  itemCardExpired: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    backgroundColor: '#FFEBEE',
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  itemExpiration: {
    fontSize: 13,
    color: '#666',
  },
  itemExpirationWarning: {
    color: '#FF9800',
    fontWeight: '600',
  },
  itemExpirationExpired: {
    color: '#f44336',
    fontWeight: '600',
  },
  nutritionBadge: {
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  categoryOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveButtonText: {
    color: '#fff',
  },
});
