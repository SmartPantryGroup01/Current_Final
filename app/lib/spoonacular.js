/**
 * Spoonacular API Integration
 * 
 * File location: app/lib/spoonacular.js
 * 
 * API Documentation: https://spoonacular.com/food-api/docs
 * 
 * Features:
 * - Search recipes by ingredients
 * - Get recipe details (instructions, nutrition, ingredients)
 * - Find recipes by name/query
 * - Get random recipes
 */

const SPOONACULAR_API_KEY = '11a00d2bf4754fed8252e3c9b6d2a241'; // Your existing API key
const BASE_URL = 'https://api.spoonacular.com';

/**
 * Search recipes by ingredients you have
 * @param {string[]} ingredients - Array of ingredient names
 * @param {number} number - Number of results (default: 10)
 */
export const searchByIngredients = async (ingredients, number = 10) => {
  try {
    const ingredientsStr = ingredients.join(',');
    const url = `${BASE_URL}/recipes/findByIngredients?ingredients=${ingredientsStr}&number=${number}&apiKey=${SPOONACULAR_API_KEY}&ranking=2`;
    
    console.log('🔍 Searching recipes with ingredients:', ingredients);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.status === 402) {
      throw new Error('API quota exceeded');
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return data.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      usedIngredients: recipe.usedIngredients?.map(ing => ing.name) || [],
      missedIngredients: recipe.missedIngredients?.map(ing => ing.name) || [],
      missedIngredientCount: recipe.missedIngredientCount,
      usedIngredientCount: recipe.usedIngredientCount,
    }));
  } catch (error) {
    console.error('❌ Error searching recipes by ingredients:', error);
    throw error;
  }
};

/**
 * Search recipes by query (name, cuisine, etc.)
 * @param {string} query - Search query
 * @param {number} number - Number of results (default: 10)
 */
export const searchRecipes = async (query, number = 10) => {
  try {
    const url = `${BASE_URL}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${number}&apiKey=${SPOONACULAR_API_KEY}&addRecipeInformation=true&fillIngredients=true`;
    
    console.log('🔍 Searching recipes:', query);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.status === 402) {
      throw new Error('API quota exceeded');
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return data.results?.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      summary: recipe.summary,
      vegetarian: recipe.vegetarian,
      vegan: recipe.vegan,
      glutenFree: recipe.glutenFree,
      dairyFree: recipe.dairyFree,
      veryHealthy: recipe.veryHealthy,
    })) || [];
  } catch (error) {
    console.error('❌ Error searching recipes:', error);
    throw error;
  }
};

/**
 * Get detailed recipe information
 * @param {number} recipeId - Spoonacular recipe ID
 */
export const getRecipeDetails = async (recipeId) => {
  try {
    const url = `${BASE_URL}/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}&includeNutrition=true`;
    
    console.log('📖 Fetching recipe details:', recipeId);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.status === 402) {
      throw new Error('API quota exceeded');
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return {
      id: data.id,
      title: data.title,
      image: data.image,
      readyInMinutes: data.readyInMinutes,
      servings: data.servings,
      summary: data.summary,
      instructions: data.instructions,
      
      // Ingredients list
      ingredients: data.extendedIngredients?.map(ing => ({
        id: ing.id,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        original: ing.original,
      })) || [],
      
      // Step-by-step instructions
      steps: data.analyzedInstructions?.[0]?.steps?.map(step => ({
        number: step.number,
        step: step.step,
        ingredients: step.ingredients?.map(ing => ing.name) || [],
      })) || [],
      
      // Nutrition
      nutrition: {
        calories: data.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
        protein: data.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
        fat: data.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0,
        carbs: data.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
        fiber: data.nutrition?.nutrients?.find(n => n.name === 'Fiber')?.amount || 0,
      },
      
      // Dietary info
      vegetarian: data.vegetarian,
      vegan: data.vegan,
      glutenFree: data.glutenFree,
      dairyFree: data.dairyFree,
      veryHealthy: data.veryHealthy,
      
      sourceUrl: data.sourceUrl,
    };
  } catch (error) {
    console.error('❌ Error fetching recipe details:', error);
    throw error;
  }
};

/**
 * Get random recipes
 * @param {number} number - Number of random recipes (default: 5)
 * @param {string} tags - Optional tags (e.g., 'vegetarian,dessert')
 */
export const getRandomRecipes = async (number = 5, tags = '') => {
  try {
    const tagsParam = tags ? `&tags=${tags}` : '';
    const url = `${BASE_URL}/recipes/random?number=${number}${tagsParam}&apiKey=${SPOONACULAR_API_KEY}`;
    
    console.log('🎲 Fetching random recipes');
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.status === 402) {
      throw new Error('API quota exceeded');
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return data.recipes?.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      summary: recipe.summary,
    })) || [];
  } catch (error) {
    console.error('❌ Error fetching random recipes:', error);
    throw error;
  }
};

/**
 * Analyze recipe ingredients against pantry
 * @param {object[]} recipeIngredients - Array of recipe ingredients
 * @param {object[]} pantryItems - Array of pantry items
 * @returns {object} - { haveIngredients, missingIngredients }
 */
export const analyzeIngredients = (recipeIngredients, pantryItems) => {
  const pantryNames = pantryItems.map(item => item.name.toLowerCase());
  
  const haveIngredients = [];
  const missingIngredients = [];
  
  recipeIngredients.forEach(ingredient => {
    const ingredientName = ingredient.name.toLowerCase();
    
    // Simple matching - check if ingredient name is in pantry
    const found = pantryNames.some(pantryName => 
      pantryName.includes(ingredientName) || ingredientName.includes(pantryName)
    );
    
    if (found) {
      haveIngredients.push(ingredient);
    } else {
      missingIngredients.push(ingredient);
    }
  });
  
  return {
    haveIngredients,
    missingIngredients,
    matchPercentage: recipeIngredients.length > 0 
      ? Math.round((haveIngredients.length / recipeIngredients.length) * 100)
      : 0,
  };
};
