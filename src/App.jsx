import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Utensils, Plus, Search, Trash2, Edit3, Heart, Clock, Users, Play, Pause, RotateCcw,
  MapPin, Star, Sparkles, X, Upload, Check, Bookmark, ChefHat, User, Activity,
  Download, FolderUp, CheckCircle2, AlertCircle
} from 'lucide-react';

const FALLBACK_RECIPE_PHOTO = '/recipe.jpg';
const FALLBACK_DISCOVERED_PHOTO = '/recipe.jpg';

const COLOR_OPTIONS = [
  { name: 'Amber Gold', value: '#f59e0b' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Ocean Blue', value: '#3b82f6' },
  { name: 'Royal Purple', value: '#8b5cf6' },
  { name: 'Rose Crimson', value: '#f43f5e' },
  { name: 'Teal Mint', value: '#14b8a6' },
];

const CATEGORIES = ['All', 'Favorites', 'Italian', 'Japanese', 'Dinner', 'Breakfast', 'Dessert', 'Snack'];

const STORAGE_KEYS = {
  RECIPES: 'irsov_recipes_v1',
  DISCOVERED: 'irsov_discovered_v1',
  TITLE: 'irsov_title_v1',
  SEEDED: 'irsov_seeded_v1',
};

const calculateNutritionFromIngredients = (ingredientsText) => {
  const lines = ingredientsText.toLowerCase().split('\n');
  let totalCals = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;
  let totalFiber = 0;

  lines.forEach((line) => {
    if (!line.trim()) return;

    const matchNum = line.match(/(\d+(\.\d+)?)/);
    const amount = matchNum ? parseFloat(matchNum[0]) : 1;

    let multiplier = amount;
    if (line.includes('kg')) multiplier = amount * 1000;
    else if (line.includes('oz')) multiplier = amount * 28.35;
    else if (line.includes('cup') || line.includes('cups')) multiplier = amount * 150;
    else if (line.includes('tbsp')) multiplier = amount * 15;
    else if (line.includes('tsp')) multiplier = amount * 5;
    else if (!line.includes('g') && !line.includes('gram')) {
      multiplier = amount < 10 ? amount * 100 : amount;
    }

    let calsPer100 = 100, pPer100 = 5, cPer100 = 15, fPer100 = 3, fiPer100 = 1;

    if (line.includes('chicken') || line.includes('turkey')) {
      calsPer100 = 165; pPer100 = 31; cPer100 = 0; fPer100 = 3.6; fiPer100 = 0;
    } else if (line.includes('salmon') || line.includes('fish') || line.includes('tuna')) {
      calsPer100 = 206; pPer100 = 22; cPer100 = 0; fPer100 = 12; fiPer100 = 0;
    } else if (line.includes('beef') || line.includes('steak') || line.includes('pork')) {
      calsPer100 = 250; pPer100 = 26; cPer100 = 0; fPer100 = 15; fiPer100 = 0;
    } else if (line.includes('shrimp') || line.includes('prawn')) {
      calsPer100 = 99; pPer100 = 24; cPer100 = 0.2; fPer100 = 0.3; fiPer100 = 0;
    } else if (line.includes('egg')) {
      calsPer100 = 155; pPer100 = 13; cPer100 = 1.1; fPer100 = 11; fiPer100 = 0;
    } else if (line.includes('rice') || line.includes('pasta') || line.includes('noodle')) {
      calsPer100 = 130; pPer100 = 2.7; cPer100 = 28; fPer100 = 0.3; fiPer100 = 0.4;
    } else if (line.includes('bread') || line.includes('flour')) {
      calsPer100 = 265; pPer100 = 9; cPer100 = 49; fPer100 = 3.2; fiPer100 = 2.7;
    } else if (line.includes('oats') || line.includes('oatmeal')) {
      calsPer100 = 389; pPer100 = 16.9; cPer100 = 66.3; fPer100 = 6.9; fiPer100 = 10.6;
    } else if (line.includes('potato')) {
      calsPer100 = 87; pPer100 = 1.9; cPer100 = 20; fPer100 = 0.1; fiPer100 = 1.8;
    } else if (line.includes('oil') || line.includes('butter')) {
      calsPer100 = 884; pPer100 = 0; cPer100 = 0; fPer100 = 100; fiPer100 = 0;
    } else if (line.includes('cheese')) {
      calsPer100 = 402; pPer100 = 25; cPer100 = 1.3; fPer100 = 33; fiPer100 = 0;
    } else if (line.includes('avocado')) {
      calsPer100 = 160; pPer100 = 2; cPer100 = 8.5; fPer100 = 14.7; fiPer100 = 6.7;
    } else if (line.includes('broccoli') || line.includes('spinach') || line.includes('salad') || line.includes('veggie') || line.includes('mushroom')) {
      calsPer100 = 34; pPer100 = 2.8; cPer100 = 7; fPer100 = 0.4; fiPer100 = 3.3;
    } else if (line.includes('beans') || line.includes('edamame') || line.includes('lentils')) {
      calsPer100 = 120; pPer100 = 9; cPer100 = 22; fPer100 = 1.5; fiPer100 = 6;
    } else if (line.includes('milk') || line.includes('cream')) {
      calsPer100 = 60; pPer100 = 3.4; cPer100 = 5; fPer100 = 3.3; fiPer100 = 0;
    }

    const scale = multiplier / 100;
    totalCals += calsPer100 * scale;
    totalProtein += pPer100 * scale;
    totalCarbs += cPer100 * scale;
    totalFats += fPer100 * scale;
    totalFiber += fiPer100 * scale;
  });

  return {
    calories: Math.round(totalCals) || 350,
    protein: Math.round(totalProtein) || 20,
    carbs: Math.round(totalCarbs) || 35,
    fats: Math.round(totalFats) || 12,
    fiber: Math.round(totalFiber) || 4,
  };
};

const scaleIngredientLine = (line, ratio) => {
  if (ratio === 1) return line;
  return line.replace(/^(\d+(\.\d+)?)/, (match) => {
    const scaled = parseFloat(match) * ratio;
    return Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1);
  });
};

const INITIAL_RECIPES = [
  {
    id: 'rec_1',
    title: 'Truffle Mushroom Risotto',
    category: 'Italian',
    cookTime: 35,
    servings: 4,
    calories: 420,
    protein: 12,
    carbs: 58,
    fats: 16,
    fiber: 5,
    isFavorite: true,
    author: 'Mom',
    color: '#f59e0b',
    photo: FALLBACK_RECIPE_PHOTO,
    ingredients: [
      '1.5 cups Arborio rice',
      '4 cups Warm vegetable broth',
      '200g Mixed wild mushrooms, sliced',
      '2 tbsp Truffle oil',
      '0.5 cup Shallots, finely diced',
      '0.5 cup Grated Parmesan'
    ],
    instructions: [
      'Saute shallots and mushrooms in olive oil until golden.',
      'Add Arborio rice and toast for 2 minutes until translucent at edges.',
      'Ladle in warm broth slowly, stirring constantly until absorbed.',
      'Finish with parmesan and drizzle with black truffle oil before serving.'
    ]
  },
  {
    id: 'rec_2',
    title: 'Pan-Seared Salmon Bowl',
    category: 'Japanese',
    cookTime: 20,
    servings: 2,
    calories: 520,
    protein: 34,
    carbs: 42,
    fats: 22,
    fiber: 7,
    isFavorite: false,
    author: 'James',
    color: '#3b82f6',
    photo: FALLBACK_RECIPE_PHOTO,
    ingredients: [
      '200g Salmon fillets',
      '150g Steamed Jasmine rice',
      '1 Avocado, sliced',
      '100g Edamame, steamed',
      '2 tbsp Soy glaze / Teriyaki sauce'
    ],
    instructions: [
      'Season salmon with salt and pepper.',
      'Sear salmon skin-side down in a hot skillet for 4 minutes, flip and cook 3 minutes.',
      'Assemble rice bowls with sliced avocado, edamame, and crispy salmon.',
      'Drizzle with soy glaze and top with toasted sesame seeds.'
    ]
  }
];

const INITIAL_DISCOVERED = [
  {
    id: 'disc_1',
    restaurant: 'Le Petit Bistro',
    location: 'Downtown Arts District',
    dishName: 'Smoked Bone Marrow & Brioche',
    rating: 5,
    priceTier: '$$$',
    tastingNotes: 'Rich, buttery bone marrow topped with crispy parsley gremolata. Served with toasted house-made brioche.',
    recreateAtHome: true,
    photo: FALLBACK_DISCOVERED_PHOTO,
    dateAdded: '2026-10-18'
  }
];

const handleOfflineImageError = (e, fallbackSrc) => {
  if (e.currentTarget.dataset.fallbackApplied) return;
  e.currentTarget.dataset.fallbackApplied = 'true';
  e.currentTarget.src = fallbackSrc;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('recipes');

  const [recipes, setRecipes] = useState(() => {
    try {
      const seeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
      const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (seeded === 'true') {
        return saved ? JSON.parse(saved) : [];
      }
      localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(INITIAL_RECIPES));
      return INITIAL_RECIPES;
    } catch {
      return INITIAL_RECIPES;
    }
  });

  const [discoveredFoods, setDiscoveredFoods] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISCOVERED);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      localStorage.setItem(STORAGE_KEYS.DISCOVERED, JSON.stringify(INITIAL_DISCOVERED));
      return INITIAL_DISCOVERED;
    } catch {
      return INITIAL_DISCOVERED;
    }
  });

  const [appTitle, setAppTitle] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.TITLE) || "IRSOV'S";
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isDiscoveredModalOpen, setIsDiscoveredModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editingDiscovered, setEditingDiscovered] = useState(null);
  const [activeCookModeRecipe, setActiveCookModeRecipe] = useState(null);
  const [cookServings, setCookServings] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [recipeForm, setRecipeForm] = useState({
    title: '',
    category: 'Dinner',
    cookTime: 25,
    servings: 2,
    calories: 350,
    protein: 20,
    carbs: 40,
    fats: 12,
    fiber: 4,
    author: '',
    color: '#f59e0b',
    photo: '',
    ingredientsText: '',
    instructionsText: ''
  });

  const [discoveredForm, setDiscoveredForm] = useState({
    restaurant: '',
    location: '',
    dishName: '',
    rating: 5,
    priceTier: '$$',
    tastingNotes: '',
    recreateAtHome: false,
    photo: ''
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const persistRecipes = (nextRecipes) => {
    setRecipes(nextRecipes);
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(nextRecipes));
      localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
      return true;
    } catch {
      showToast('Storage full! Try using a smaller photo.', 'error');
      return false;
    }
  };

  const persistDiscovered = (nextDiscovered) => {
    setDiscoveredFoods(nextDiscovered);
    try {
      localStorage.setItem(STORAGE_KEYS.DISCOVERED, JSON.stringify(nextDiscovered));
      return true;
    } catch {
      showToast('Storage full! Try using a smaller photo.', 'error');
      return false;
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TITLE, appTitle);
    } catch {}
  }, [appTitle]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPendingDelete(null);
        setIsRecipeModalOpen(false);
        setIsDiscoveredModalOpen(false);
        setActiveCookModeRecipe(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const resetRecipeForm = () => {
    setRecipeForm({
      title: '',
      category: 'Dinner',
      cookTime: 25,
      servings: 2,
      calories: 350,
      protein: 20,
      carbs: 40,
      fats: 12,
      fiber: 4,
      author: '',
      color: '#f59e0b',
      photo: '',
      ingredientsText: '',
      instructionsText: ''
    });
  };

  const resetDiscoveredForm = () => {
    setDiscoveredForm({
      restaurant: '',
      location: '',
      dishName: '',
      rating: 5,
      priceTier: '$$',
      tastingNotes: '',
      recreateAtHome: false,
      photo: ''
    });
  };

  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
        callback(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleIngredientsChange = (text) => {
    const nutrition = calculateNutritionFromIngredients(text);
    setRecipeForm(prev => ({
      ...prev,
      ingredientsText: text,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fats: nutrition.fats,
      fiber: nutrition.fiber
    }));
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ appTitle, recipes, discoveredFoods, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded!');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed.recipes)) persistRecipes(parsed.recipes);
        if (Array.isArray(parsed.discoveredFoods)) persistDiscovered(parsed.discoveredFoods);
        if (parsed.appTitle) setAppTitle(parsed.appTitle);
        showToast('Backup restored!');
      } catch {
        showToast('Invalid backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveRecipe = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const ingredients = recipeForm.ingredientsText.split('\n').filter(i => i.trim() !== '');
    const instructions = recipeForm.instructionsText.split('\n').filter(i => i.trim() !== '');
    const wasEditing = Boolean(editingRecipe);
    const targetId = editingRecipe ? editingRecipe.id : 'rec_' + Date.now();

    const newRecipeData = {
      id: targetId,
      title: recipeForm.title.trim() || 'Untitled Dish',
      category: recipeForm.category,
      cookTime: Number(recipeForm.cookTime) || 15,
      servings: Number(recipeForm.servings) || 1,
      calories: Number(recipeForm.calories) || 0,
      protein: Number(recipeForm.protein) || 0,
      carbs: Number(recipeForm.carbs) || 0,
      fats: Number(recipeForm.fats) || 0,
      fiber: Number(recipeForm.fiber) || 0,
      author: recipeForm.author.trim() || 'Family Member',
      color: recipeForm.color || '#f59e0b',
      photo: recipeForm.photo || FALLBACK_RECIPE_PHOTO,
      ingredients,
      instructions,
      isFavorite: editingRecipe ? editingRecipe.isFavorite : false,
      updatedAt: new Date().toISOString()
    };

    const nextRecipes = wasEditing
      ? recipes.map(r => (r.id === targetId ? newRecipeData : r))
      : [newRecipeData, ...recipes];

    persistRecipes(nextRecipes);
    setSelectedCategory('All');
    setSelectedAuthor('All');
    setSearchQuery('');
    setIsRecipeModalOpen(false);
    setEditingRecipe(null);
    resetRecipeForm();
    showToast(wasEditing ? 'Recipe updated!' : 'Recipe saved!');
  };

  const openRecipeEdit = (recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      title: recipe.title,
      category: recipe.category,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      calories: recipe.calories || 0,
      protein: recipe.protein || 0,
      carbs: recipe.carbs || 0,
      fats: recipe.fats || 0,
      fiber: recipe.fiber || 0,
      author: recipe.author || '',
      color: recipe.color || '#f59e0b',
      photo: recipe.photo,
      ingredientsText: recipe.ingredients ? recipe.ingredients.join('\n') : '',
      instructionsText: recipe.instructions ? recipe.instructions.join('\n') : ''
    });
    setIsRecipeModalOpen(true);
  };

  const toggleFavorite = (id) => {
    const nextRecipes = recipes.map(r => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
    persistRecipes(nextRecipes);
  };

  const handleSaveDiscovered = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const wasEditing = Boolean(editingDiscovered);
    const targetId = editingDiscovered ? editingDiscovered.id : 'disc_' + Date.now();

    const newDiscoveredData = {
      id: targetId,
      restaurant: discoveredForm.restaurant.trim() || 'Unknown Restaurant',
      location: discoveredForm.location.trim() || 'Local Area',
      dishName: discoveredForm.dishName.trim() || 'Tasty Dish',
      rating: Number(discoveredForm.rating),
      priceTier: discoveredForm.priceTier,
      tastingNotes: discoveredForm.tastingNotes.trim(),
      recreateAtHome: discoveredForm.recreateAtHome,
      photo: discoveredForm.photo || FALLBACK_DISCOVERED_PHOTO,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    const nextDiscovered = wasEditing
      ? discoveredFoods.map(d => (d.id === targetId ? newDiscoveredData : d))
      : [newDiscoveredData, ...discoveredFoods];

    persistDiscovered(nextDiscovered);
    setSearchQuery('');
    setIsDiscoveredModalOpen(false);
    setEditingDiscovered(null);
    resetDiscoveredForm();
    showToast(wasEditing ? 'Discovery updated!' : 'Discovery saved!');
  };

  const openDiscoveredEdit = (item) => {
    setEditingDiscovered(item);
    setDiscoveredForm({
      restaurant: item.restaurant,
      location: item.location,
      dishName: item.dishName,
      rating: item.rating,
      priceTier: item.priceTier,
      tastingNotes: item.tastingNotes,
      recreateAtHome: item.recreateAtHome,
      photo: item.photo
    });
    setIsDiscoveredModalOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    setPendingDelete(null);

    if (type === 'recipe') {
      persistRecipes(recipes.filter(r => r.id !== id));
      showToast('Recipe deleted!');
    } else {
      persistDiscovered(discoveredFoods.filter(d => d.id !== id));
      showToast('Discovery deleted!');
    }
  };

  const openCookMode = (recipe) => {
    setActiveCookModeRecipe(recipe);
    setCookServings(recipe.servings || 1);
    setCheckedIngredients({});
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const startTimer = (minutes) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const familyAuthors = useMemo(() => {
    const authors = new Set(recipes.map(r => r.author).filter(Boolean));
    return ['All', ...Array.from(authors)];
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return recipes.filter(r => {
      const matchesSearch =
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.author && r.author.toLowerCase().includes(q));

      const matchesAuthor = selectedAuthor === 'All' || r.author === selectedAuthor;

      if (!matchesSearch || !matchesAuthor) return false;
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Favorites') return r.isFavorite;
      return r.category === selectedCategory;
    });
  }, [recipes, searchQuery, selectedCategory, selectedAuthor]);

  const filteredDiscovered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return discoveredFoods.filter(d =>
      d.dishName.toLowerCase().includes(q) ||
      d.restaurant.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q)
    );
  }, [discoveredFoods, searchQuery]);

  const servingRatio = activeCookModeRecipe
    ? cookServings / (activeCookModeRecipe.servings || 1)
    : 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-amber-500 selection:text-slate-950">

      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/recipe.jpg"
              alt="App Logo"
              onError={(e) => handleOfflineImageError(e, FALLBACK_RECIPE_PHOTO)}
              className="w-9 h-9 rounded-xl object-cover border border-slate-800 shrink-0"
            />
            {isEditingTitle ? (
              <input
                type="text"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="text-lg font-extrabold text-amber-400 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-0.5 outline-none w-36"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1.5 text-left truncate group"
                title="Tap to rename"
              >
                <span className="text-lg md:text-xl font-extrabold tracking-tight text-white group-hover:text-amber-400 truncate">
                  {appTitle}
                </span>
                <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>
            )}
          </div>

          {activeTab === 'recipes' ? (
            <button
              type="button"
              onClick={() => { resetRecipeForm(); setEditingRecipe(null); setIsRecipeModalOpen(true); }}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap shrink-0 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Recipe</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { resetDiscoveredForm(); setEditingDiscovered(null); setIsDiscoveredModalOpen(true); }}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap shrink-0 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Dish</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-4 space-y-4">

        <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'recipes'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ChefHat className="w-4 h-4 shrink-0" />
            <span>Recipes ({recipes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discovered')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeTab === 'discovered'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Discovered ({discoveredFoods.length})</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'recipes' ? "Search recipes or family chef..." : "Search restaurants or dishes..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {activeTab === 'recipes' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {familyAuthors.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {familyAuthors.map((author) => (
                  <button
                    key={author}
                    type="button"
                    onClick={() => setSelectedAuthor(author)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                      selectedAuthor === author
                        ? 'bg-slate-100 text-slate-950 border-white font-bold'
                        : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {author === 'All' ? 'All Chefs' : author}
                  </button>
                ))}
              </div>
            )}

            {filteredRecipes.length === 0 ? (
              <div className="text-center py-14 px-4 bg-slate-900/50 rounded-2xl border border-slate-800/80">
                <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
                <h3 className="text-base font-bold text-slate-200">No recipes here yet</h3>
                <p className="text-xs text-slate-500 mt-1">Tap Add Recipe above to create your first dish.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col"
                  >
                    <div className="relative h-44 bg-slate-800">
                      <img
                        src={recipe.photo || FALLBACK_RECIPE_PHOTO}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        onError={(e) => handleOfflineImageError(e, FALLBACK_RECIPE_PHOTO)}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(recipe.id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/75 text-slate-300 hover:text-rose-400"
                      >
                        <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>

                      {recipe.author && (
                        <span
                          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow flex items-center gap-1"
                          style={{ backgroundColor: recipe.color || '#f59e0b' }}
                        >
                          <User className="w-3 h-3" /> {recipe.author}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-amber-400">{recipe.category}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" /> {recipe.cookTime}m • {recipe.calories || 0} kcal
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-white mt-1 line-clamp-1">{recipe.title}</h3>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => openCookMode(recipe)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-100 font-semibold py-2 px-3 rounded-xl text-xs transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Cook
                        </button>
                        <button
                          type="button"
                          onClick={() => openRecipeEdit(recipe)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ type: 'recipe', id: recipe.id, name: recipe.title })}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'discovered' && (
          <div>
            {filteredDiscovered.length === 0 ? (
              <div className="text-center py-14 px-4 bg-slate-900/50 rounded-2xl border border-slate-800/80">
                <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2.5" />
                <h3 className="text-base font-bold text-slate-200">No dining discoveries yet</h3>
                <p className="text-xs text-slate-500 mt-1">Tap Add Dish above to save restaurant favorites.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDiscovered.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col sm:flex-row"
                  >
                    <div className="sm:w-2/5 relative h-44 sm:h-auto bg-slate-800">
                      <img
                        src={item.photo || FALLBACK_DISCOVERED_PHOTO}
                        alt={item.dishName}
                        className="w-full h-full object-cover"
                        onError={(e) => handleOfflineImageError(e, FALLBACK_DISCOVERED_PHOTO)}
                      />
                      {item.recreateAtHome && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase rounded-md">
                          To Recreate
                        </span>
                      )}
                    </div>

                    <div className="p-4 sm:w-3/5 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-white text-sm sm:text-base">{item.dishName}</h3>
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            {item.priceTier}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{item.restaurant} • {item.location}</span>
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                            />
                          ))}
                        </div>
                        {item.tastingNotes && (
                          <p className="text-xs text-slate-300 mt-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 italic line-clamp-2">
                            "{item.tastingNotes}"
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDiscoveredEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ type: 'discovered', id: item.id, name: item.dishName })}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500">
          <span>Offline storage active</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleExportBackup} className="flex items-center gap-1 hover:text-slate-300">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <label className="flex items-center gap-1 hover:text-slate-300 cursor-pointer">
              <FolderUp className="w-3.5 h-3.5" /> Import
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>
      </main>

      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
              </h2>
              <button
                type="button"
                onClick={() => setIsRecipeModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Recipe Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Garlic Butter Shrimp Pasta"
                    value={recipeForm.title}
                    onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
                  <select
                    value={recipeForm.category}
                    onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.filter(c => c !== 'All' && c !== 'Favorites').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Created By</label>
                  <input
                    type="text"
                    placeholder="Family member name"
                    value={recipeForm.author}
                    onChange={(e) => setRecipeForm({ ...recipeForm, author: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Card Color</label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setRecipeForm({ ...recipeForm, color: color.value })}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          recipeForm.color === color.value ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cook Time (m)</label>
                  <input
                    type="number"
                    min="1"
                    value={recipeForm.cookTime}
                    onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Servings</label>
                  <input
                    type="number"
                    min="1"
                    value={recipeForm.servings}
                    onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Calories</label>
                  <input
                    type="number"
                    min="0"
                    value={recipeForm.calories}
                    onChange={(e) => setRecipeForm({ ...recipeForm, calories: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> Macros & Fiber
                  </span>
                  <span className="text-[11px] text-emerald-400">Auto-calculated from ingredients</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-rose-400 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={recipeForm.protein}
                      onChange={(e) => setRecipeForm({ ...recipeForm, protein: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-amber-400 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={recipeForm.carbs}
                      onChange={(e) => setRecipeForm({ ...recipeForm, carbs: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-emerald-400 mb-1">Fiber (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={recipeForm.fiber}
                      onChange={(e) => setRecipeForm({ ...recipeForm, fiber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-400 mb-1">Fats (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={recipeForm.fats}
                      onChange={(e) => setRecipeForm({ ...recipeForm, fats: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dish Photo</label>
                <div className="relative border-2 border-dashed border-slate-700/70 hover:border-amber-500/60 rounded-2xl p-4 text-center bg-slate-950/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setRecipeForm({ ...recipeForm, photo: base64 }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {recipeForm.photo ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={recipeForm.photo} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-700" />
                      <div className="text-left">
                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Photo ready
                        </p>
                        <p className="text-[11px] text-slate-500">Tap to replace</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-semibold">
                      <Upload className="w-4 h-4" />
                      <span>Upload Dish Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ingredients (One per line)</label>
                <textarea
                  rows="4"
                  placeholder="200g chicken breast&#10;150g white rice&#10;100g broccoli"
                  value={recipeForm.ingredientsText}
                  onChange={(e) => handleIngredientsChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Instructions (One step per line)</label>
                <textarea
                  rows="4"
                  placeholder="Prep ingredients&#10;Heat pan over medium heat..."
                  value={recipeForm.instructionsText}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructionsText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDiscoveredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl my-8 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingDiscovered ? 'Edit Dining Entry' : 'Log Discovered Dish'}
              </h2>
              <button
                type="button"
                onClick={() => setIsDiscoveredModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscovered} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Crispy Duck Confit"
                  value={discoveredForm.dishName}
                  onChange={(e) => setDiscoveredForm({ ...discoveredForm, dishName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Restaurant</label>
                  <input
                    type="text"
                    placeholder="e.g. Bistro Central"
                    value={discoveredForm.restaurant}
                    onChange={(e) => setDiscoveredForm({ ...discoveredForm, restaurant: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown"
                    value={discoveredForm.location}
                    onChange={(e) => setDiscoveredForm({ ...discoveredForm, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Rating</label>
                  <select
                    value={discoveredForm.rating}
                    onChange={(e) => setDiscoveredForm({ ...discoveredForm, rating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Price</label>
                  <select
                    value={discoveredForm.priceTier}
                    onChange={(e) => setDiscoveredForm({ ...discoveredForm, priceTier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="$">$</option>
                    <option value="$$">$$</option>
                    <option value="$$$">$$$</option>
                    <option value="$$$$">$$$$</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dish Photo</label>
                <div className="relative border-2 border-dashed border-slate-700/70 hover:border-emerald-500/60 rounded-2xl p-4 text-center bg-slate-950/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setDiscoveredForm({ ...discoveredForm, photo: base64 }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {discoveredForm.photo ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={discoveredForm.photo} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-700" />
                      <div className="text-left">
                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Photo ready
                        </p>
                        <p className="text-[11px] text-slate-500">Tap to replace</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold">
                      <Upload className="w-4 h-4" />
                      <span>Upload Dish Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tasting Notes</label>
                <textarea
                  rows="3"
                  placeholder="Describe flavors, texture, or highlights..."
                  value={discoveredForm.tastingNotes}
                  onChange={(e) => setDiscoveredForm({ ...discoveredForm, tastingNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discoveredForm.recreateAtHome}
                  onChange={(e) => setDiscoveredForm({ ...discoveredForm, recreateAtHome: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>Want to recreate at home</span>
              </label>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDiscoveredModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete {pendingDelete.type === 'recipe' ? 'Recipe' : 'Discovery'}?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Remove <span className="text-slate-200 font-semibold">"{pendingDelete.name}"</span>? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCookModeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{activeCookModeRecipe.title}</h2>
                <p className="text-xs text-slate-400">
                  Chef <span className="text-amber-400 font-semibold">{activeCookModeRecipe.author || 'Family Member'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCookModeRecipe(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" /> Servings
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCookServings(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-amber-400 min-w-[4rem] text-center">
                      {cookServings} {cookServings === 1 ? 'serving' : 'servings'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCookServings(prev => prev + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 text-center">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Cals</div>
                    <div className="text-sm font-extrabold text-amber-400">
                      {Math.round((activeCookModeRecipe.calories || 0) * servingRatio)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Protein</div>
                    <div className="text-sm font-extrabold text-rose-400">
                      {Math.round((activeCookModeRecipe.protein || 0) * servingRatio)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Carbs</div>
                    <div className="text-sm font-extrabold text-amber-400">
                      {Math.round((activeCookModeRecipe.carbs || 0) * servingRatio)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Fiber</div>
                    <div className="text-sm font-extrabold text-emerald-400">
                      {Math.round((activeCookModeRecipe.fiber || 0) * servingRatio)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Fats</div>
                    <div className="text-sm font-extrabold text-blue-400">
                      {Math.round((activeCookModeRecipe.fats || 0) * servingRatio)}g
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Kitchen Timer
                  </h4>
                  <div className="text-2xl font-mono font-bold text-white mt-0.5">
                    {formatTimer(timerSeconds)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isTimerRunning ? (
                    <button
                      type="button"
                      onClick={() => startTimer(activeCookModeRecipe.cookTime || 10)}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start ({activeCookModeRecipe.cookTime || 10}m)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(false)}
                      className="flex items-center gap-1.5 bg-rose-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }}
                    className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-amber-400" /> Ingredients
                  </h3>
                  <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
                    {activeCookModeRecipe.ingredients?.length > 0 ? (
                      activeCookModeRecipe.ingredients.map((ing, idx) => {
                        const isChecked = Boolean(checkedIngredients[idx]);
                        return (
                          <label key={idx} className="flex items-center gap-2.5 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              className="w-4 h-4 rounded accent-amber-500"
                            />
                            <span className={isChecked ? 'line-through text-slate-500' : 'text-slate-200'}>
                              {scaleIngredientLine(ing, servingRatio)}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 italic">No ingredients listed.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-400" /> Steps
                  </h3>
                  <div className="space-y-2.5">
                    {activeCookModeRecipe.instructions?.length > 0 ? (
                      activeCookModeRecipe.instructions.map((step, idx) => (
                        <div key={idx} className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 flex gap-2.5 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No instructions listed.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCookModeRecipe(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 font-bold px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm ${
            toast.type === 'error'
              ? 'bg-rose-500 text-white'
              : 'bg-emerald-500 text-slate-950'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}