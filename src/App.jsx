import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  Utensils, Plus, Search, Trash2, Edit3, Heart, Clock, Users, Play, Pause, RotateCcw, 
  MapPin, DollarSign, Star, Sparkles, X, Upload, Image as ImageIcon, Flame, Check, Bookmark, ChefHat
} from 'lucide-react';

// Firebase configuration placeholder - falls back to local storage if non-functional or offline
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
  console.warn("Firebase initialized in demo/fallback mode.");
}

// Sample Initial Recipes
const INITIAL_RECIPES = [
  {
    id: 'rec_1',
    title: 'Truffle Mushroom Risotto',
    category: 'Italian',
    cookTime: 35,
    servings: 4,
    calories: 420,
    isFavorite: true,
    photo: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&q=80&w=800',
    ingredients: [
      '1.5 cups Arborio rice',
      '4 cups Warm vegetable broth',
      '200g Mixed wild mushrooms, sliced',
      '2 tbsp Truffle oil',
      '1/2 cup Shallots, finely diced',
      '1/2 cup Grated Parmesan'
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
    isFavorite: false,
    photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
    ingredients: [
      '2 Salmon fillets',
      '2 cups Steamed Jasmine rice',
      '1 Avocado, sliced',
      '1 cup Edamame, steamed',
      '2 tbsp Soy glaze / Teriyaki sauce',
      'Sesame seeds & pickled ginger'
    ],
    instructions: [
      'Season salmon with salt and pepper.',
      'Sear salmon skin-side down in a hot skillet for 4 minutes, flip and cook 3 minutes.',
      'Assemble rice bowls with sliced avocado, edamame, and crispy salmon.',
      'Drizzle with soy glaze and top with toasted sesame seeds.'
    ]
  }
];

// Sample Discovered Food Items
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
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' | 'discovered'
  const [recipes, setRecipes] = useState([]);
  const [discoveredFoods, setDiscoveredFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isDiscoveredModalOpen, setIsDiscoveredModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editingDiscovered, setEditingDiscovered] = useState(null);
  const [activeCookModeRecipe, setActiveCookModeRecipe] = useState(null);

  // App Title editing
  const [appTitle, setAppTitle] = useState('TastyLog');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Cooking Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Form States - Recipe
  const [recipeForm, setRecipeForm] = useState({
    title: '',
    category: 'Dinner',
    cookTime: 25,
    servings: 2,
    calories: 350,
    photo: '',
    ingredientsText: '',
    instructionsText: ''
  });

  // Form States - Discovered Food
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

  // Load Initial Data
  useEffect(() => {
    const savedRecipes = localStorage.getItem('tastylog_recipes');
    const savedDiscovered = localStorage.getItem('tastylog_discovered');
    const savedTitle = localStorage.getItem('tastylog_title');

    if (savedTitle) setAppTitle(savedTitle);

    if (savedRecipes) {
      try { setRecipes(JSON.parse(savedRecipes)); } catch(e) { setRecipes(INITIAL_RECIPES); }
    } else {
      setRecipes(INITIAL_RECIPES);
    }

    if (savedDiscovered) {
      try { setDiscoveredFoods(JSON.parse(savedDiscovered)); } catch(e) { setDiscoveredFoods(INITIAL_DISCOVERED); }
    } else {
      setDiscoveredFoods(INITIAL_DISCOVERED);
    }

    // Attempt Firebase sync if available
    if (db) {
      try {
        const qRecipes = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
        const unsubscribeRecipes = onSnapshot(qRecipes, (snapshot) => {
          if (!snapshot.empty) {
            const fbData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecipes(fbData);
          }
        }, err => console.log('Firebase fallback active'));

        return () => unsubscribeRecipes && unsubscribeRecipes();
      } catch (e) {
        console.log("Firebase listener error");
      }
    }
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('tastylog_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('tastylog_discovered', JSON.stringify(discoveredFoods));
  }, [discoveredFoods]);

  useEffect(() => {
    localStorage.setItem('tastylog_title', appTitle);
  }, [appTitle]);

  // Cooking Timer logic
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Helper: Image File Upload to Base64
  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Recipe Form Submission
  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    const ingredients = recipeForm.ingredientsText.split('\n').filter(i => i.trim() !== '');
    const instructions = recipeForm.instructionsText.split('\n').filter(i => i.trim() !== '');

    const newRecipeData = {
      title: recipeForm.title || 'Untitled Dish',
      category: recipeForm.category,
      cookTime: Number(recipeForm.cookTime) || 15,
      servings: Number(recipeForm.servings) || 1,
      calories: Number(recipeForm.calories) || 0,
      photo: recipeForm.photo || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800',
      ingredients,
      instructions,
      isFavorite: editingRecipe ? editingRecipe.isFavorite : false,
      updatedAt: new Date().toISOString()
    };

    if (editingRecipe) {
      setRecipes(recipes.map(r => r.id === editingRecipe.id ? { ...newRecipeData, id: editingRecipe.id } : r));
      if (db) {
        try { await updateDoc(doc(db, 'recipes', editingRecipe.id), newRecipeData); } catch(err){}
      }
    } else {
      const newId = 'rec_' + Date.now();
      const created = { ...newRecipeData, id: newId };
      setRecipes([created, ...recipes]);
      if (db) {
        try { await addDoc(collection(db, 'recipes'), { ...newRecipeData, createdAt: serverTimestamp() }); } catch(err){}
      }
    }

    setIsRecipeModalOpen(false);
    setEditingRecipe(null);
    resetRecipeForm();
  };

  const resetRecipeForm = () => {
    setRecipeForm({
      title: '',
      category: 'Dinner',
      cookTime: 25,
      servings: 2,
      calories: 350,
      photo: '',
      ingredientsText: '',
      instructionsText: ''
    });
  };

  const openRecipeEdit = (recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      title: recipe.title,
      category: recipe.category,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      calories: recipe.calories,
      photo: recipe.photo,
      ingredientsText: recipe.ingredients ? recipe.ingredients.join('\n') : '',
      instructionsText: recipe.instructions ? recipe.instructions.join('\n') : ''
    });
    setIsRecipeModalOpen(true);
  };

  const toggleFavorite = (id) => {
    setRecipes(recipes.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  };

  const deleteRecipe = (id) => {
    setRecipes(recipes.filter(r => r.id !== id));
    if (db) {
      try { deleteDoc(doc(db, 'recipes', id)); } catch(err){}
    }
  };

  // Discovered Form Submission
  const handleSaveDiscovered = async (e) => {
    e.preventDefault();
    const newDiscoveredData = {
      restaurant: discoveredForm.restaurant || 'Unknown Restaurant',
      location: discoveredForm.location || 'Local Area',
      dishName: discoveredForm.dishName || 'Tasty Dish',
      rating: Number(discoveredForm.rating),
      priceTier: discoveredForm.priceTier,
      tastingNotes: discoveredForm.tastingNotes,
      recreateAtHome: discoveredForm.recreateAtHome,
      photo: discoveredForm.photo || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    if (editingDiscovered) {
      setDiscoveredFoods(discoveredFoods.map(d => d.id === editingDiscovered.id ? { ...newDiscoveredData, id: editingDiscovered.id } : d));
    } else {
      const newId = 'disc_' + Date.now();
      setDiscoveredFoods([{ ...newDiscoveredData, id: newId }, ...discoveredFoods]);
    }

    setIsDiscoveredModalOpen(false);
    setEditingDiscovered(null);
    resetDiscoveredForm();
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
    setDiscoveredFoods(discoveredFoods.filter(d => d.id !== id));
  };

  // Cooking Mode Timer Helpers
  const startTimer = (minutes) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtering
  const categories = ['All', 'Favorites', 'Italian', 'Japanese', 'Dinner', 'Breakfast', 'Dessert'];

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'All') return matchesSearch;
    if (selectedCategory === 'Favorites') return matchesSearch && r.isFavorite;
    return matchesSearch && r.category === selectedCategory;
  });

  const filteredDiscovered = discoveredFoods.filter(d => 
    d.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.restaurant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-amber-500 selection:text-slate-950">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-4 md:px-8 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Editable App Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20 text-slate-950">
              <Utensils className="w-6 h-6 stroke-[2.5]" />
            </div>
            {isEditingTitle ? (
              <input 
                type="text" 
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="text-2xl font-black text-amber-400 bg-slate-800/90 border border-amber-500/50 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-amber-500"
              />
            ) : (
              <div 
                onClick={() => setIsEditingTitle(true)} 
                className="group flex items-center gap-2 cursor-pointer"
                title="Click to rename app"
              >
                <h1 className="text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  {appTitle}
                </h1>
                <Edit3 className="w-4 h-4 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            {activeTab === 'recipes' ? (
              <button
                onClick={() => { resetRecipeForm(); setEditingRecipe(null); setIsRecipeModalOpen(true); }}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 text-sm md:text-base"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span className="hidden sm:inline">Add Recipe</span>
              </button>
            ) : (
              <button
                onClick={() => { resetDiscoveredForm(); setEditingDiscovered(null); setIsDiscoveredModalOpen(true); }}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 text-sm md:text-base"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span className="hidden sm:inline">Log Dining Discovery</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS & SEARCH */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          
          {/* Main Tab Switcher */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'recipes'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              My Recipes ({recipes.length})
            </button>
            <button
              onClick={() => setActiveTab('discovered')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'discovered'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Discovered Food ({discoveredFoods.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'recipes' ? "Search dishes or categories..." : "Search restaurant, dish, or notes..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>
        </div>

        {/* RECIPES SECTION */}
        {activeTab === 'recipes' && (
          <div>
            {/* Categories pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Recipes Grid */}
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-300">No recipes found</h3>
                <p className="text-slate-500 text-sm mt-1">Try tweaking your search or add a brand new recipe.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <div 
                    key={recipe.id}
                    className="group bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 flex flex-col"
                  >
                    {/* Card Cover Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-800">
                      <img 
                        src={recipe.photo} 
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                      
                      <button
                        onClick={() => toggleFavorite(recipe.id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/60 backdrop-blur-md text-slate-300 hover:text-rose-400 transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>

                      <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-xs font-semibold text-amber-400 border border-amber-500/20">
                        {recipe.category}
                      </span>
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
                            {recipe.cookTime} mins
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                            {recipe.servings} Servings
                          </span>
                          {recipe.calories > 0 && (
                            <span className="flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-orange-400" />
                              {recipe.calories} kcal
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setActiveCookModeRecipe(recipe)}
                          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Start Cooking
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

        {/* DISCOVERED FOOD SECTION */}
        {activeTab === 'discovered' && (
          <div>
            {filteredDiscovered.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-300">No dining discoveries logged</h3>
                <p className="text-slate-500 text-sm mt-1">Keep track of delicious dishes you tried at restaurants!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDiscovered.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col sm:flex-row transition-all hover:border-emerald-500/30"
                  >
                    <div className="sm:w-2/5 relative h-48 sm:h-auto bg-slate-800">
                      <img 
                        src={item.photo} 
                        alt={item.dishName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'; }}
                      />
                      {item.recreateAtHome && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-md shadow-md">
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
                          <p className="text-xs text-slate-300 mt-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50 italic line-clamp-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
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
              
              {/* Recipe Title & Category */}
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
                    <option value="Italian">Italian</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
              </div>

              {/* Cooking Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Prep/Cook Time (m)</label>
                  <input
                    type="number"
                    value={recipeForm.cookTime}
                    onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Servings</label>
                  <input
                    type="number"
                    value={recipeForm.servings}
                    onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Calories (kcal)</label>
                  <input
                    type="number"
                    value={recipeForm.calories}
                    onChange={(e) => setRecipeForm({ ...recipeForm, calories: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* DASHED UPLOAD DISH IMAGE UI */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">RECIPE PHOTO</label>
                <div className="relative border-2 border-dashed border-slate-700/60 hover:border-teal-500/60 rounded-2xl p-6 transition-colors text-center bg-slate-950/40">
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
                          <Check className="w-4 h-4" /> Image attached
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">Click or drop a new image to replace</p>
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ingredients (One per line)</label>
                <textarea
                  rows="4"
                  placeholder="1 cup rice&#10;2 tbsp olive oil&#10;Salt & pepper"
                  value={recipeForm.ingredientsText}
                  onChange={(e) => setRecipeForm({ ...recipeForm, ingredientsText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Instructions (One per step)</label>
                <textarea
                  rows="4"
                  placeholder="Step 1: Prep ingredients&#10;Step 2: Heat pan..."
                  value={recipeForm.instructionsText}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructionsText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
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

              {/* DASHED UPLOAD DISH IMAGE UI */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">RECIPE PHOTO</label>
                <div className="relative border-2 border-dashed border-slate-700/60 hover:border-teal-500/60 rounded-2xl p-6 transition-colors text-center bg-slate-950/40">
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
                          <Check className="w-4 h-4" /> Photo uploaded
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">Click to select another picture</p>
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

              <div className="flex items-center gap-3 pt-2">
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

      {/* INTERACTIVE COOKING MODE MODAL */}
      {activeCookModeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">{activeCookModeRecipe.title}</h2>
                  <p className="text-xs text-slate-400">Interactive Kitchen Assistant</p>
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
              
              {/* Kitchen Timer Widget */}
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

              {/* Grid with Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Ingredients Checklist */}
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    Ingredients Checklist
                  </h3>
                  <div className="space-y-2 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                    {activeCookModeRecipe.ingredients && activeCookModeRecipe.ingredients.length > 0 ? (
                      activeCookModeRecipe.ingredients.map((ing, idx) => (
                        <label key={idx} className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer hover:text-slate-100">
                          <input type="checkbox" className="w-4 h-4 rounded accent-amber-500 bg-slate-900 border-slate-700" />
                          <span>{ing}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No ingredients listed.</p>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    Steps
                  </h3>
                  <div className="space-y-3">
                    {activeCookModeRecipe.instructions && activeCookModeRecipe.instructions.length > 0 ? (
                      activeCookModeRecipe.instructions.map((step, idx) => (
                        <div key={idx} className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 flex gap-3 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center shrink-0">
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

    </div>
  );
}