/**
 * Open Food Facts API Service
 */

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';

/**
 * Search for a product by barcode
 */
export const searchByBarcode = async (barcode) => {
  try {
    const response = await fetch(`${BASE_URL}/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      return formatProductData(data.product);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return null;
  }
};

/**
 * Format raw product data
 */
const formatProductData = (product) => {
  return {
    barcode: product.code || product._id || 'N/A',
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands || 'N/A',
    quantity: product.quantity || 'N/A',
    categories: product.categories || 'N/A',
    categoriesTags: product.categories_tags || [],
    imageUrl: product.image_url || product.image_front_url || null,
    
    // Nutritional info (per 100g)
    nutrition: {
      energyKcal: product.nutriments?.['energy-kcal'] || null,
      fat: product.nutriments?.fat || null,
      carbohydrates: product.nutriments?.carbohydrates || null,
      proteins: product.nutriments?.proteins || null,
      salt: product.nutriments?.salt || null,
      fiber: product.nutriments?.fiber || null,
    },
    
    // Additional info
    ingredients: product.ingredients_text || 'N/A',
    allergens: product.allergens || 'N/A',
    
    // Raw data
    rawData: product,
  };
};

/**
 * Estimate expiration date based on product category
 */
export const estimateExpirationDate = (categories, categoriesTags = [], productName = '') => {
  const today = new Date();
  let daysToAdd = 30; // Default: 1 month
  let detectedCategory = 'default';
  
  // Combine all text to search
  const searchText = `${categories} ${categoriesTags.join(' ')} ${productName}`.toLowerCase();
  
  console.log('🔍 Analyzing product:', {
    categories,
    categoriesTags: categoriesTags.slice(0, 5),
    productName
  });
  
  // Dairy & Refrigerated (7 days)
  if (searchText.match(/\b(milk|dairy|yogurt|yoghurt|cheese|cream|butter|kefir)\b/)) {
    daysToAdd = 7;
    detectedCategory = 'dairy';
  }
  // Fresh Produce (3-7 days)
  else if (searchText.match(/\b(fruit|vegetable|fresh-produce|lettuce|salad|berry|berries)\b/)) {
    daysToAdd = 5;
    detectedCategory = 'produce';
  }
  // Meat & Seafood (2-3 days)
  else if (searchText.match(/\b(meat|beef|pork|chicken|poultry|fish|seafood|salmon|tuna)\b/)) {
    daysToAdd = 3;
    detectedCategory = 'meat';
  }
  // Bread & Baked Goods (5-7 days)
  else if (searchText.match(/\b(bread|baked|bakery|pastry|muffin|bagel|roll)\b/)) {
    daysToAdd = 5;
    detectedCategory = 'bread';
  }
  // Eggs (21-30 days)
  else if (searchText.match(/\b(egg|eggs)\b/)) {
    daysToAdd = 21;
    detectedCategory = 'eggs';
  }
  // Beverages - Non-dairy (60-90 days)
  else if (searchText.match(/\b(juice|soda|soft-drink|beverage|drink)\b/) && !searchText.includes('milk')) {
    daysToAdd = 60;
    detectedCategory = 'beverages';
  }
  // Snacks & Chips (60-90 days)
  else if (searchText.match(/\b(snack|chip|chips|crisp|crisps|popcorn|pretzel)\b/)) {
    daysToAdd = 90;
    detectedCategory = 'snacks';
  }
  // Cereal & Breakfast (90-120 days)
  else if (searchText.match(/\b(cereal|breakfast|granola|oat|oats)\b/)) {
    daysToAdd = 120;
    detectedCategory = 'cereal';
  }
  // Frozen Foods (180 days)
  else if (searchText.match(/\b(frozen|ice-cream|popsicle)\b/)) {
    daysToAdd = 180;
    detectedCategory = 'frozen';
  }
  // Canned/Preserved Goods (1 year)
  else if (searchText.match(/\b(canned|preserved|can|tin|jarred|pickled)\b/)) {
    daysToAdd = 365;
    detectedCategory = 'canned';
  }
  // Condiments & Sauces (90-180 days)
  else if (searchText.match(/\b(sauce|condiment|ketchup|mustard|mayo|mayonnaise|dressing)\b/)) {
    daysToAdd = 180;
    detectedCategory = 'condiments';
  }
  // Pasta & Rice (1-2 years)
  else if (searchText.match(/\b(pasta|rice|noodle|spaghetti|macaroni)\b/)) {
    daysToAdd = 365;
    detectedCategory = 'pasta-rice';
  }
  
  console.log(`📅 Estimated expiration: ${daysToAdd} days (Category: ${detectedCategory})`);
  
  const expirationDate = new Date(today);
  expirationDate.setDate(expirationDate.getDate() + daysToAdd);
  
  return expirationDate.toISOString().split('T')[0]; // YYYY-MM-DD
};

export default {
  searchByBarcode,
  estimateExpirationDate,
};
