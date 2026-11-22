import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  Utensils, Plus, Search, Trash2, Edit3, Heart, Clock, Users, Play, Pause, RotateCcw, 
  MapPin, Star, Sparkles, X, Upload, Flame, Check, Bookmark, ChefHat, User, Activity,
  Download, FolderUp, CheckCircle2, AlertCircle
} from 'lucide-react';

// Firebase configuration - falls back gracefully to local storage when offline or in demo mode
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForTastyLogStorageSync123",
  authDomain: "tastylog-app.firebaseapp.com",
  projectId: "tastylog-app",
  storageBucket: "tastylog-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase initialized in offline/local mode.");
}

const COLOR_OPTIONS = [
  { name: 'Amber Gold', value: '#f59e0b' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Ocean Blue', value: '#3b82f6' },
  { name: 'Royal Purple', value: '#8b5cf6' },
  { name: 'Rose Crimson', value: '#f43f5e' },
  { name: 'Teal Mint', value: '#14b8a6' },
];

const CATEGORIES = ['All', 'Favorites', 'Italian', 'Japanese', 'Dinner', 'Breakfast', 'Dessert', 'Snack'];

// Automated Calorie, Macro & Fiber Calculator from Ingredient Lines
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

// Helper: Scale ingredient text numbers when adjusting servings in Cook Mode
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
    photo: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&q=80&w=800',
    ingredients: [
      '1.5 cups Arborio rice',
      '4 cups Warm vegetable broth',
      '200g Mixed wild mushrooms, sliced',
      '2 tbsp Truffle oil',
      '0.5 cup Shallots, finely diced',
      '0.5 cup Grated Parmesan'
    ],
    instructions: [
      'Sauté shallots and mushrooms in olive oil until golden.',
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
    photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
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
    photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
    dateAdded: '2026-10-18'
  }
];

export default function App() {
  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState('recipes');
  const [recipes, setRecipes] = useState([]);
  const [discoveredFoods, setDiscoveredFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');

  // Modals & UI Feedback State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isDiscoveredModalOpen, setIsDiscoveredModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editingDiscovered, setEditingDiscovered] = useState(null);
  const [activeCookModeRecipe, setActiveCookModeRecipe] = useState(null);
  const [cookServings, setCookServings] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  // Editable App Branding
  const [appTitle, setAppTitle] = useState('TastyLog');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Cooking Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Recipe Form State
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

  // Discovered Form State
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
    setTimeout(() => setToast(null), 3200);
  }, []);

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

  // Load Initial Data
  useEffect(() => {
    const savedRecipes = localStorage.getItem('tastylog_recipes');
    const savedDiscovered = localStorage.getItem('tastylog_discovered');
    const savedTitle = localStorage.getItem('tastylog_title');

    if (savedTitle) setAppTitle(savedTitle);

    if (savedRecipes) {
      try { setRecipes(JSON.parse(savedRecipes)); } catch { setRecipes(INITIAL_RECIPES); }
    } else {
      setRecipes(INITIAL_RECIPES);
    }

    if (savedDiscovered) {
      try { setDiscoveredFoods(JSON.parse(savedDiscovered)); } catch { setDiscoveredFoods(INITIAL_DISCOVERED); }
    } else {
      setDiscoveredFoods(INITIAL_DISCOVERED);
    }

    if (db) {
      try {
        const qRecipes = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
        const unsubscribeRecipes = onSnapshot(qRecipes, (snapshot) => {
          if (!snapshot.empty) {
            const fbData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setRecipes(fbData);
          }
        }, () => console.log('Firebase offline mode active'));

        return () => unsubscribeRecipes && unsubscribeRecipes();
      } catch {
        console.log("Firebase listener unavailable");
      }
    }
  }, []);

  // Safe LocalStorage Persistence
  useEffect(() => {
    try {
      localStorage.setItem('tastylog_recipes', JSON.stringify(recipes));
    } catch {
      console.warn("LocalStorage quota limit reached for recipes.");
    }
  }, [recipes]);

  useEffect(() => {
    try {
      localStorage.setItem('tastylog_discovered', JSON.stringify(discoveredFoods));
    } catch {
      console.warn("LocalStorage quota limit reached for discoveries.");
    }
  }, [discoveredFoods]);

  useEffect(() => {
    try {
      localStorage.setItem('tastylog_title', appTitle);
    } catch {
      console.warn("LocalStorage quota limit reached for title.");
    }
  }, [appTitle]);

  // Keyboard Escape handler to close active modals cleanly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsRecipeModalOpen(false);
        setIsDiscoveredModalOpen(false);
        setActiveCookModeRecipe(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cooking Timer
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Image Compression & Resize Helper (Prevents large photo upload failures)
  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
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

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
        callback(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Auto-calculate Calories, Macros & Fiber when ingredients change
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

  // Export & Import JSON Backup
  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ appTitle, recipes, discoveredFoods, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appTitle.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Family recipe backup downloaded!');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed.recipes)) setRecipes(parsed.recipes);
        if (Array.isArray(parsed.discoveredFoods)) setDiscoveredFoods(parsed.discoveredFoods);
        if (parsed.appTitle) setAppTitle(parsed.appTitle);
        showToast('Backup restored successfully!');
      } catch {
        showToast('Invalid backup file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Save Recipe
  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    const ingredients = recipeForm.ingredientsText.split('\n').filter(i => i.trim() !== '');
    const instructions = recipeForm.instructionsText.split('\n').filter(i => i.trim() !== '');

    const newRecipeData = {
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
      photo: recipeForm.photo || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800',
      ingredients,
      instructions,
      isFavorite: editingRecipe ? editingRecipe.isFavorite : false,
      updatedAt: new Date().toISOString()
    };

    const wasEditing = Boolean(editingRecipe);

    if (editingRecipe) {
      setRecipes(prev => prev.map(r => r.id === editingRecipe.id ? { ...newRecipeData, id: editingRecipe.id } : r));
      if (db) {
        try { await updateDoc(doc(db, 'recipes', editingRecipe.id), newRecipeData); } catch {}
      }
    } else {
      const newId = 'rec_' + Date.now();
      setRecipes(prev => [{ ...newRecipeData, id: newId }, ...prev]);
      if (db) {
        try { await addDoc(collection(db, 'recipes'), { ...newRecipeData, createdAt: serverTimestamp() }); } catch {}
      }
    }

    setIsRecipeModalOpen(false);
    setEditingRecipe(null);
    resetRecipeForm();
    showToast(wasEditing ? 'Recipe updated!' : 'Recipe saved to family book!');
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
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  };

  const deleteRecipe = (id) => {
    if (!window.confirm('Delete this recipe from your family collection?')) return;
    setRecipes(prev => prev.filter(r => r.id !== id));
    if (db) {
      try { deleteDoc(doc(db, 'recipes', id)); } catch {}
    }
    showToast('Recipe removed.');
  };

  // Save Discovered Dining Entry
  const handleSaveDiscovered = async (e) => {
    e.preventDefault();
    const newDiscoveredData = {
      restaurant: discoveredForm.restaurant.trim() || 'Unknown Restaurant',
      location: discoveredForm.location.trim() || 'Local Area',
      dishName: discoveredForm.dishName.trim() || 'Tasty Dish',
      rating: Number(discoveredForm.rating),
      priceTier: discoveredForm.priceTier,
      tastingNotes: discoveredForm.tastingNotes.trim(),
      recreateAtHome: discoveredForm.recreateAtHome,
      photo: discoveredForm.photo || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    const wasEditing = Boolean(editingDiscovered);

    if (editingDiscovered) {
      setDiscoveredFoods(prev => prev.map(d => d.id === editingDiscovered.id ? { ...newDiscoveredData, id: editingDiscovered.id } : d));
    } else {
      const newId = 'disc_' + Date.now();
      setDiscoveredFoods(prev => [{ ...newDiscoveredData, id: newId }, ...prev]);
    }

    setIsDiscoveredModalOpen(false);
    setEditingDiscovered(null);
    resetDiscoveredForm();
    showToast(wasEditing ? 'Dining note updated!' : 'Dining discovery saved!');
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

  const deleteDiscovered = (id) => {
    if (!window.confirm('Delete this dining discovery?')) return;
    setDiscoveredFoods(prev => prev.filter(d => d.id !== id));
    showToast('Entry deleted.');
  };

  // Start Cook Mode
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

  // Unique Family Authors List
  const familyAuthors = useMemo(() => {
    const authors = new Set(recipes.map(r => r.author).filter(Boolean));
    return ['All', ...Array.from(authors)];
  }, [recipes]);

  // Memoized Filtering
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

  // Serving Ratio for Active Cook Mode
  const servingRatio = activeCookModeRecipe
    ? cookServings / (activeCookModeRecipe.servings || 1)
    : 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-amber-500 selection:text-slate-950">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-slate-900/85 backdrop-blur-lg border-b border-slate-800/80 px-4 py-3.5 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          {/* Editable App Title & Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/recipe.jpg" 
              alt="App Logo" 
              className="w-10 h-10 rounded-2xl object-cover shadow-lg border border-slate-700/60"
            />
            {isEditingTitle ? (
              <input 
                type="text" 
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="text-xl md:text-2xl font-black text-amber-400 bg-slate-800 border border-amber-500/50 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <div 
                onClick={() => setIsEditingTitle(true)} 
                className="group flex items-center gap-2 cursor-pointer"
                title="Click to rename app"
              >
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  {appTitle}
                </h1>
                <Edit3 className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100 transition-all" />
              </div>
            )}
          </div>

          {/* Right Toolbar: Backup + Primary Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              title="Download JSON Backup"
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              title="Restore JSON Backup"
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
            >
              <FolderUp className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>

            {activeTab === 'recipes' ? (
              <button
                onClick={() => { resetRecipeForm(); setEditingRecipe(null); setIsRecipeModalOpen(true); }}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 text-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Recipe</span>
              </button>
            ) : (
              <button
                onClick={() => { resetDiscoveredForm(); setEditingDiscovered(null); setIsDiscoveredModalOpen(true); }}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 text-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Log Discovery</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
        
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'recipes'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              Family Recipes ({recipes.length})
            </button>
            <button
              onClick={() => setActiveTab('discovered')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'discovered'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Discovered Food ({discoveredFoods.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'recipes' ? "Search dishes, categories, or family chef..." : "Search restaurant, dish, or notes..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>
        </div>

        {/* RECIPES VIEW */}
        {activeTab === 'recipes' && (
          <div>
            {/* Filter Controls: Categories + Family Authors */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800/60">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      selectedCategory === cat
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {familyAuthors.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1">Chef:</span>
                  {familyAuthors.map((author) => (
                    <button
                      key={author}
                      onClick={() => setSelectedAuthor(author)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                        selectedAuthor === author
                          ? 'bg-slate-100 text-slate-950 border-white font-bold'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {author}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recipes Grid */}
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-300">No matching recipes</h3>
                <p className="text-slate-500 text-sm mt-1">Clear your filters or add a new recipe to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <div 
                    key={recipe.id}
                    className="group bg-slate-900/90 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col border-2"
                    style={{ borderColor: recipe.color || '#334155' }}
                  >
                    {/* Cover Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-800">
                      <img 
                        src={recipe.photo} 
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85" />
                      
                      <button
                        onClick={() => toggleFavorite(recipe.id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/70 backdrop-blur-md text-slate-300 hover:text-rose-400 transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>

                      <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-950/85 backdrop-blur-md rounded-lg text-xs font-semibold text-amber-400 border border-amber-500/20">
                        {recipe.category}
                      </span>

                      {recipe.author && (
                        <span 
                          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md flex items-center gap-1"
                          style={{ backgroundColor: recipe.color || '#f59e0b' }}
                        >
                          <User className="w-3 h-3" /> {recipe.author}
                        </span>
                      )}
                    </div>

                    {/* Card Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                          {recipe.title}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            {recipe.cookTime}m
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                            {recipe.servings} serv
                          </span>
                          {recipe.calories > 0 && (
                            <span className="flex items-center gap-1 font-medium text-slate-300">
                              <Flame className="w-3.5 h-3.5 text-orange-400" />
                              {recipe.calories} kcal
                            </span>
                          )}
                        </div>

                        {/* Macro & Fiber Pills */}
                        <div className="mt-3.5 pt-3 border-t border-slate-800/70 grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                          <div className="bg-rose-500/10 text-rose-400 py-1 rounded-lg border border-rose-500/20">
                            P: {recipe.protein || 0}g
                          </div>
                          <div className="bg-amber-500/10 text-amber-400 py-1 rounded-lg border border-amber-500/20">
                            C: {recipe.carbs || 0}g
                          </div>
                          <div className="bg-emerald-500/10 text-emerald-400 py-1 rounded-lg border border-emerald-500/20">
                            Fi: {recipe.fiber || 0}g
                          </div>
                          <div className="bg-blue-500/10 text-blue-400 py-1 rounded-lg border border-blue-500/20">
                            F: {recipe.fats || 0}g
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => openCookMode(recipe)}
                          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Cook Mode
                        </button>
                        <button
                          onClick={() => openRecipeEdit(recipe)}
                          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                          title="Edit Recipe"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRecipe(recipe.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                          title="Delete Recipe"
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

        {/* DISCOVERED FOOD VIEW */}
        {activeTab === 'discovered' && (
          <div>
            {filteredDiscovered.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-300">No dining discoveries logged</h3>
                <p className="text-slate-500 text-sm mt-1">Save memorable restaurant dishes you want to try again or recreate!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDiscovered.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col sm:flex-row transition-all hover:border-emerald-500/40"
                  >
                    <div className="sm:w-2/5 relative h-48 sm:h-auto bg-slate-800">
                      <img 
                        src={item.photo} 
                        alt={item.dishName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'; }}
                      />
                      {item.recreateAtHome && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-md shadow-md">
                          To Recreate
                        </span>
                      )}
                    </div>

                    <div className="p-5 sm:w-3/5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-100 text-base">{item.dishName}</h3>
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {item.priceTier}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="font-medium text-slate-300">{item.restaurant}</span> • {item.location}
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
                          <p className="text-xs text-slate-300 mt-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 italic line-clamp-3">
                            "{item.tastingNotes}"
                          </p>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDiscoveredEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDiscovered(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
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
      </main>

      {/* RECIPE MODAL (CREATE / EDIT) */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-100">
                {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
              </h2>
              <button 
                onClick={() => setIsRecipeModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recipe Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Garlic Butter Shrimp Pasta"
                    value={recipeForm.title}
                    onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={recipeForm.category}
                    onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.filter(c => c !== 'All' && c !== 'Favorites').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Created By</label>
                  <input
                    type="text"
                    required
                    placeholder="Author's Name"
                    value={recipeForm.author}
                    onChange={(e) => setRecipeForm({ ...recipeForm, author: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Card Theme Color</label>
                  <div className="flex items-center gap-2 pt-1.5">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setRecipeForm({ ...recipeForm, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          recipeForm.color === color.value ? 'border-white scale-110 shadow-lg ring-2 ring-amber-500/50' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cook Time (m)</label>
                  <input
                    type="number"
                    min="1"
                    value={recipeForm.cookTime}
                    onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Servings</label>
                  <input
                    type="number"
                    min="1"
                    value={recipeForm.servings}
                    onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Calories (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    value={recipeForm.calories}
                    onChange={(e) => setRecipeForm({ ...recipeForm, calories: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Automated Macros & Fiber Counter */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> Macros & Fiber Counter
                  </label>
                  <span className="text-[11px] text-emerald-400 font-medium">Auto-updates from ingredients</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-400 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={recipeForm.protein}
                      onChange={(e) => setRecipeForm({ ...recipeForm, protein: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-400 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={recipeForm.carbs}
                      onChange={(e) => setRecipeForm({ ...recipeForm, carbs: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-400 mb-1">Fiber (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={recipeForm.fiber}
                      onChange={(e) => setRecipeForm({ ...recipeForm, fiber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-400 mb-1">Fats (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={recipeForm.fats}
                      onChange={(e) => setRecipeForm({ ...recipeForm, fats: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recipe Photo</label>
                <div className="relative border-2 border-dashed border-slate-700/60 hover:border-teal-500/60 rounded-2xl p-5 transition-colors text-center bg-slate-950/40">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setRecipeForm({ ...recipeForm, photo: base64 }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {recipeForm.photo ? (
                    <div className="flex items-center justify-center gap-4">
                      <img src={recipeForm.photo} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                      <div className="text-left">
                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Compressed & ready
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">Tap to replace photo</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-teal-500 font-medium text-sm">
                      <Upload className="w-4 h-4" />
                      <span>Upload Dish Image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ingredients (One per line with grams/amounts)</label>
                <textarea
                  rows="4"
                  placeholder="200g chicken breast&#10;150g white rice&#10;100g broccoli"
                  value={recipeForm.ingredientsText}
                  onChange={(e) => handleIngredientsChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cooking Steps (One per line)</label>
                <textarea
                  rows="4"
                  placeholder="Prep ingredients&#10;Heat pan over medium heat..."
                  value={recipeForm.instructionsText}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructionsText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCOVERED FOOD MODAL */}
      {isDiscoveredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl my-8 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-100">
                {editingDiscovered ? 'Edit Dining Experience' : 'Log Discovered Dish'}
              </h2>
              <button 
                onClick={() => setIsDiscoveredModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscovered} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crispy Duck Confit"
                  value={discoveredForm.dishName}
                  onChange={(e) => setDiscoveredForm({ ...discoveredForm, dishName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Restaurant</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bistro Central"
                    value={discoveredForm.restaurant}
                    onChange={(e) => setDiscoveredForm({ ...discoveredForm, restaurant: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown"
                    value={discoveredForm.location}
                    onChange={(e) => setDiscoveredForm({ ...discoveredForm, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rating (1-5)</label>
                  <select
                    value={discoveredForm.rating}
                    onChange={(e) => setDiscoveredForm({ ...discoveredForm, rating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Great)</option>
                    <option value={3}>3 Stars (Average)</option>
                    <option value={2}>2 Stars (Below Avg)</option>
                    <option value={1}>1 Star (Poor)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Price Tier</label>
                  <select
                    value={discoveredForm.priceTier}
                    onChange={(e) => setDiscoveredForm({ ...discoveredForm, priceTier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="$">$ (Inexpensive)</option>
                    <option value="$$">$$ (Moderate)</option>
                    <option value="$$$">$$$ (Expensive)</option>
                    <option value="$$$$">$$$$ (Fine Dining)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dish Photo</label>
                <div className="relative border-2 border-dashed border-slate-700/60 hover:border-teal-500/60 rounded-2xl p-5 transition-colors text-center bg-slate-950/40">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setDiscoveredForm({ ...discoveredForm, photo: base64 }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {discoveredForm.photo ? (
                    <div className="flex items-center justify-center gap-4">
                      <img src={discoveredForm.photo} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                      <div className="text-left">
                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Photo compressed & ready
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">Tap to select another picture</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-teal-500 font-medium text-sm">
                      <Upload className="w-4 h-4" />
                      <span>Upload Dish Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tasting & Flavor Notes</label>
                <textarea
                  rows="3"
                  placeholder="Describe flavors, secret spices, presentation..."
                  value={discoveredForm.tastingNotes}
                  onChange={(e) => setDiscoveredForm({ ...discoveredForm, tastingNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="recreateToggle"
                  checked={discoveredForm.recreateAtHome}
                  onChange={(e) => setDiscoveredForm({ ...discoveredForm, recreateAtHome: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="recreateToggle" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Mark as "Want to recreate at home"
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDiscoveredModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE COOKING MODE MODAL WITH SERVING SCALER */}
      {activeCookModeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl">
            
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">{activeCookModeRecipe.title}</h2>
                  <p className="text-xs text-slate-400">
                    Chef <span className="text-amber-400 font-semibold">{activeCookModeRecipe.author || 'Family Member'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveCookModeRecipe(null)}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Scaled Macros & Serving Adjuster */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" /> Serving Scaler
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCookServings(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-amber-400 min-w-[4.5rem] text-center">
                      {cookServings} {cookServings === 1 ? 'serving' : 'servings'}
                    </span>
                    <button
                      onClick={() => setCookServings(prev => prev + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 text-center items-center">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Cals</div>
                    <div className="text-sm sm:text-base font-extrabold text-amber-400">
                      {Math.round((activeCookModeRecipe.calories || 0) * servingRatio)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Protein</div>
                    <div className="text-sm sm:text-base font-extrabold text-rose-400">
                      {Math.round((activeCookModeRecipe.protein || 0) * servingRatio)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Carbs</div>
                    <div className="text-sm sm:text-base font-extrabold text-amber-400">
                      {Math.round((activeCookModeRecipe.carbs || 0) * servingRatio)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Fiber</div>
                    <div className="text-sm sm:text-base font-extrabold text-emerald-400">
                      {Math.round((activeCookModeRecipe.fiber || 0) * servingRatio)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Fats</div>
                    <div className="text-sm sm:text-base font-extrabold text-blue-400">
                      {Math.round((activeCookModeRecipe.fats || 0) * servingRatio)}g
                    </div>
                  </div>
                </div>
              </div>

              {/* Kitchen Timer */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Kitchen Timer
                  </h4>
                  <div className="text-3xl font-mono font-bold text-slate-100 mt-1">
                    {formatTimer(timerSeconds)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isTimerRunning ? (
                    <button
                      onClick={() => startTimer(activeCookModeRecipe.cookTime || 10)}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start ({activeCookModeRecipe.cookTime || 10}m)
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsTimerRunning(false)}
                      className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  )}
                  <button
                    onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }}
                    className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Ingredients Checklist & Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    Ingredients Checklist
                  </h3>
                  <div className="space-y-2.5 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                    {activeCookModeRecipe.ingredients && activeCookModeRecipe.ingredients.length > 0 ? (
                      activeCookModeRecipe.ingredients.map((ing, idx) => {
                        const isChecked = Boolean(checkedIngredients[idx]);
                        return (
                          <label key={idx} className="flex items-center gap-3 text-xs cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              className="w-4 h-4 rounded accent-amber-500 bg-slate-900 border-slate-700"
                            />
                            <span className={isChecked ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'}>
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
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    Cooking Steps
                  </h3>
                  <div className="space-y-3">
                    {activeCookModeRecipe.instructions && activeCookModeRecipe.instructions.length > 0 ? (
                      activeCookModeRecipe.instructions.map((step, idx) => (
                        <div key={idx} className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 flex gap-3 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <p className="leading-relaxed">{step}</p>
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
                onClick={() => setActiveCookModeRecipe(null)}
                className="px-6 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Done Cooking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE / STATUS TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 font-bold px-5 py-3.5 rounded-2xl shadow-2xl transition-all ${
            toast.type === 'error'
              ? 'bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          )}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

    </div>
  );
}