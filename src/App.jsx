import React, { useState, useEffect } from 'react';
import { Sparkles, Home, Image as ImageIcon, Settings, Share, LayoutGrid, LogOut, Trash2, Mail, Lock, AlertCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  signInWithCustomToken,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

/* --- CSS STYLES --- */
const styles = `
  :root {
    /* Light Mode (Default) */
    --bg-canvas: #f1f5f9;
    --bg-surface: #ffffff;
    --bg-subtle: #f8fafc;
    --bg-input: #ffffff;
    --text-main: #1e293b;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --primary: #667eea;
    --primary-dark: #5a67d8;
    --danger: #ef4444;
    --warning: #f59e0b;
    --sidebar-width: 280px;
    --header-bg: rgba(255, 255, 255, 0.8);
    --auth-card-bg: rgba(255, 255, 255, 0.95);
    --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  body.dark {
    /* Dark Mode Overrides */
    --bg-canvas: #0f172a;
    --bg-surface: #1e293b;
    --bg-subtle: #334155;
    --bg-input: #0f172a;
    --text-main: #f1f5f9;
    --text-muted: #94a3b8;
    --border: #334155;
    --header-bg: rgba(30, 41, 59, 0.8);
    --auth-card-bg: rgba(30, 41, 59, 0.95);
    --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  }
  
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
    background: var(--bg-canvas); 
    color: var(--text-main); 
    margin: 0;
    transition: background-color 0.3s, color 0.3s;
  }

  /* --- UTILITY CLASSES --- */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .justify-center { justify-content: center; }
  .gap-2 { gap: 0.5rem; }
  .gap-4 { gap: 1rem; }
  .w-full { width: 100%; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .hidden-mobile { display: none; }
  .relative { position: relative; }
  
  @media (min-width: 768px) {
    .hidden-mobile { display: block; }
    .hidden-desktop { display: none; }
  }

  /* --- BUTTONS --- */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.75rem 1.25rem; border-radius: 0.75rem; font-weight: 600; 
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer; border: none; font-size: 0.875rem; outline: none;
    white-space: nowrap;
  }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

  .btn-primary { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    color: white; 
    box-shadow: 0 4px 15px -3px rgba(118, 75, 162, 0.4); 
  }
  .btn-primary:hover:not(:disabled) { 
    transform: translateY(-1px); 
    box-shadow: 0 8px 20px -3px rgba(118, 75, 162, 0.5);
  }

  .btn-secondary { background: var(--bg-surface); border: 1px solid var(--border); color: var(--text-main); }
  .btn-secondary:hover { background: var(--bg-subtle); border-color: var(--text-muted); }

  .btn-ghost { background: transparent; color: var(--text-muted); }
  .btn-ghost:hover { background: var(--bg-subtle); color: var(--text-main); }

  .btn-danger { background: var(--bg-surface); color: var(--danger); border: 1px solid #fecaca; }
  .btn-danger:hover { background: #fee2e2; border-color: #fecaca; color: #b91c1c; }
  body.dark .btn-danger { border-color: #7f1d1d; background: rgba(127, 29, 29, 0.1); }
  body.dark .btn-danger:hover { background: rgba(127, 29, 29, 0.2); }

  .btn-icon { padding: 0.6rem; border-radius: 50%; aspect-ratio: 1; }
  .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; border-radius: 0.5rem; }

  /* Google Icon Fix */
  .google-icon { width: 20px; height: 20px; margin-right: 0.5rem; }

  /* --- INPUTS --- */
  .input-group { margin-bottom: 1rem; }
  .input-label { display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .input-wrapper { position: relative; }
  .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
  
  .input-field, .input-textarea {
    width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid var(--border);
    background: var(--bg-input); color: var(--text-main); font-size: 0.875rem; outline: none; box-sizing: border-box;
    transition: all 0.2s;
  }
  .input-field.has-icon { padding-left: 2.75rem; }
  .input-field:focus, .input-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1); }
  .input-textarea { min-height: 300px; resize: vertical; line-height: 1.5; }

  /* --- AUTH SCREEN --- */
  .auth-container {
    min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  .auth-card {
    width: 100%; max-width: 420px; background: var(--auth-card-bg);
    padding: 3rem 2.5rem; border-radius: 2rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .auth-divider { display: flex; align-items: center; margin: 1.5rem 0; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
  .auth-divider::before, .auth-divider::after { content: ''; flex: 1; border-top: 1px solid var(--border); }
  .auth-divider span { padding: 0 1rem; }

  /* --- MAIN LAYOUT --- */
  .app-shell { display: flex; height: 100vh; overflow: hidden; background: var(--bg-canvas); }
  
  /* Sidebar */
  .sidebar {
    width: var(--sidebar-width); background: var(--bg-surface); border-right: 1px solid var(--border);
    display: none; flex-direction: column; padding: 1.5rem;
    box-shadow: 4px 0 24px rgba(0,0,0,0.02); z-index: 10;
    transition: background 0.3s, border-color 0.3s;
  }
  .brand { display: flex; align-items: center; gap: 0.75rem; color: #764ba2; margin-bottom: 2rem; padding: 0 0.5rem; }
  body.dark .brand { color: #a5b4fc; }
  .brand-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(118, 75, 162, 0.3); }
  .brand-text { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; background: linear-gradient(135deg, #1e293b 0%, #475569 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  body.dark .brand-text { background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

  .nav-list { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
  .nav-item {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem;
    border-radius: 0.75rem; font-weight: 500; font-size: 0.9rem; color: var(--text-muted);
    background: transparent; border: none; cursor: pointer; text-align: left; width: 100%;
    transition: all 0.2s;
  }
  .nav-item:hover { background: var(--bg-subtle); color: var(--text-main); }
  .nav-item.active { background: linear-gradient(to right, #eef2ff, #f5f3ff); color: #764ba2; font-weight: 600; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
  body.dark .nav-item.active { background: linear-gradient(to right, #312e81, #4338ca); color: #e0e7ff; }
  
  .user-profile { margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 0.75rem; }
  .user-avatar { width: 36px; height: 36px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
  body.dark .user-avatar { background: #312e81; color: #a5b4fc; }
  .user-info { flex: 1; overflow: hidden; }
  .user-email { font-size: 0.85rem; font-weight: 500; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  
  /* Main Content */
  .main-view { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }
  
  .header {
    background: var(--header-bg); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border);
    padding: 1rem 2rem; display: flex; justify-content: space-between; items-center; z-index: 5;
  }
  .header-title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); }

  .content-scroll { flex: 1; overflow-y: auto; padding: 2rem; padding-bottom: 6rem; }
  .container { max-width: 1100px; margin: 0 auto; }

  /* Create View Grid */
  .create-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
  
  /* Card Styles */
  .card { background: var(--bg-surface); border-radius: 1.5rem; border: 1px solid var(--border); box-shadow: var(--card-shadow); overflow: hidden; transition: background 0.3s, border-color 0.3s; }
  .card-body { padding: 1.5rem; }
  
  /* Image Preview Area */
  .preview-area {
    aspect-ratio: 4/3; background: var(--bg-canvas); display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden; border-bottom: 1px solid var(--border);
  }
  .preview-image { width: 100%; height: 100%; object-fit: cover; }
  .preview-overlay {
    position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    opacity: 0; transition: opacity 0.3s; display: flex; align-items: flex-end; padding: 1.5rem;
  }
  .preview-area:hover .preview-overlay { opacity: 1; }
  .preview-text { color: white; font-size: 0.875rem; font-weight: 500; }
  .empty-state { text-align: center; color: var(--text-muted); padding: 2rem; }

  /* Tags */
  .tag-container { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
  .tag { 
    font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 99px; 
    background: var(--bg-subtle); border: 1px solid var(--border); color: var(--text-muted); 
    cursor: pointer; transition: all 0.2s; 
  }
  .tag:hover { background: #eef2ff; color: #4f46e5; border-color: #c7d2fe; }
  body.dark .tag:hover { background: #312e81; color: #a5b4fc; border-color: #4f46e5; }

  /* Gallery Grid */
  .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
  .gallery-item { position: relative; border-radius: 1rem; overflow: hidden; aspect-ratio: 1; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; }
  .gallery-item:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  .gallery-delete { position: absolute; top: 0.5rem; right: 0.5rem; opacity: 0; transition: opacity 0.2s; }
  .gallery-item:hover .gallery-delete { opacity: 1; }

  /* Mobile Nav */
  .mobile-nav { 
    display: flex; border-top: 1px solid var(--border); background: var(--bg-surface); 
    padding: 0.75rem 1rem 1.5rem; justify-content: space-around;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 20;
  }
  .mobile-nav-item { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; font-size: 0.7rem; color: var(--text-muted); background: none; border: none; }
  .mobile-nav-item.active { color: #764ba2; }
  body.dark .mobile-nav-item.active { color: #a5b4fc; }

  /* Responsive Adjustments */
  @media (min-width: 1024px) {
    .create-grid { grid-template-columns: 1.5fr 1fr; align-items: start; }
    .sidebar { display: flex; }
    .mobile-nav { display: none; }
    .card-body { padding: 2rem; }
  }
`;

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBcZOBqmeHOTvyRN-PCmxRHE9jez-SB6v0",
  authDomain: "dreamhome-3d36c.firebaseapp.com",
  projectId: "dreamhome-3d36c",
  storageBucket: "dreamhome-3d36c.firebasestorage.app",
  messagingSenderId: "845836594322",
  appId: "1:845836594322:web:12150363004760aa014a4b",
  measurementId: "G-M3PF0SQEGW"
};

// 2. PASTE YOUR GOOGLE GEMINI API KEY HERE
// Get one from https://aistudio.google.com/app/apikey
const apiKey = "AIzaSyCXjs7RRzAfeo4gdGBnWp0ESToAFGwmtGI"; 

const appId = "dreamhome-web-v1";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DreamHomeApp = () => {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [prompt, setPrompt] = useState('');
  // removed uploadedImage state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDesign, setCurrentDesign] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [error, setError] = useState(null);
  
  // --- DARK MODE STATE ---
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference on init
    const saved = localStorage.getItem('dreamhome-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // --- APPLY DARK MODE ---
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('dreamhome-theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('dreamhome-theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  useEffect(() => {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      signInWithCustomToken(auth, __initial_auth_token);
    }
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError("Google Sign In failed. Check console.");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential') setError("Invalid email or password.");
      else if (err.code === 'auth/email-already-in-use') setError("Email already in use.");
      else if (err.code === 'auth/weak-password') setError("Password too weak.");
      else setError(err.message);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setGallery([]);
    setCurrentDesign(null);
    setPrompt('');
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'designs'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGallery(items);
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, [user]);

  const generateDesign = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setCurrentDesign(null);

    // Prompt enhancement for better results
    const finalPrompt = "Photorealistic interior design, architectural photography, high quality: " + prompt;

    try {
      // Call Imagen 4.0 (Text-to-Image) - using the one that worked previously for text
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: finalPrompt }],
            parameters: { sampleCount: 1 }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorObj = JSON.parse(errorText);
          const message = errorObj.error?.message || errorObj.error || errorText;
          throw new Error(`API Error: ${response.status} - ${message}`);
        } catch (e) {
          throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`);
        }
      }

      const result = await response.json();
      
      if (result.predictions?.[0]?.bytesBase64Encoded) {
        const base64Image = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
        const newDesign = { 
          image: base64Image, 
          prompt: prompt, 
          createdAt: new Date().toISOString() 
        };
        
        setCurrentDesign(newDesign);
        
        if (user) {
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'designs'), {
            ...newDesign,
            createdAt: serverTimestamp()
          });
        }
      } else {
        throw new Error("Failed to generate image. The API returned no image data.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to generate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteDesign = async (designId) => {
    if (!user || !designId) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'designs', designId));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <>
        <style>{styles}</style>
        <div className="auth-container">
          <div className="auth-card">
            <div className="flex-col items-center flex mb-6">
              <div className="brand-icon mb-4" style={{ width: 64, height: 64 }}>
                <LayoutGrid size={32} />
              </div>
              <h1 className="header-title" style={{ fontSize: '1.75rem', color: 'var(--text-main)' }}>DreamHome</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Design your dream space with AI</p>
            </div>

            <form onSubmit={handleEmailAuth}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field has-icon" 
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field has-icon" 
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

              <button type="submit" className="btn btn-primary w-full">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider">
              <span>Or continue with</span>
            </div>

            <button onClick={handleGoogleSignIn} className="btn btn-secondary w-full">
              <svg className="google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            <div className="justify-center flex mt-6" style={{ fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{authMode === 'login' ? "Don't have an account?" : "Already have an account?"}</span>
              <button 
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(null); }}
                className="btn-ghost" style={{ padding: '0 0.5rem', fontWeight: 600, color: 'var(--primary)' }}
              >
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- MAIN APP ---
  return (
    <>
      <style>{styles}</style>
      <div className="app-shell">
        
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon"><LayoutGrid size={20} /></div>
            <span className="brand-text">DreamHome</span>
          </div>
          
          <nav className="nav-list">
            <button onClick={() => setActiveTab('create')} className={`nav-item ${activeTab === 'create' ? 'active' : ''}`}>
              <Home size={20} /> Create Design
            </button>
            <button onClick={() => setActiveTab('gallery')} className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`}>
              <ImageIcon size={20} /> My Gallery
            </button>
            <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
              <Settings size={20} /> Settings
            </button>
          </nav>

          <div className="user-profile">
             <div className="user-avatar">
               {user.email ? user.email.substring(0,2).toUpperCase() : 'U'}
             </div>
             <div className="user-info">
               <div className="user-email" title={user.email}>{user.email}</div>
             </div>
             <button onClick={handleSignOut} className="btn-icon btn-ghost" title="Sign Out">
               <LogOut size={16} />
             </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="main-view">
          
          <header className="header">
            <div className="flex items-center gap-2">
              <div className="hidden-desktop" style={{ color: 'var(--primary)' }}><LayoutGrid size={24} /></div>
              <h2 className="header-title">{activeTab === 'create' ? 'New Project' : activeTab === 'gallery' ? 'My Gallery' : 'Settings'}</h2>
            </div>
            
            <div className="flex gap-2">
               <button className="btn btn-ghost btn-icon" title="Share">
                 <Share size={20} />
               </button>
               <button onClick={handleSignOut} className="btn btn-secondary btn-sm hidden-mobile">
                 <LogOut size={16} /> Sign Out
               </button>
            </div>
          </header>

          <div className="content-scroll">
            <div className="container">
              
              {activeTab === 'create' && (
                <div className="create-grid">
                  {/* Left: Image Preview */}
                  <div className="card">
                    <div className="preview-area">
                      {isGenerating ? (
                        <div className="flex-col items-center flex">
                           <div className="spinner mb-4"></div>
                           <p style={{ color: 'var(--primary)', fontWeight: 500 }}>
                             Generating...
                           </p>
                        </div>
                      ) : currentDesign ? (
                        <>
                          <img src={currentDesign.image} alt="Generated" className="preview-image" />
                          <div className="preview-overlay">
                            <p className="preview-text">{currentDesign.prompt}</p>
                          </div>
                        </>
                      ) : (
                        <div className="empty-state">
                          <Sparkles size={48} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
                          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>Visualize Your Dream</h3>
                          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Enter a prompt to generate high-quality architectural designs.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex-col flex gap-4">
                    <div className="card card-body">
                      <label className="input-label">Design Prompt</label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A minimalist living room with floor-to-ceiling windows overlooking a forest..."
                        className="input-textarea mb-4"
                      />
                      
                      {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>INSPIRATION</p>
                        <div className="tag-container">
                          {['Modern Loft', 'Cyberpunk', 'Cottagecore', 'Art Deco', 'Scandanavian'].map(tag => (
                            <button 
                              key={tag}
                              onClick={() => setPrompt(p => p ? `${p}, ${tag}` : tag)}
                              className="tag"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={generateDesign} 
                        disabled={isGenerating || !prompt.trim()}
                        className="btn btn-primary w-full"
                        style={{ marginTop: '1.5rem' }}
                      >
                        {isGenerating ? 'Generating...' : <><Sparkles size={18} /> Generate Design</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="flex-col flex gap-4">
                  {gallery.length === 0 ? (
                    <div className="card card-body" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                      <ImageIcon size={48} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
                      <p style={{ color: 'var(--text-muted)' }}>Your gallery is empty.</p>
                      <button onClick={() => setActiveTab('create')} className="btn btn-ghost" style={{ color: 'var(--primary)', marginTop: '0.5rem' }}>Create your first design</button>
                    </div>
                  ) : (
                    <div className="gallery-grid">
                      {gallery.map((item) => (
                        <div key={item.id} className="gallery-item">
                          <img src={item.image} alt="Design" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteDesign(item.id); }}
                            className="gallery-delete btn-icon btn-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                 <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                   <div className="card-body" style={{ borderBottom: '1px solid var(--border)' }}>
                     <h3 className="header-title">Account Settings</h3>
                     <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Manage your preferences and subscription.</p>
                   </div>
                   <div className="card-body">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p style={{ fontWeight: 500 }}>Signed in as</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.email}</p>
                        </div>
                        <button onClick={handleSignOut} className="btn btn-secondary btn-sm">Sign Out</button>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                         <div className="flex items-center justify-between">
                           <div>
                             <p style={{ fontWeight: 500 }}>Dark Mode</p>
                             <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Switch between light and dark themes</p>
                           </div>
                           
                           {/* Dark Mode Toggle Switch */}
                           <div 
                             onClick={toggleTheme}
                             style={{ 
                               width: 48, height: 24, 
                               background: darkMode ? 'var(--primary)' : 'var(--border)', 
                               borderRadius: 99, position: 'relative', cursor: 'pointer',
                               transition: 'background 0.2s'
                             }}
                           >
                             <div style={{ 
                               width: 20, height: 20, 
                               background: 'white', 
                               borderRadius: '50%', 
                               position: 'absolute', 
                               top: 2, 
                               left: darkMode ? 26 : 2, 
                               boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                               transition: 'left 0.2s'
                             }}></div>
                           </div>

                         </div>
                      </div>
                   </div>
                 </div>
              )}

            </div>
          </div>

          <nav className="mobile-nav">
             <button onClick={() => setActiveTab('create')} className={`mobile-nav-item ${activeTab === 'create' ? 'active' : ''}`}>
               <Home size={24} /> <span>Create</span>
             </button>
             <button onClick={() => setActiveTab('gallery')} className={`mobile-nav-item ${activeTab === 'gallery' ? 'active' : ''}`}>
               <ImageIcon size={24} /> <span>Gallery</span>
             </button>
             <button onClick={() => setActiveTab('settings')} className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
               <Settings size={24} /> <span>Settings</span>
             </button>
          </nav>
        </main>
      </div>
    </>
  );
};

export default DreamHomeApp;