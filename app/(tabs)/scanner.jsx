import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as OpenFoodFacts from '../lib/openFoodFacts';
import * as PantryStorage from '../lib/pantryStorage';

/**
 * Barcode Scanner Screen - UPDATED WITH QOL
 * 
 * File location: app/(tabs)/scanner.jsx
 * 
 * UPDATES:
 * - Category selector (Fridge, Pantry, Freezer, Custom)
 * - Date picker (calendar, not manual typing)
 * - Matches rest of app UX
 */

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [editableDate, setEditableDate] = useState(new Date());
  const [editableName, setEditableName] = useState('');
  const [editableQuantity, setEditableQuantity] = useState('');
  const [editableCategory, setEditableCategory] = useState('pantry');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await PantryStorage.getAllCategories();
    setCategories(cats);
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);
    
    console.log(`📱 Barcode scanned: ${data}`);
    
    try {
      const product = await OpenFoodFacts.searchByBarcode(data);
      
      if (product) {
        console.log('✅ Product found:', product.name);
        showEditModal(product);
      } else {
        console.log('❌ Product not found');
        Alert.alert(
          'Product Not Found',
          'This barcode is not in our database. Would you like to add it manually?',
          [
            { text: 'Cancel', onPress: resetScanner },
            { 
              text: 'Add Manually', 
              onPress: () => {
                resetScanner();
                router.push('/(tabs)/pantry');
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'Failed to process barcode.');
      resetScanner();
    } finally {
      setLoading(false);
    }
  };

  const showEditModal = (product) => {
    const estimatedDate = OpenFoodFacts.estimateExpirationDate(
      product.categories,
      product.categoriesTags,
      product.name
    );
    
    setScannedProduct(product);
    setEditableName(product.name);
    setEditableQuantity(product.quantity || '1');
    setEditableCategory('pantry');
    setEditableDate(new Date(estimatedDate));
    setEditModalVisible(true);
  };

  const addToPantry = async () => {
    if (!editableName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const expirationString = editableDate.toISOString().split('T')[0];

    try {
      const newItem = await PantryStorage.addItem({
        name: editableName,
        brand: scannedProduct.brand,
        barcode: scannedProduct.barcode,
        quantity: editableQuantity || '1',
        category: editableCategory,
        expiration: expirationString,
        imageUrl: scannedProduct.imageUrl,
        nutrition: scannedProduct.nutrition, // Save nutrition data
      });

      if (newItem) {
        setEditModalVisible(false);
        Alert.alert(
          'Success! ✅',
          `${editableName} added to your ${editableCategory}.`,
          [
            { text: 'Scan Another', onPress: resetScanner },
            {
              text: 'View Pantry',
              onPress: () => {
                resetScanner();
                router.push('/(tabs)/pantry');
              },
            },
          ]
        );
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item to pantry.');
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setEditModalVisible(false);
    setScannedProduct(null);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setEditableDate(selectedDate);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Hermit Crab needs camera access to scan barcodes.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <Text style={styles.instructionText}>
              {scanned ? 'Processing...' : 'Point camera at barcode'}
            </Text>
          </View>

          <View style={styles.middleOverlay}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {loading && (
                <ActivityIndicator size="large" color="#fff" style={styles.loadingIndicator} />
              )}
            </View>
          </View>

          <View style={styles.bottomOverlay}>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => router.push('/(tabs)/pantry')}
              disabled={loading}
            >
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>

            {scanned && !editModalVisible && (
              <TouchableOpacity style={styles.resetButton} onPress={resetScanner}>
                <Text style={styles.resetButtonText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>

      {/* Edit Modal - WITH CATEGORY & DATE PICKER */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📦 Product Found!</Text>
            
            {scannedProduct && scannedProduct.brand !== 'N/A' && (
              <Text style={styles.brandText}>{scannedProduct.brand}</Text>
            )}

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editableName}
              onChangeText={setEditableName}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryPicker}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    { borderColor: cat.color },
                    editableCategory === cat.id && { backgroundColor: cat.color + '20' },
                  ]}
                  onPress={() => setEditableCategory(cat.id)}
                >
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.categoryOptionText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={editableQuantity}
              onChangeText={setEditableQuantity}
              placeholder="e.g., 1, 12 oz, 1 gallon"
            />

            <Text style={styles.inputLabel}>Expiration Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonIcon}>📅</Text>
              <Text style={styles.dateButtonText}>
                {editableDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>
              ⚠️ This is an estimate - please verify!
            </Text>

            {showDatePicker && (
              <DateTimePicker
                value={editableDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  resetScanner();
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addToPantry}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Add to Pantry
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  middleOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 300,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#2196F3',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  loadingIndicator: {
    position: 'absolute',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  manualButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  manualButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  brandText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
  categoryDot: {
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
  dateButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  helpText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
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
    backgroundColor: '#f5f5f5',
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
