import React, { useState, useEffect } from 'react';
import { Sparkles, Home, Image as ImageIcon, Settings, Share, LayoutGrid, LogOut, Trash2, Mail, Lock, LogIn } from 'lucide-react';
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
    --bg-canvas: #f8fafc;
    --bg-surface: #ffffff;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --primary: #4f46e5;
    --primary-hover: #4338ca;
    --border: #e2e8f0;
  }
  
  body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg-canvas); color: var(--text-main); }
  
  /* UTILITIES */
  .btn {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.75rem 1rem; border-radius: 0.75rem; font-weight: 600; transition: all 0.2s;
    cursor: pointer; border: none; font-size: 0.875rem;
  }
  .btn-primary { background: var(--primary); color: white; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
  .btn-primary:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
  
  .btn-secondary { background: white; border: 1px solid var(--border); color: var(--text-main); }
  .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
  
  .btn-ghost { background: transparent; color: var(--text-muted); }
  .btn-ghost:hover { background: #f1f5f9; color: var(--text-main); }
  
  .input-area, .input-field {
    width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid var(--border);
    background: var(--bg-surface); font-size: 0.875rem; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-area:focus, .input-field:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
  
  .glass-header {
    background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border);
  }

  /* AUTH SCREEN */
  .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .auth-card { width: 100%; max-width: 400px; background: white; padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--border); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }

  /* RESPONSIVE LAYOUT */
  .app-shell { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: 260px; background: var(--bg-surface); border-right: 1px solid var(--border); display: none; flex-direction: column; padding: 1.5rem; }
  .main-view { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }
  .content-scroll { flex: 1; overflow-y: auto; padding: 1.5rem; padding-bottom: 6rem; }
  .mobile-nav { display: flex; border-top: 1px solid var(--border); background: var(--bg-surface); padding: 0.5rem 1rem 1.5rem; justify-content: space-around; }

  @media (min-width: 768px) {
    .sidebar { display: flex; }
    .mobile-nav { display: none; }
    .content-scroll { padding: 2.5rem; }
  }

  /* ANIMATIONS */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
`;

// --- CONFIGURATION START ---

// 1. PASTE YOUR FIREBASE CONFIGURATION HERE
// Replace this entire object with the one you saved in your notepad.
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

// 3. APP ID
const appId = "dreamhome-web-v1";

// --- CONFIGURATION END ---

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DreamHomeApp = () => {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDesign, setCurrentDesign] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [error, setError] = useState(null);

  // --- AUTHENTICATION ---
  useEffect(() => {
    // Check for environment token (for preview), otherwise wait for user action
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
      setError("Google Sign In failed. Check console for details.");
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
      // Friendly error messages
      if (err.code === 'auth/invalid-credential') setError("Invalid email or password.");
      else if (err.code === 'auth/email-already-in-use') setError("Email already in use.");
      else if (err.code === 'auth/weak-password') setError("Password should be at least 6 characters.");
      else setError(err.message);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setGallery([]);
    setCurrentDesign(null);
    setPrompt('');
  };

  // --- FIRESTORE SYNC ---
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

  // --- AI GENERATION ---
  const generateDesign = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setCurrentDesign(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: "Photorealistic interior design, architectural photography, high quality: " + prompt }],
            parameters: { sampleCount: 1 }
          }),
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
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
        throw new Error("Failed to generate image.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to generate. Please try again.");
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

  // --- COMPONENTS ---
  const NavItem = ({ id, icon: Icon, label, isMobile }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`
        ${isMobile 
          ? 'flex flex-col items-center gap-1 p-2 text-xs text-muted hover:text-primary' 
          : 'flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors w-full text-left'
        }
        ${!isMobile && activeTab === id ? 'bg-indigo-50 text-indigo-600' : ''}
        ${!isMobile && activeTab !== id ? 'text-slate-500 hover:bg-slate-50' : ''}
        ${isMobile && activeTab === id ? 'text-indigo-600' : ''}
      `}
    >
      <Icon size={isMobile ? 24 : 20} strokeWidth={activeTab === id ? 2.5 : 2} />
      <span>{label}</span>
    </button>
  );

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <>
        <style>{styles}</style>
        <div className="auth-container bg-slate-50">
          <div className="auth-card">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                <LayoutGrid size={24} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">DreamHome</h1>
              <p className="text-slate-500 text-sm mt-1">Design your dream space with AI</p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10" 
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10" 
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>}

              <button type="submit" className="btn btn-primary w-full">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or continue with</span></div>
            </div>

            <button onClick={handleGoogleSignIn} className="btn btn-secondary w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-500">{authMode === 'login' ? "Don't have an account?" : "Already have an account?"}</span>
              <button 
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(null); }}
                className="ml-1 text-indigo-600 font-semibold hover:underline bg-transparent border-0 p-0"
              >
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- APP UI (Only shown when logged in) ---
  return (
    <>
      <style>{styles}</style>
      <div className="app-shell">
        
        {/* SIDEBAR (Desktop) */}
        <aside className="sidebar">
          <div className="flex items-center gap-3 mb-8 text-indigo-600 px-2">
            <LayoutGrid size={28} />
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">DreamHome</h1>
          </div>
          
          <nav className="flex-1 space-y-2">
            <NavItem id="create" icon={Home} label="Create Design" />
            <NavItem id="gallery" icon={ImageIcon} label="My Gallery" />
            <NavItem id="settings" icon={Settings} label="Settings" />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
             <div className="flex items-center gap-3 px-2 mb-4">
               <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                 {user.email ? user.email.substring(0,2).toUpperCase() : 'U'}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-slate-700 truncate">{user.email || 'User'}</p>
                 <button onClick={handleSignOut} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 mt-0.5 bg-transparent border-0 p-0">
                   <LogOut size={10} /> Sign out
                 </button>
               </div>
             </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="main-view">
          
          <header className="glass-header px-6 py-4 flex justify-between items-center z-20">
            <div className="md:hidden flex items-center gap-2 text-indigo-600">
              <LayoutGrid size={24} />
              <h1 className="font-bold text-lg text-slate-900">DreamHome</h1>
            </div>
            <h2 className="hidden md:block text-xl font-bold text-slate-800 capitalize">{activeTab === 'create' ? 'New Project' : activeTab}</h2>
            
            <div className="flex gap-2">
               <button className="p-2 rounded-full hover:bg-slate-100 transition text-slate-500">
                 <Share size={20} />
               </button>
            </div>
          </header>

          <div className="content-scroll">
            <div className="max-w-5xl mx-auto">
              
              {activeTab === 'create' && (
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  <div className="w-full lg:w-3/5">
                    <div className="w-full aspect-square md:aspect-video lg:aspect-[4/3] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative group flex items-center justify-center">
                      {isGenerating ? (
                        <div className="text-center p-8">
                           <div className="spinner border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                           <p className="text-sm font-medium text-indigo-600 animate-pulse">Designing your space...</p>
                        </div>
                      ) : currentDesign ? (
                        <>
                          <img src={currentDesign.image} alt="Generated" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                            <p className="text-white text-sm font-medium line-clamp-2">{currentDesign.prompt}</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-8 text-slate-400">
                          <Sparkles size={48} className="mx-auto mb-4 text-slate-200" />
                          <h3 className="text-lg font-semibold text-slate-600">Visualize Your Dream</h3>
                          <p className="text-sm mt-2 max-w-xs mx-auto">Enter a prompt to generate high-quality architectural designs.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full lg:w-2/5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Design Prompt</label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A minimalist living room with floor-to-ceiling windows overlooking a forest..."
                        className="input-area h-32"
                      />
                      
                      {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>}

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-500 mb-2">Inspiration</p>
                        <div className="flex flex-wrap gap-2">
                          {['Modern Loft', 'Cyberpunk', 'Cottagecore', 'Art Deco'].map(tag => (
                            <button 
                              key={tag}
                              onClick={() => setPrompt(p => p ? `${p}, ${tag}` : tag)}
                              className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs hover:border-indigo-500 hover:text-indigo-600 transition"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={generateDesign} 
                        disabled={isGenerating || !prompt.trim()}
                        className="btn btn-primary w-full mt-6"
                      >
                        {isGenerating ? 'Generating...' : <><Sparkles size={18} /> Generate Design</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  {gallery.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                      <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">Your gallery is empty.</p>
                      <button onClick={() => setActiveTab('create')} className="text-indigo-600 font-medium text-sm mt-2 hover:underline bg-transparent border-0 p-0">Create your first design</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {gallery.map((item) => (
                        <div key={item.id} className="group bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                          <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative mb-3">
                            <img src={item.image} alt="Design" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteDesign(item.id); }}
                                className="p-2 bg-white/90 backdrop-blur rounded-full text-red-500 hover:bg-red-50 border-0 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 font-medium line-clamp-2" title={item.prompt}>{item.prompt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                 <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="p-6 border-b border-slate-100">
                     <h3 className="font-bold text-lg text-slate-800">Account Settings</h3>
                     <p className="text-sm text-slate-500">Manage your preferences and subscription.</p>
                   </div>
                   <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-700">Signed in as</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                        <button onClick={handleSignOut} className="btn btn-secondary text-xs">Sign Out</button>
                      </div>
                      <div className="pt-6 border-t border-slate-100">
                         <div className="flex items-center justify-between">
                           <div>
                             <p className="font-medium text-slate-700">Dark Mode</p>
                             <p className="text-xs text-slate-400">Switch between light and dark themes</p>
                           </div>
                           <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                         </div>
                      </div>
                   </div>
                 </div>
              )}

            </div>
          </div>

          <nav className="mobile-nav">
             <NavItem id="create" icon={Home} label="Create" isMobile />
             <NavItem id="gallery" icon={ImageIcon} label="Gallery" isMobile />
             <NavItem id="settings" icon={Settings} label="Settings" isMobile />
          </nav>
        </main>
      </div>
    </>
  );
};

export default DreamHomeApp;