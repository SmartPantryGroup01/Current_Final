import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as MealPlanStorage from '../lib/mealPlanStorage';
import * as Spoonacular from '../lib/spoonacular';
import * as PantryStorage from '../lib/pantryStorage';

/**
 * Meal Planner Screen
 * 
 * File location: app/(tabs)/meals.jsx
 * 
 * Features:
 * - Weekly calendar view
 * - Add meals (breakfast, lunch, dinner)
 * - Recipe search
 * - Ingredient matching with pantry
 * - Shopping list generation
 */

export default function MealPlanner() {
  const [weekPlans, setWeekPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pantryItems, setPantryItems] = useState([]);
  
  // Modals
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [recipeDetailModalVisible, setRecipeDetailModalVisible] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState('pantry'); // 'pantry' or 'query'
  
  // Selected meal slot for adding recipe
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('');
  
  // Recipe detail
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
      const plans = await MealPlanStorage.getWeekMealPlans();
      const items = await PantryStorage.getActiveItems();
      setWeekPlans(plans);
      setPantryItems(items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSearchModal = (dateString, mealType) => {
    setSelectedDate(dateString);
    setSelectedMealType(mealType);
    setSearchQuery('');
    setSearchResults([]);
    setSearchModalVisible(true);
  };

  const searchRecipes = async () => {
    if (!searchQuery.trim() && searchMode === 'query') {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }
    
    setSearching(true);
    try {
      let results;
      
      if (searchMode === 'pantry') {
        // Search by pantry ingredients
        const ingredientNames = pantryItems.map(item => item.name);
        results = await Spoonacular.searchByIngredients(ingredientNames, 10);
      } else {
        // Search by query
        results = await Spoonacular.searchRecipes(searchQuery, 10);
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
      Alert.alert('Error', 'Failed to search recipes. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const viewRecipeDetails = async (recipe) => {
    setSelectedRecipe(recipe);
    setLoadingDetails(true);
    setRecipeDetailModalVisible(true);
    
    try {
      const details = await Spoonacular.getRecipeDetails(recipe.id);
      setRecipeDetails(details);
    } catch (error) {
      console.error('Error loading recipe details:', error);
      Alert.alert('Error', 'Failed to load recipe details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const addRecipeToMealPlan = async () => {
    if (!recipeDetails) return;
    
    const success = await MealPlanStorage.saveMealPlan(
      selectedDate,
      selectedMealType,
      recipeDetails
    );
    
    if (success) {
      await loadData();
      setRecipeDetailModalVisible(false);
      setSearchModalVisible(false);
      Alert.alert('Success', `${recipeDetails.title} added to ${selectedMealType}`);
    } else {
      Alert.alert('Error', 'Failed to add meal to plan');
    }
  };

  const removeMeal = async (dateString, mealType) => {
    Alert.alert(
      'Remove Meal',
      'Remove this meal from your plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await MealPlanStorage.removeMealPlan(dateString, mealType);
            await loadData();
          },
        },
      ]
    );
  };

  const generateShoppingList = async () => {
    setLoading(true);
    try {
      const list = await MealPlanStorage.generateShoppingList(pantryItems);
      const missingCount = list.filter(item => !item.inPantry).length;
      
      Alert.alert(
        'Shopping List Generated',
        `Found ${missingCount} items you need to buy.\n${list.length - missingCount} items already in pantry.`,
        [
          { text: 'OK' },
          {
            text: 'View List',
            onPress: () => {
              // Navigate to shopping list view (could be separate screen)
              console.log('Shopping list:', list);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error generating shopping list:', error);
      Alert.alert('Error', 'Failed to generate shopping list');
    } finally {
      setLoading(false);
    }
  };

  const renderMealSlot = (date, mealType, meal) => {
    const mealIcon = 
      mealType === 'breakfast' ? 'sunny' :
      mealType === 'lunch' ? 'restaurant' :
      'moon';
    
    const mealColor =
      mealType === 'breakfast' ? '#FF9800' :
      mealType === 'lunch' ? '#2196F3' :
      '#9C27B0';
    
    if (meal) {
      return (
        <TouchableOpacity
          style={[styles.mealSlot, styles.mealSlotFilled]}
          onPress={() => viewRecipeDetails(meal)}
          onLongPress={() => removeMeal(date, mealType)}
        >
          {meal.image && (
            <Image source={{ uri: meal.image }} style={styles.mealImage} />
          )}
          <View style={styles.mealInfo}>
            <View style={styles.mealHeader}>
              <Ionicons name={mealIcon} size={16} color={mealColor} />
              <Text style={styles.mealTypeText}>{mealType}</Text>
            </View>
            <Text style={styles.mealTitle} numberOfLines={2}>{meal.title}</Text>
            {meal.readyInMinutes && (
              <Text style={styles.mealMeta}>
                ⏱️ {meal.readyInMinutes} min
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        style={styles.mealSlot}
        onPress={() => openSearchModal(date, mealType)}
      >
        <Ionicons name={mealIcon} size={24} color={mealColor} />
        <Text style={styles.mealSlotEmpty}>{mealType}</Text>
        <Ionicons name="add-circle-outline" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const renderDayCard = ({ item: day }) => (
    <View style={[styles.dayCard, day.isToday && styles.dayCardToday]}>
      <View style={styles.dayHeader}>
        <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>
          {day.dayName}
        </Text>
        <Text style={[styles.dayNumber, day.isToday && styles.dayNumberToday]}>
          {day.dayNumber}
        </Text>
      </View>
      
      {renderMealSlot(day.date, 'breakfast', day.meals.breakfast)}
      {renderMealSlot(day.date, 'lunch', day.meals.lunch)}
      {renderMealSlot(day.date, 'dinner', day.meals.dinner)}
    </View>
  );

  const renderSearchResult = ({ item: recipe }) => (
    <TouchableOpacity
      style={styles.searchResultCard}
      onPress={() => viewRecipeDetails(recipe)}
    >
      {recipe.image && (
        <Image source={{ uri: recipe.image }} style={styles.searchResultImage} />
      )}
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        
        {searchMode === 'pantry' && (
          <View style={styles.ingredientMatch}>
            <Text style={styles.ingredientMatchText}>
              ✓ {recipe.usedIngredientCount} ingredients you have
            </Text>
            {recipe.missedIngredientCount > 0 && (
              <Text style={styles.ingredientMissedText}>
                ⚠️ {recipe.missedIngredientCount} missing
              </Text>
            )}
          </View>
        )}
        
        {recipe.readyInMinutes && (
          <Text style={styles.searchResultMeta}>
            ⏱️ {recipe.readyInMinutes} min
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading meal planner...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Planner</Text>
        <TouchableOpacity
          style={styles.shoppingListButton}
          onPress={generateShoppingList}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.shoppingListButtonText}>Shopping List</Text>
        </TouchableOpacity>
      </View>

      {/* Week Calendar */}
      <FlatList
        horizontal
        data={weekPlans}
        renderItem={renderDayCard}
        keyExtractor={(item) => item.date}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekScroll}
      />

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Add {selectedMealType} - {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Search Mode Toggle */}
          <View style={styles.searchModeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                searchMode === 'pantry' && styles.modeButtonActive,
              ]}
              onPress={() => setSearchMode('pantry')}
            >
              <Text style={[
                styles.modeButtonText,
                searchMode === 'pantry' && styles.modeButtonTextActive,
              ]}>
                From Pantry
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                searchMode === 'query' && styles.modeButtonActive,
              ]}
              onPress={() => setSearchMode('query')}
            >
              <Text style={[
                styles.modeButtonText,
                searchMode === 'query' && styles.modeButtonTextActive,
              ]}>
                Search Recipes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          {searchMode === 'query' && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for recipes..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchRecipes}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={searchRecipes}
              >
                <Ionicons name="search" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {searchMode === 'pantry' && !searching && searchResults.length === 0 && (
            <TouchableOpacity
              style={styles.pantrySearchButton}
              onPress={searchRecipes}
            >
              <Text style={styles.pantrySearchButtonText}>
                Find Recipes Using My Pantry ({pantryItems.length} items)
              </Text>
            </TouchableOpacity>
          )}

          {/* Search Results */}
          {searching ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.searchingText}>Searching recipes...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.searchResults}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {searchMode === 'pantry' 
                    ? 'Tap the button above to find recipes'
                    : 'No recipes found. Try a different search.'}
                </Text>
              }
            />
          )}
        </View>
      </Modal>

      {/* Recipe Detail Modal */}
      <Modal
        visible={recipeDetailModalVisible}
        animationType="slide"
        onRequestClose={() => setRecipeDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedRecipe?.title}
            </Text>
            <TouchableOpacity onPress={() => setRecipeDetailModalVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {loadingDetails ? (
            <View style={styles.detailsLoadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading details...</Text>
            </View>
          ) : recipeDetails ? (
            <ScrollView style={styles.recipeDetailScroll}>
              {recipeDetails.image && (
                <Image
                  source={{ uri: recipeDetails.image }}
                  style={styles.recipeDetailImage}
                />
              )}

              <View style={styles.recipeDetailContent}>
                {/* Meta info */}
                <View style={styles.recipeMetaRow}>
                  {recipeDetails.readyInMinutes && (
                    <View style={styles.recipeMeta}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.recipeMetaText}>
                        {recipeDetails.readyInMinutes} min
                      </Text>
                    </View>
                  )}
                  {recipeDetails.servings && (
                    <View style={styles.recipeMeta}>
                      <Ionicons name="people-outline" size={16} color="#666" />
                      <Text style={styles.recipeMetaText}>
                        {recipeDetails.servings} servings
                      </Text>
                    </View>
                  )}
                </View>

                {/* Nutrition */}
                {recipeDetails.nutrition && (
                  <View style={styles.nutritionSection}>
                    <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {Math.round(recipeDetails.nutrition.calories)}
                        </Text>
                        <Text style={styles.nutritionLabel}>cal</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {Math.round(recipeDetails.nutrition.protein)}g
                        </Text>
                        <Text style={styles.nutritionLabel}>protein</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {Math.round(recipeDetails.nutrition.carbs)}g
                        </Text>
                        <Text style={styles.nutritionLabel}>carbs</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>
                          {Math.round(recipeDetails.nutrition.fat)}g
                        </Text>
                        <Text style={styles.nutritionLabel}>fat</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Ingredients */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Ingredients ({recipeDetails.ingredients?.length})
                  </Text>
                  {recipeDetails.ingredients?.map((ing, index) => {
                    const inPantry = pantryItems.some(item =>
                      item.name.toLowerCase().includes(ing.name.toLowerCase()) ||
                      ing.name.toLowerCase().includes(item.name.toLowerCase())
                    );
                    
                    return (
                      <View key={index} style={styles.ingredientRow}>
                        <Ionicons
                          name={inPantry ? "checkmark-circle" : "ellipse-outline"}
                          size={16}
                          color={inPantry ? "#2196F3" : "#ccc"}
                        />
                        <Text style={[
                          styles.ingredientText,
                          inPantry && styles.ingredientInPantry,
                        ]}>
                          {ing.original}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Instructions */}
                {recipeDetails.steps && recipeDetails.steps.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Instructions</Text>
                    {recipeDetails.steps.map((step, index) => (
                      <View key={index} style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{step.number}</Text>
                        </View>
                        <Text style={styles.stepText}>{step.step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          ) : null}

          {/* Add to Plan Button */}
          {recipeDetails && (
            <TouchableOpacity
              style={styles.addToPlanButton}
              onPress={addRecipeToMealPlan}
            >
              <Text style={styles.addToPlanButtonText}>
                Add to Meal Plan
              </Text>
            </TouchableOpacity>
          )}
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
  shoppingListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  shoppingListButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  weekScroll: {
    padding: 16,
  },
  dayCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dayNameToday: {
    color: '#2196F3',
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
  },
  dayNumberToday: {
    color: '#2196F3',
  },
  mealSlot: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  mealSlotFilled: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  },
  mealSlotEmpty: {
    fontSize: 14,
    color: '#999',
    marginVertical: 4,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mealMeta: {
    fontSize: 12,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  searchModeToggle: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#2196F3',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pantrySearchButton: {
    backgroundColor: '#2196F3',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pantrySearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  searchResults: {
    padding: 16,
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchResultImage: {
    width: 100,
    height: 100,
  },
  searchResultInfo: {
    flex: 1,
    padding: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  ingredientMatch: {
    marginVertical: 4,
  },
  ingredientMatchText: {
    fontSize: 12,
    color: '#2196F3',
    marginBottom: 2,
  },
  ingredientMissedText: {
    fontSize: 12,
    color: '#FF9800',
  },
  searchResultMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  recipeDetailScroll: {
    flex: 1,
  },
  recipeDetailImage: {
    width: '100%',
    height: 250,
  },
  recipeDetailContent: {
    padding: 20,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recipeMetaText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nutritionSection: {
    marginBottom: 20,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
  },
  ingredientText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  ingredientInPantry: {
    color: '#2196F3',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  detailsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToPlanButton: {
    backgroundColor: '#2196F3',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToPlanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
