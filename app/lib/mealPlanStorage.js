import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Meal Plan Storage Service
 * 
 * File location: app/lib/mealPlanStorage.js
 * 
 * Manages meal plans for the week
 */

const MEAL_PLAN_STORAGE_KEY = '@smartpantry:mealplan';
const SHOPPING_LIST_STORAGE_KEY = '@smartpantry:shopping';

/**
 * Get meal plan for a specific date
 * @param {string} dateString - Date in YYYY-MM-DD format
 */
export const getMealPlan = async (dateString) => {
  try {
    const allPlans = await getAllMealPlans();
    return allPlans[dateString] || { breakfast: null, lunch: null, dinner: null };
  } catch (error) {
    console.error('Error getting meal plan:', error);
    return { breakfast: null, lunch: null, dinner: null };
  }
};

/**
 * Get all meal plans
 */
export const getAllMealPlans = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(MEAL_PLAN_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (error) {
    console.error('Error loading meal plans:', error);
    return {};
  }
};

/**
 * Save meal plan for a specific date and meal type
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} mealType - 'breakfast', 'lunch', or 'dinner'
 * @param {object} recipe - Recipe object with id, title, image, etc.
 */
export const saveMealPlan = async (dateString, mealType, recipe) => {
  try {
    const allPlans = await getAllMealPlans();
    
    if (!allPlans[dateString]) {
      allPlans[dateString] = { breakfast: null, lunch: null, dinner: null };
    }
    
    allPlans[dateString][mealType] = recipe;
    
    const jsonValue = JSON.stringify(allPlans);
    await AsyncStorage.setItem(MEAL_PLAN_STORAGE_KEY, jsonValue);
    
    return true;
  } catch (error) {
    console.error('Error saving meal plan:', error);
    return false;
  }
};

/**
 * Remove meal from plan
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} mealType - 'breakfast', 'lunch', or 'dinner'
 */
export const removeMealPlan = async (dateString, mealType) => {
  try {
    const allPlans = await getAllMealPlans();
    
    if (allPlans[dateString]) {
      allPlans[dateString][mealType] = null;
    }
    
    const jsonValue = JSON.stringify(allPlans);
    await AsyncStorage.setItem(MEAL_PLAN_STORAGE_KEY, jsonValue);
    
    return true;
  } catch (error) {
    console.error('Error removing meal plan:', error);
    return false;
  }
};

/**
 * Get meal plans for current week
 */
export const getWeekMealPlans = async () => {
  try {
    const today = new Date();
    const weekPlans = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const plan = await getMealPlan(dateString);
      weekPlans.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: i === 0,
        meals: plan,
      });
    }
    
    return weekPlans;
  } catch (error) {
    console.error('Error getting week meal plans:', error);
    return [];
  }
};

/**
 * Clear all meal plans
 */
export const clearAllMealPlans = async () => {
  try {
    await AsyncStorage.removeItem(MEAL_PLAN_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing meal plans:', error);
    return false;
  }
};

// ========== SHOPPING LIST ==========

/**
 * Get shopping list
 */
export const getShoppingList = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading shopping list:', error);
    return [];
  }
};

/**
 * Generate shopping list from meal plans
 * @param {object[]} pantryItems - Current pantry items
 */
export const generateShoppingList = async (pantryItems) => {
  try {
    const weekPlans = await getWeekMealPlans();
    const allIngredients = [];
    
    // Collect all ingredients from meal plans
    weekPlans.forEach(day => {
      ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
        const meal = day.meals[mealType];
        if (meal && meal.ingredients) {
          meal.ingredients.forEach(ing => {
            allIngredients.push({
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              original: ing.original,
              recipeTitle: meal.title,
            });
          });
        }
      });
    });
    
    // Remove duplicates and combine quantities
    const ingredientMap = {};
    allIngredients.forEach(ing => {
      if (ingredientMap[ing.name]) {
        ingredientMap[ing.name].amount += ing.amount;
        ingredientMap[ing.name].recipes.push(ing.recipeTitle);
      } else {
        ingredientMap[ing.name] = {
          ...ing,
          recipes: [ing.recipeTitle],
        };
      }
    });
    
    // Convert back to array
    const consolidatedIngredients = Object.values(ingredientMap);
    
    // Check against pantry
    const pantryNames = pantryItems.map(item => item.name.toLowerCase());
    
    const shoppingList = consolidatedIngredients.map(ing => {
      const inPantry = pantryNames.some(pantryName => 
        pantryName.includes(ing.name.toLowerCase()) || 
        ing.name.toLowerCase().includes(pantryName)
      );
      
      return {
        ...ing,
        inPantry,
        checked: false,
      };
    });
    
    // Save shopping list
    const jsonValue = JSON.stringify(shoppingList);
    await AsyncStorage.setItem(SHOPPING_LIST_STORAGE_KEY, jsonValue);
    
    return shoppingList;
  } catch (error) {
    console.error('Error generating shopping list:', error);
    return [];
  }
};

/**
 * Toggle shopping list item checked status
 * @param {string} ingredientName - Name of ingredient
 */
export const toggleShoppingItem = async (ingredientName) => {
  try {
    const list = await getShoppingList();
    const updated = list.map(item => 
      item.name === ingredientName 
        ? { ...item, checked: !item.checked }
        : item
    );
    
    const jsonValue = JSON.stringify(updated);
    await AsyncStorage.setItem(SHOPPING_LIST_STORAGE_KEY, jsonValue);
    
    return updated;
  } catch (error) {
    console.error('Error toggling shopping item:', error);
    return [];
  }
};

/**
 * Clear shopping list
 */
export const clearShoppingList = async () => {
  try {
    await AsyncStorage.removeItem(SHOPPING_LIST_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing shopping list:', error);
    return false;
  }
};
