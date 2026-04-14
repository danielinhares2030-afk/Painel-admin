import React, { useState, useEffect } from 'react';
import { 
  BookOpen, LayoutDashboard, PlusCircle, List, 
  UploadCloud, Trash2, LogOut, Loader2, Image as ImageIcon,
  Archive, AlertCircle, CheckCircle, Menu, X, Play, Edit3,
  ShoppingBag, Tag, Coins, Wand2, Sparkles, Palette, Layers
} from 'lucide-react';

import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { uploadToCloudinary, applyCloudinaryTransform, removeBackgroundWithRemoveBg } from './api';

const GENEROS = ["Ação", "Aventura", "Romance", "Fantasia", "Sci-Fi", "Terror", "Sistema", "Isekai", "Escolar", "Artes Marciais", "Cultivo", "Comédia", "Drama", "Mistério", "Slice of Life", "Sobrenatural", "Histórico", "Esportes", "Mecha", "Psicológico"];
const TIPOS = ["Mangá", "Manhwa", "Manhua", "Shoujo"];
const TIPOS_LOJA = ["Moldura", "Avatar", "Capa", "Nickname"];
const CATEGORIAS_IA = ["moldura", "avatar", "capa_fundo", "nickname"];
const RARIDADES_IA = ["aleatorio", "comum", "raro", "epico", "lendario", "mitico"];

const TABELA_PRECOS = {
  "comum": 500, "raro": 1500, "epico": 3000, "lendario": 5000, "mitico": 10000
};

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-gray-950 text-red-500 flex flex-col items-center justify-center p-10 font-sans">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Erro na Aplicação Admin</h1>
        <pre className="bg-gray-900 p-6 rounded-2xl w-full max-w-2xl overflow-auto text-sm">{this.state.error.toString()}</pre>
      </div>
    );
    return this.props.children;
  }
}

function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === "admin890@gmail.com") setUser(currentUser);
      else if (currentUser) { signOut(auth); setUser(null); alert("Acesso Negado"); } 
      else setUser(null);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigate = (view) => { setCurrentView(view); setIsSidebarOpen(false); };

  if (loadingAuth) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><Loader2 className="w-10 h-10 text-purple-500 animate-spin" /></div>;
  if (!user) return <LoginAdmin />;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex font-sans overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-2xl`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
          <div className="flex items-center gap-3 text-purple-500 font-black text-xl tracking-tight"><BookOpen className="w-8 h-8" /> ADMIN</div>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <MenuButton icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
          <div className="pt-6 pb-2 text-xs font-black text-gray-600 uppercase tracking-widest pl-2">Obras</div>
          <MenuButton icon={PlusCircle} label="Cadastrar Obras" active={currentView === 'nova_obra'} onClick={() => handleNavigate('nova_obra')} />
          <MenuButton icon={List} label="Gerenciar Obras" active={currentView === 'listar_obras'} onClick={() => handleNavigate('listar_obras')} />
          <div className="pt-6 pb-2 text-xs font-black text-gray-600 uppercase tracking-widest pl-2">Capítulos</div>
          <MenuButton icon={UploadCloud} label="Upload em Massa" active={currentView === 'upload_capitulo'} onClick={() => handleNavigate('upload_capitulo')} />
          <div className="pt-6 pb-2 text-xs font-black text-gray-600 uppercase tracking-widest pl-2">Loja & Cosméticos</div>
          <MenuButton icon={Wand2} label="IA Geradora" active={currentView === 'loja_ia'} onClick={() => handleNavigate('loja_ia')} />
          <MenuButton icon={ShoppingBag} label="Gerenciar Loja" active={currentView === 'loja'} onClick={() => handleNavigate('loja')} />
        </nav>
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-3 px-4 py-4 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-colors"><LogOut className="w-5 h-5" /> Sair do Sistema</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative h-screen w-full">
        <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 p-4 md:p-6 sticky top-0 z-10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-400 bg-gray-800 p-2 rounded-lg transition-colors hover:text-white" onClick={() => setIsSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
            <h2 className="text-xl md:text-2xl font-black text-white capitalize">{currentView.replace('_', ' ')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-bold text-gray-400">{user.email}</span>
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center font-black text-white shadow-lg border border-purple-500/50">A</div>
          </div>
        </header>
        
        <div className="p-4 md:p-8 max-w-6xl mx-auto overflow-hidden">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'nova_obra' && <CadastrarObraView />}
          {currentView === 'listar_obras' && <GerenciarObrasView />}
          {currentView === 'upload_capitulo' && <UploadCapituloView />}
          {currentView === 'loja' && <LojaView />}
          {currentView === 'loja_ia' && <LojaIAView />}
        </div>
      </main>
    </div>
  );
}

function MenuButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-left transition-all duration-300 ${active ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 translate-x-1' : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'}`}>
      <Icon className="w-5 h-5 flex-shrink-0" /> <span className="truncate">{label}</span>
    </button>
  );
}

function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (email !== "admin890@gmail.com") throw new Error("Acesso negado");
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (err) {
      setError(err.message === "Acesso negado" ? "Acesso Negado: E-mail não autorizado." : "Credenciais inválidas.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans animate-in fade-in duration-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px]"></div>
      </div>
      <div className="bg-gray-900/80 backdrop-blur-2xl border border-gray-800 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-950 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-800"><BookOpen className="w-10 h-10 text-purple-500" /></div>
          <h1 className="text-3xl font-black text-white">Admin Hub</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Controle Total Manga Infinity</p>
        </div>

        {error && <div className="text-red-400 text-center font-bold text-sm bg-red-500/10 p-4 rounded-xl mb-6 border border-red-500/20">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="E-mail Administrativo" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-5 py-4 text-white outline-none focus:border-purple-500 transition-colors font-medium" />
          <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} required placeholder="Senha" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-5 py-4 text-white outline-none focus:border-purple-500 transition-colors font-medium" />
          <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl mt-4 flex justify-center items-center gap-2 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Aceder ao Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DashboardView() {
  const [stats, setStats] = useState({ obras: 0, capitulos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const obrasSnap = await getDocs(collection(db, "obras"));
        let caps = 0;
        for (const obra of obrasSnap.docs) {
          const c = await getDocs(collection(db, `obras/${obra.id}/capitulos`));
          caps += c.size;
        }
        setStats({ obras: obrasSnap.size, capitulos: caps });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gray-900 border border-gray-800 p-8 md:p-10 rounded-[2rem] flex items-center justify-between shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors"></div>
        <div className="relative z-10">
          <p className="text-gray-400 font-black uppercase text-xs tracking-widest mb-2">Total de Obras</p>
          <h3 className="text-5xl md:text-6xl font-black text-white">{loading ? <Loader2 className="w-10 h-10 animate-spin text-purple-500"/> : stats.obras}</h3>
        </div>
        <BookOpen className="w-16 h-16 md:w-20 md:h-20 text-purple-500/20 relative z-10" />
      </div>
      
      <div className="bg-gray-900 border border-gray-800 p-8 md:p-10 rounded-[2rem] flex items-center justify-between shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
        <div className="relative z-10">
          <p className="text-gray-400 font-black uppercase text-xs tracking-widest mb-2">Capítulos</p>
          <h3 className="text-5xl md:text-6xl font-black text-white">{loading ? <Loader2 className="w-10 h-10 animate-spin text-indigo-500"/> : stats.capitulos}</h3>
        </div>
        <List className="w-16 h-16 md:w-20 md:h-20 text-indigo-500/20 relative z-10" />
      </div>
    </div>
  );
}

function CadastrarObraView() {
  const defaultForm = { title: '', author: '', synopsis: '', status: 'Em Lançamento', type: 'Mangá', demographic: 'Shounen' };
  const [formData, setFormData] = useState(defaultForm);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [customGenre, setCustomGenre] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  
  const [obrasQueue, setObrasQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [progress, setProgress] = useState(0);

  const toggleGenre = (g) => setSelectedGenres(p => p.includes(g) ? p.filter(x=>x!==g) : [...p, g]);

  const handleAddCustomGenre = (e) => {
    e?.preventDefault();
    const trimmed = customGenre.trim();
    if(trimmed && !selectedGenres.includes(trimmed)) {
       setSelectedGenres([...selectedGenres, trimmed]);
    }
    setCustomGenre('');
  };

  const handleAddToQueue = (e) => {
    e.preventDefault();
    if (!coverFile) return setMessage({ text: 'Erro: Anexe a capa da obra.', type: 'error' });
    if (selectedGenres.length === 0) return setMessage({ text: 'Erro: Selecione os gêneros da obra.', type: 'error' });
    if (!formData.title || !formData.author || !formData.synopsis) return setMessage({ text: 'Erro: Preencha todos os campos de texto.', type: 'error' });

    const newObra = {
      id: Math.random().toString(),
      ...formData,
      genres: selectedGenres,
      coverFile,
      coverPreview: URL.createObjectURL(coverFile),
      statusText: 'pending'
    };

    setObrasQueue([...obrasQueue, newObra]);
    setFormData(defaultForm);
    setSelectedGenres([]);
    setCustomGenre('');
    setCoverFile(null);
    setMessage({ text: '', type: '' });
  };

  const removeQueueItem = (id) => setObrasQueue(obrasQueue.filter(q => q.id !== id));

  const handleSubmitQueue = async () => {
    if (obrasQueue.length === 0) return setMessage({ text: 'Adicione obras à fila primeiro.', type: 'error' });
    setLoading(true); setMessage({ text: 'Iniciando uploads...', type: 'info' });
    setProgress(0);
    let hasErrors = false;

    for (let i = 0; i < obrasQueue.length; i++) {
      const item = obrasQueue[i];
      if (item.statusText === 'done') continue;
      setObrasQueue(prev => prev.map(q => q.id === item.id ? { ...q, statusText: 'uploading' } : q));
      setProgress(Math.round((i / obrasQueue.length) * 100));

      try {
        const coverUrl = await uploadToCloudinary(item.coverFile);
        const obraId = Date.now().toString() + Math.floor(Math.random()*1000); 
        
        await setDoc(doc(db, "obras", obraId), { 
          title: item.title, author: item.author, synopsis: item.synopsis, status: item.status, type: item.type, demographic: item.demographic,
          genres: item.genres, coverUrl, rating: 5.0, views: 0, ratingCount: 0, createdAt: Date.now() 
        });
        
        setObrasQueue(prev => prev.map(q => q.id === item.id ? { ...q, statusText: 'done' } : q));
      } catch (err) { 
        setObrasQueue(prev => prev.map(q => q.id === item.id ? { ...q, statusText: 'error' } : q));
        hasErrors = true;
      }
    }
    
    setProgress(100);
    setLoading(false);
    if (hasErrors) setMessage({ text: 'Concluído, mas com erros nalgumas obras.', type: 'error' });
    else {
      setMessage({ text: 'Todas as obras gravadas com sucesso no sistema!', type: 'success' });
      setTimeout(() => setObrasQueue([]), 3000);
    }
  };

  const allGenresToDisplay = Array.from(new Set([...GENEROS, ...selectedGenres]));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleAddToQueue} className="bg-gray-900 border border-gray-800 p-6 md:p-10 rounded-[2rem] shadow-xl space-y-8">
        <h3 className="text-2xl font-black text-white flex items-center gap-2 border-b border-gray-800 pb-4"><BookOpen className="text-purple-500" /> Adicionar Obra à Fila</h3>
        {message.text && !loading && (
          <div className={`p-4 rounded-xl font-bold flex items-center gap-3 text-sm animate-in zoom-in-95 duration-300 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0"/> : <CheckCircle className="w-5 h-5 flex-shrink-0"/>} 
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-6">
            <div><label className="block text-sm font-bold text-gray-400 mb-2">Título da Obra</label><input type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="Escreva o Título" className="w-full bg-gray-950 p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 transition-colors" /></div>
            <div><label className="block text-sm font-bold text-gray-400 mb-2">Autor</label><input type="text" value={formData.author} onChange={e=>setFormData({...formData, author: e.target.value})} placeholder="Nome do Autor ou Estúdio" className="w-full bg-gray-950 p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 transition-colors" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Origem</label>
                <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full bg-gray-950 p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 cursor-pointer">
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Status</label>
                <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full bg-gray-950 p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 cursor-pointer">
                  <option value="Em Lançamento">Em Lançamento</option><option value="Completo">Completo</option><option value="Hiato">Hiato</option>
                </select>
              </div>
            </div>
            <div><label className="block text-sm font-bold text-gray-400 mb-2">Sinopse</label><textarea value={formData.synopsis} onChange={e=>setFormData({...formData, synopsis: e.target.value})} placeholder="Resumo da história..." rows="5" className="w-full bg-gray-950 p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 resize-none transition-colors" /></div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Capa Oficial</label>
              <label className="w-full h-48 md:h-56 bg-gray-950 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-gray-900 transit
