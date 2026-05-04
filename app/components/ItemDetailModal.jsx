import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as PantryStorage from '../lib/pantryStorage';

/**
 * Item Detail Modal
 * 
 * File location: app/components/ItemDetailModal.jsx
 * 
 * Shows:
 * - Product image (API or placeholder)
 * - Nutrition facts (if available)
 * - Item details (category, expiration, quantity)
 * - Edit/Delete actions
 */

export default function ItemDetailModal({ visible, item, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(item?.name || '');
  const [editedQuantity, setEditedQuantity] = useState(item?.quantity || '');
  const [editedDate, setEditedDate] = useState(item?.expiration ? new Date(item.expiration) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!item) return null;

  const hasNutrition = item.nutrition && (
    item.nutrition.energyKcal || 
    item.nutrition.fat || 
    item.nutrition.carbohydrates || 
    item.nutrition.proteins
  );

  const handleSave = async () => {
    const updated = await PantryStorage.updateItem(item.id, {
      name: editedName,
      quantity: editedQuantity,
      expiration: editedDate.toISOString().split('T')[0],
    });
    
    if (updated) {
      setEditing(false);
      onUpdate();
    } else {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await PantryStorage.deleteItem(item.id);
            if (success) {
              onDelete();
              onClose();
            } else {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleMarkConsumed = async () => {
    const updated = await PantryStorage.markAsConsumed(item.id);
    if (updated) {
      Alert.alert('Consumed', `${item.name} marked as consumed`);
      onUpdate();
      onClose();
    }
  };

  const getDaysUntilExpiration = () => {
    if (!item.expiration || item.expiration === 'N/A') return null;
    const today = new Date();
    const expDate = new Date(item.expiration);
    return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiration();
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{editing ? 'Edit Item' : 'Item Details'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Product Image */}
            {item.imageUrl && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={styles.productImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Item Info */}
            {editing ? (
              <View>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedName}
                  onChangeText={setEditedName}
                />

                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={editedQuantity}
                  onChangeText={setEditedQuantity}
                />

                <Text style={styles.label}>Expiration Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#2196F3" />
                  <Text style={styles.dateButtonText}>
                    {editedDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={editedDate}
                    mode="date"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setEditedDate(date);
                    }}
                  />
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.brand && item.brand !== 'N/A' && (
                  <Text style={styles.brandText}>{item.brand}</Text>
                )}

                <View style={styles.infoRow}>
                  <Ionicons name="cube-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>Quantity: {item.quantity}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="pricetag-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>Category: {item.category}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={isExpired ? '#f44336' : isExpiringSoon ? '#FF9800' : '#666'} 
                  />
                  <Text style={[
                    styles.infoText,
                    isExpired && styles.expiredText,
                    isExpiringSoon && styles.expiringSoonText,
                  ]}>
                    {item.expiration}
                    {daysLeft !== null && (
                      isExpired 
                        ? ` (Expired ${Math.abs(daysLeft)}d ago)`
                        : ` (${daysLeft}d left)`
                    )}
                  </Text>
                </View>
              </View>
            )}

            {/* Nutrition Facts */}
            {!editing && hasNutrition && (
              <View style={styles.nutritionSection}>
                <Text style={styles.sectionTitle}>Nutrition Facts</Text>
                <Text style={styles.servingText}>Per 100g</Text>

                <View style={styles.nutritionGrid}>
                  {item.nutrition.energyKcal && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                      <Text style={styles.nutritionValue}>
                        {Math.round(item.nutrition.energyKcal)} kcal
                      </Text>
                    </View>
                  )}

                  {item.nutrition.fat !== null && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                      <Text style={styles.nutritionValue}>
                        {item.nutrition.fat?.toFixed(1) || '0'}g
                      </Text>
                    </View>
                  )}

                  {item.nutrition.carbohydrates !== null && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                      <Text style={styles.nutritionValue}>
                        {item.nutrition.carbohydrates?.toFixed(1) || '0'}g
                      </Text>
                    </View>
                  )}

                  {item.nutrition.proteins !== null && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                      <Text style={styles.nutritionValue}>
                        {item.nutrition.proteins?.toFixed(1) || '0'}g
                      </Text>
                    </View>
                  )}

                  {item.nutrition.fiber !== null && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Fiber</Text>
                      <Text style={styles.nutritionValue}>
                        {item.nutrition.fiber?.toFixed(1) || '0'}g
                      </Text>
                    </View>
                  )}

                  {item.nutrition.salt !== null && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Salt</Text>
                      <Text style={styles.nutritionValue}>
                        {item.nutrition.salt?.toFixed(2) || '0'}g
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.nutritionNote}>
                  ℹ️ Data from Open Food Facts
                </Text>
              </View>
            )}

            {!editing && !hasNutrition && (
              <View style={styles.noNutritionContainer}>
                <Ionicons name="information-circle-outline" size={40} color="#999" />
                <Text style={styles.noNutritionText}>
                  No nutrition information available
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {editing ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setEditing(false);
                    setEditedName(item.name);
                    setEditedQuantity(item.quantity);
                    setEditedDate(new Date(item.expiration));
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={[styles.buttonText, styles.saveButtonText]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.consumeButton]}
                  onPress={handleMarkConsumed}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={[styles.buttonText, styles.consumeButtonText]}>
                    Consumed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => setEditing(true)}
                >
                  <Ionicons name="pencil" size={20} color="#2196F3" />
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash" size={20} color="#f44336" />
                  <Text style={[styles.buttonText, styles.deleteButtonText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f9f9f9',
  },
  productImage: {
    width: 200,
    height: 200,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  brandText: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  expiredText: {
    color: '#f44336',
    fontWeight: '600',
  },
  expiringSoonText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginHorizontal: 20,
    backgroundColor: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 20,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  nutritionSection: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  servingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    fontStyle: 'italic',
  },
  noNutritionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noNutritionText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  consumeButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  consumeButtonText: {
    color: '#fff',
  },
  saveButtonText: {
    color: '#fff',
  },
  deleteButtonText: {
    color: '#f44336',
  },
});
