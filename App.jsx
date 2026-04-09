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
              <label className="w-full h-48 md:h-56 bg-gray-950 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-gray-900 transition-all p-4">
                {coverFile ? ( <span className="text-purple-400 font-bold text-center break-all text-sm">{coverFile.name}</span> ) : (
                  <><ImageIcon className="w-12 h-12 text-gray-600 mb-3" /><span className="text-gray-400 font-bold text-sm">Clique para carregar a capa</span></>
                )}
                <input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files[0])} className="hidden" />
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-3">Gêneros</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {allGenresToDisplay.map(g => (
                  <button type="button" key={g} onClick={()=>toggleGenre(g)} className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${selectedGenres.includes(g) ? 'bg-purple-600 border-purple-500 text-white shadow-md' : 'bg-gray-950 text-gray-500 border-gray-800 hover:text-white hover:border-gray-600'}`}>{g}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={customGenre} onChange={e=>setCustomGenre(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomGenre(); } }} placeholder="Adicionar outro gênero..." className="bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 text-sm flex-1 transition-colors" />
                <button type="button" onClick={handleAddCustomGenre} className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg font-bold transition-colors">Add</button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex justify-end">
          <button type="submit" disabled={loading} className="w-full md:w-auto bg-gray-800 hover:bg-gray-700 text-white py-4 md:px-12 rounded-xl font-black flex items-center justify-center gap-3 transition-all"><PlusCircle className="w-6 h-6"/> Adicionar à Fila</button>
        </div>
      </form>

      {obrasQueue.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 p-6 md:p-10 rounded-[2rem] shadow-xl space-y-6">
          <h3 className="text-xl font-black text-white">Fila de Publicação ({obrasQueue.length})</h3>
          <div className="space-y-4">
            {obrasQueue.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-4 bg-gray-950 p-4 rounded-2xl border border-gray-800">
                 <img src={item.coverPreview} className="w-16 h-24 object-cover rounded-lg border border-gray-800" />
                 <div className="flex-1 w-full min-w-0"><h4 className="font-bold text-white truncate text-lg">{item.title}</h4><p className="text-gray-500 text-xs mt-1">{item.genres.join(', ')}</p></div>
                 <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                    <span className={`text-xs font-bold px-3 py-2 rounded-lg w-24 text-center ${item.statusText === 'pending' ? 'bg-gray-800 text-gray-300' : item.statusText === 'uploading' ? 'bg-blue-600 text-white animate-pulse' : item.statusText === 'done' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{item.statusText === 'pending' ? 'Pendente' : item.statusText === 'uploading' ? 'A Enviar' : item.statusText === 'done' ? 'Sucesso' : 'Erro'}</span>
                    <button onClick={() => removeQueueItem(item.id)} disabled={loading} className="text-red-500 hover:bg-red-500/10 p-3 rounded-xl disabled:opacity-30 transition-colors"><Trash2 className="w-5 h-5"/></button>
                 </div>
              </div>
            ))}
          </div>
          {loading && (
            <div className="w-full bg-gray-950 rounded-full h-4 border border-gray-800 overflow-hidden relative shadow-inner"><div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div><span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">{progress}%</span></div>
          )}
          <div className="pt-6 border-t border-gray-800">
            <button onClick={handleSubmitQueue} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl flex justify-center items-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-purple-600/30">
              {loading ? <Loader2 className="w-6 h-6 animate-spin"/> : <><UploadCloud className="w-6 h-6"/> Salvar Todas as Obras no Banco</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GerenciarObrasView() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [obraToDelete, setObraToDelete] = useState(null);
  const [obraToEdit, setObraToEdit] = useState(null);
  const [selectedObraForChapters, setSelectedObraForChapters] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editSelectedGenres, setEditSelectedGenres] = useState([]);
  const [editCustomGenre, setEditCustomGenre] = useState('');
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [capitulos, setCapitulos] = useState([]);
  const [loadingCaps, setLoadingCaps] = useState(false);
  const [editCapFormData, setEditCapFormData] = useState(null);
  const [capToDelete, setCapToDelete] = useState(null);

  useEffect(() => { fetchObras(); }, []);

  const fetchObras = async () => {
    try {
      const snap = await getDocs(collection(db, "obras"));
      const list = []; snap.forEach(d => list.push({id: d.id, ...d.data()}));
      setObras(list.sort((a,b)=>b.createdAt - a.createdAt));
    } catch(e) {} finally { setLoading(false); }
  };

  const confirmDelete = async () => {
    if (!obraToDelete) return;
    try {
      await deleteDoc(doc(db, "obras", obraToDelete.id));
      setObras(obras.filter(o => o.id !== obraToDelete.id));
      setObraToDelete(null);
    } catch (e) { alert("Erro ao eliminar a obra."); }
  };

  const confirmDeleteCap = async () => {
    if (!capToDelete || !selectedObraForChapters) return;
    try {
      await deleteDoc(doc(db, `obras/${selectedObraForChapters.id}/capitulos`, capToDelete.id));
      fetchCapitulos(selectedObraForChapters.id);
      setCapToDelete(null);
    } catch(e) {}
  };

  const openEditModal = (obra) => {
    setEditFormData({ title: obra.title, author: obra.author, synopsis: obra.synopsis, status: obra.status || 'Em Lançamento', type: obra.type || 'Mangá' });
    setEditSelectedGenres(obra.genres || []); setEditCustomGenre(''); setEditCoverFile(null); setObraToEdit(obra);
  };

  const handleEditAddCustomGenre = (e) => {
    e?.preventDefault();
    const trimmed = editCustomGenre.trim();
    if(trimmed && !editSelectedGenres.includes(trimmed)) setEditSelectedGenres([...editSelectedGenres, trimmed]);
    setEditCustomGenre('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editSelectedGenres.length === 0) return alert('Erro: Selecione pelo menos um género.');
    setEditLoading(true);
    try {
      let finalCoverUrl = obraToEdit.coverUrl;
      if (editCoverFile) finalCoverUrl = await uploadToCloudinary(editCoverFile);
      await updateDoc(doc(db, "obras", obraToEdit.id), { title: editFormData.title, author: editFormData.author, type: editFormData.type, status: editFormData.status, synopsis: editFormData.synopsis, genres: editSelectedGenres, coverUrl: finalCoverUrl });
      await fetchObras(); setObraToEdit(null);
    } catch(err) { alert("Erro ao guardar edições: " + err.message); } finally { setEditLoading(false); }
  };

  const openChaptersModal = async (obra) => { setSelectedObraForChapters(obra); fetchCapitulos(obra.id); };

  const fetchCapitulos = async (obraId) => {
    setLoadingCaps(true);
    try {
      const snap = await getDocs(collection(db, `obras/${obraId}/capitulos`));
      const list = []; snap.forEach(d => list.push({id: d.id, ...d.data()}));
      setCapitulos(list.sort((a,b) => b.number - a.number));
    } catch(e) {} finally { setLoadingCaps(false); }
  };

  const handleEditCapSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, `obras/${selectedObraForChapters.id}/capitulos`, editCapFormData.id), { number: Number(editCapFormData.number), title: editCapFormData.title || `${selectedObraForChapters.title} - Capítulo ${editCapFormData.number}` });
      setEditCapFormData(null); fetchCapitulos(selectedObraForChapters.id);
    } catch(err) { alert(err.message); }
  };

  if (loading) return <div className="text-center py-20"><Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" /></div>;

  const allEditGenresToDisplay = Array.from(new Set([...GENEROS, ...editSelectedGenres]));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {selectedObraForChapters && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-[2rem] max-w-3xl w-full shadow-2xl animate-in zoom-in-95 duration-300 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
               <h3 className="text-2xl font-black text-white flex items-center gap-2"><List className="text-purple-500"/> Capítulos de {selectedObraForChapters.title}</h3>
               <button onClick={() => {setSelectedObraForChapters(null); setEditCapFormData(null);}} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
            </div>

            {loadingCaps ? <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto my-10 flex-shrink-0"/> : (
              <div className="space-y-3 overflow-y-auto pr-2 pb-4">
                 {capitulos.length === 0 ? <p className="text-gray-500 text-center font-bold">Nenhum capítulo cadastrado.</p> : capitulos.map(cap => (
                    <div key={cap.id} className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                       {editCapFormData && editCapFormData.id === cap.id ? (
                          <form onSubmit={handleEditCapSubmit} className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                             <input type="number" step="0.1" value={editCapFormData.number} onChange={e=>setEditCapFormData({...editCapFormData, number: e.target.value})} className="w-full sm:w-24 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none" required />
                             <input type="text" value={editCapFormData.title} onChange={e=>setEditCapFormData({...editCapFormData, title: e.target.value})} className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none" placeholder="Título (Opcional)" />
                             <div className="flex gap-2">
                                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition-colors">Salvar</button>
                                <button type="button" onClick={()=>setEditCapFormData(null)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">Cancelar</button>
                             </div>
                          </form>
                       ) : (
                          <>
                            <div>
                               <p className="text-white font-bold">Capítulo {cap.number}</p>
                               {cap.title && <p className="text-gray-400 text-sm">{cap.title}</p>}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                               <button onClick={()=>setEditCapFormData({id: cap.id, number: cap.number, title: cap.title || `${selectedObraForChapters.title} - Capítulo ${cap.number}`})} className="flex-1 sm:flex-none p-3 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex justify-center"><Edit3 className="w-5 h-5"/></button>
                               <button onClick={()=>setCapToDelete(cap)} className="flex-1 sm:flex-none p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex justify-center"><Trash2 className="w-5 h-5"/></button>
                            </div>
                          </>
                       )}
                    </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Seguro para Excluir Capítulo */}
      {capToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8"/></div>
            <h3 className="text-2xl font-black text-white mb-2">Apagar Capítulo?</h3>
            <p className="text-gray-400 mb-8 text-sm">Tem a certeza que deseja eliminar o <b>Capítulo {capToDelete.number}</b>?</p>
            <div className="flex gap-4">
               <button onClick={() => setCapToDelete(null)} className="flex-1 bg-gray-800 text-white font-bold py-3.5 rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
               <button onClick={confirmDeleteCap} className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-500 shadow-lg shadow-red-600/30 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {obraToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-[2rem] max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-300 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
               <h3 className="text-2xl font-black text-white flex items-center gap-2"><Edit3 className="text-purple-500"/> Editar Obra</h3>
               <button onClick={() => setObraToEdit(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
            </div>
            <div className="overflow-y-auto pr-2 pb-4">
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-purple-400 mb-1">Título da Obra</label>
                      <input type="text" value={editFormData.title || ''} onChange={e=>setEditFormData({...editFormData, title: e.target.value})} required className="w-full bg-gray-950 p-4 rounded-xl border border-purple-500/30 text-white outline-none focus:border-purple-500 font-bold" />
                    </div>
                    <div><label className="block text-sm font-bold text-gray-400 mb-1">Autor</label><input type="text" value={editFormData.author || ''} onChange={e=>setEditFormData({...editFormData, author: e.target.value})} required className="w-full bg-gray-950 p-3 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-bold text-gray-400 mb-1">Origem</label><select value={editFormData.type} onChange={e=>setEditFormData({...editFormData, type: e.target.value})} className="w-full bg-gray-950 p-3 rounded-xl border border-gray-800 text-white outline-none cursor-pointer">{TIPOS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="block text-sm font-bold text-gray-400 mb-1">Status</label><select value={editFormData.status} onChange={e=>setEditFormData({...editFormData, status: e.target.value})} className="w-full bg-gray-950 p-3 rounded-xl border border-gray-800 text-white outline-none cursor-pointer"><option value="Em Lançamento">Em Lançamento</option><option value="Completo">Completo</option><option value="Hiato">Hiato</option></select></div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-400 mb-1">Sinopse</label><textarea value={editFormData.synopsis || ''} onChange={e=>setEditFormData({...editFormData, synopsis: e.target.value})} required rows="4" className="w-full bg-gray-950 p-3 rounded-xl border border-gray-800 text-white outline-none resize-none" /></div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-1">Capa (Deixe em branco para manter a atual)</label>
                      <label className="w-full h-32 bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-all p-4">
                        {editCoverFile ? <span className="text-purple-400 font-bold text-center text-sm">{editCoverFile.name}</span> : <><ImageIcon className="w-8 h-8 text-gray-600 mb-2" /><span className="text-gray-400 font-bold text-xs">Nova imagem</span></>}
                        <input type="file" accept="image/*" onChange={e=>setEditCoverFile(e.target.files[0])} className="hidden" />
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-400 mb-2">Géneros</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {allEditGenresToDisplay.map(g => (
                          <button type="button" key={g} onClick={() => setEditSelectedGenres(p => p.includes(g) ? p.filter(x=>x!==g) : [...p, g])} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editSelectedGenres.includes(g) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:text-white'}`}>
                            {g}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                         <input type="text" value={editCustomGenre} onChange={e=>setCustomGenre(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEditAddCustomGenre(); } }} placeholder="Adicionar outro..." className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 text-sm flex-1 transition-colors" />
                         <button type="button" onClick={handleEditAddCustomGenre} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">Add</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-800">
                  <button type="button" onClick={() => setObraToEdit(null)} className="flex-1 bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
                  <button type="submit" disabled={editLoading} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl transition-colors shadow-lg shadow-purple-600/30 flex justify-center items-center gap-2">
                    {editLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Guardar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {obraToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8"/></div>
            <h3 className="text-2xl font-black text-white mb-2">Apagar Obra?</h3>
            <p className="text-gray-400 mb-8 text-sm">Tem a certeza que deseja eliminar permanentemente a obra <b>"{obraToDelete.title}"</b>?</p>
            <div className="flex gap-4">
               <button onClick={() => setObraToDelete(null)} className="flex-1 bg-gray-800 text-white font-bold py-3.5 rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
               <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-500 shadow-lg shadow-red-600/30 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {obras.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-16 text-center shadow-xl"><BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" /><p className="font-bold text-gray-500 text-lg">Nenhuma obra registada.</p></div>
      ) : (
        obras.map(o => (
          <div key={o.id} className="bg-gray-900 p-4 md:p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-gray-700 hover:bg-gray-800/30 transition-all shadow-md">
            <div className="flex gap-4 md:gap-5 items-center w-full">
              <img src={o.coverUrl} className="w-16 h-24 md:w-20 md:h-28 object-cover rounded-xl border border-gray-800 flex-shrink-0 shadow-md" />
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-lg md:text-xl text-white truncate mb-1">{o.title}</h4>
                <div className="flex gap-2 mb-2"><span className="text-[10px] font-bold px-2 py-1 bg-gray-800 text-gray-300 rounded uppercase">{o.type}</span></div>
                <p className="text-xs text-gray-500 font-mono truncate">ID: {o.id}</p>
              </div>
            </div>
            <div className="w-full sm:w-auto flex gap-2">
              <button onClick={()=>openChaptersModal(o)} className="flex-1 sm:flex-none p-3 md:p-4 bg-gray-800 text-gray-300 hover:bg-purple-600 hover:text-white rounded-xl transition-all flex items-center justify-center"><List className="w-5 h-5 md:w-6 md:h-6"/></button>
              <button onClick={()=>openEditModal(o)} className="flex-1 sm:flex-none p-3 md:p-4 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all flex items-center justify-center"><Edit3 className="w-5 h-5 md:w-6 md:h-6"/></button>
              <button onClick={()=>setObraToDelete(o)} className="flex-1 sm:flex-none p-3 md:p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center"><Trash2 className="w-5 h-5 md:w-6 md:h-6"/></button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function UploadCapituloView() {
  const [obras, setObras] = useState([]);
  const [selectedObraId, setSelectedObraId] = useState('');
  const [uploadQueue, setUploadQueue] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!window.JSZip) {
      const script = document.createElement('script'); script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; document.body.appendChild(script);
    }
    getDocs(collection(db, "obras")).then(snap => {
      const list = []; snap.forEach(d => list.push({id: d.id, title: d.data().title}));
      setObras(list.sort((a,b) => a.title.localeCompare(b.title)));
      if(list.length > 0) setSelectedObraId(list[0].id);
    });
  }, []);

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files).filter(file => { const name = file.name.toLowerCase(); return name.endsWith('.zip') || name.endsWith('.cbz'); });
    if (files.length === 0) { if (e.target.files.length > 0) setMessage({ text: 'Por favor, selecione apenas ficheiros com final .zip ou .cbz', type: 'error' }); return; }
    const newItems = files.map(file => { const match = file.name.match(/\d+(\.\d+)?/); const chapterNum = match ? match[0] : ''; return { id: Math.random().toString(), file, chapterNum, status: 'pending' }; });
    setUploadQueue([...uploadQueue, ...newItems]); setMessage({ text: '', type: '' });
  };

  const removeQueueItem = (id) => setUploadQueue(uploadQueue.filter(q => q.id !== id));
  const updateQueueItem = (id, field, value) => setUploadQueue(uploadQueue.map(q => q.id === id ? { ...q, [field]: value } : q));

  const processQueue = async () => {
    setMessage({ text: '', type: '' });
    if (!selectedObraId || uploadQueue.length === 0) return setMessage({ text: "Erro: Selecione a obra e adicione os ficheiros.", type: "error" });
    if (uploadQueue.some(q => !q.chapterNum)) return setMessage({ text: "Erro: Preencha o NÚMERO DO CAPÍTULO para todos.", type: "error" });
    setIsProcessing(true); setGlobalProgress(0); let hadErrors = false;
    const obraSelecionada = obras.find(o => o.id === selectedObraId); const obraName = obraSelecionada ? obraSelecionada.title : "Obra";

    for (let index = 0; index < uploadQueue.length; index++) {
      const item = uploadQueue[index]; if (item.status === 'done') continue;
      updateQueueItem(item.id, 'status', 'uploading'); setGlobalProgress(Math.round((index / uploadQueue.length) * 100));
      try {
        const zip = new window.JSZip(); const loadedZip = await zip.loadAsync(item.file); const imageFiles = [];
        loadedZip.forEach((relativePath, zipEntry) => { if (!zipEntry.dir && relativePath.match(/\.(jpg|jpeg|png|webp)$/i)) imageFiles.push(zipEntry); });
        if (imageFiles.length === 0) throw new Error("Sem imagens.");
        imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        const uploadedUrls = [];
        for (let i = 0; i < imageFiles.length; i += 30) {
          const chunk = imageFiles.slice(i, i + 30);
          const promises = chunk.map(async (entry) => { const blob = await entry.async("blob"); const file = new File([blob], entry.name, { type: blob.type }); return uploadToCloudinary(file); });
          const urls = await Promise.all(promises); uploadedUrls.push(...urls);
        }
        await setDoc(doc(db, `obras/${selectedObraId}/capitulos`, item.chapterNum.toString()), { number: Number(item.chapterNum), title: `${obraName} - Capítulo ${item.chapterNum}`, pages: uploadedUrls, createdAt: Date.now() });
        updateQueueItem(item.id, 'status', 'done');
      } catch (err) { updateQueueItem(item.id, 'status', 'error'); hadErrors = true; }
    }
    setGlobalProgress(100); setIsProcessing(false);
    if (hadErrors) setMessage({ text: "Concluído, mas com erros nalguns ficheiros.", type: "error" }); else setMessage({ text: "Uploads concluídos com sucesso total!", type: "success" });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-6 md:p-10 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-gray-800 pb-6"><h3 className="text-2xl font-black text-white flex items-center gap-3"><UploadCloud className="w-8 h-8 text-purple-500" /> Upload em Massa</h3><p className="text-gray-400 mt-2 text-sm md:text-base">Selecione múltiplos ficheiros ZIP ou CBZ ao mesmo tempo.</p></div>
      {message.text && (<div className={`p-4 rounded-xl mb-8 font-bold flex items-center gap-3 text-sm animate-in zoom-in-95 duration-300 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>{message.type === 'error' ? <AlertCircle className="w-6 h-6 flex-shrink-0" /> : <CheckCircle className="w-6 h-6 flex-shrink-0" />}{message.text}</div>)}
      <div className="space-y-8">
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2">Vincular os Capítulos à Obra</label>
          <select value={selectedObraId} onChange={e=>setSelectedObraId(e.target.value)} disabled={isProcessing} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-5 py-4 text-white outline-none focus:border-purple-500 transition-colors font-bold cursor-pointer">{obras.length === 0 ? <option disabled>Carregando obras...</option> : obras.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}</select>
        </div>
        <div>
          <label className="w-full bg-gray-950 border-2 border-dashed border-gray-700 py-10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-gray-900 transition-all p-4">
            <Archive className="w-12 h-12 text-gray-600 mb-3" /><span className="text-white font-bold text-lg text-center">Clique e selecione vários ZIPs ou CBZs</span><input type="file" multiple className="hidden" onChange={handleFilesSelected} disabled={isProcessing} />
          </label>
        </div>
        {uploadQueue.length > 0 && (
          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-inner">
            <h4 className="font-black text-gray-400 uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><List className="w-4 h-4"/> Fila de Envio ({uploadQueue.length})</h4>
            <div className="space-y-3">
              {uploadQueue.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800">
                   <div className="bg-purple-900/20 p-3 rounded-xl hidden sm:block"><Archive className="w-6 h-6 text-purple-500" /></div>
                   <div className="flex-1 min-w-0 w-full"><p className="text-sm font-bold text-white truncate">{item.file.name}</p></div>
                   <div className="w-full sm:w-auto flex items-center gap-3">
                     <input type="number" step="0.1" placeholder="Nº do Cap." value={item.chapterNum} onChange={e => updateQueueItem(item.id, 'chapterNum', e.target.value)} disabled={isProcessing || item.status === 'done'} className={`w-full sm:w-32 bg-gray-950 border rounded-xl px-4 py-3 text-white outline-none text-sm font-bold transition-colors ${!item.chapterNum && !isProcessing ? 'border-red-500/50' : 'border-gray-700'}`} />
                     <div className="flex items-center gap-2">
                       <span className={`text-xs font-bold px-3 py-2 rounded-lg w-20 text-center ${item.status === 'pending' ? 'bg-gray-800 text-gray-300' : item.status === 'uploading' ? 'bg-blue-600 text-white animate-pulse' : item.status === 'done' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{item.status === 'pending' ? 'Aguardar' : item.status === 'uploading' ? 'A Enviar' : item.status === 'done' ? 'Sucesso' : 'Erro'}</span>
                       <button onClick={() => removeQueueItem(item.id)} disabled={isProcessing} className="text-red-500 hover:bg-red-500/10 p-3 rounded-xl transition-colors disabled:opacity-30"><Trash2 className="w-5 h-5"/></button>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {isProcessing && (<div className="w-full bg-gray-950 rounded-full h-4 border border-gray-800 overflow-hidden relative shadow-inner"><div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-300" style={{ width: `${globalProgress}%` }}></div><span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">{globalProgress}%</span></div>)}
        <div className="pt-4"><button onClick={processQueue} disabled={isProcessing || uploadQueue.length === 0} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl flex justify-center items-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-purple-600/30">{isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><UploadCloud className="w-6 h-6" /> Iniciar Uploads</>}</button></div>
      </div>
    </div>
  );
}

function LojaView() {
  const defaultForm = { name: '', type: 'Moldura', price: '' };
  const [formData, setFormData] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => { fetchItens(); }, []);

  const fetchItens = async () => {
    try {
      const snap = await getDocs(collection(db, "loja_itens"));
      const list = []; snap.forEach(d => list.push({id: d.id, ...d.data()}));
      setItens(list.sort((a,b) => b.createdAt - a.createdAt));
    } catch(e) { console.error(e); } finally { setFetching(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert('Por favor, adicione uma imagem para o item.');
    if (!formData.name || formData.price === '') return alert('Preencha o nome e o preço.');
    
    setLoading(true);
    setStatusMsg('Processando imagem e salvando...');

    try {
      let fileToUpload = imageFile;

      if (formData.type.toLowerCase() === 'avatar') {
        setStatusMsg('A remover o fundo com a API Remove.bg...');
        try {
           const transparentBlob = await removeBackgroundWithRemoveBg(imageFile);
           fileToUpload = new File([transparentBlob], `${Date.now()}_item.png`, { type: "image/png" });
        } catch(removeErr) {
           alert("Aviso do Remove.bg: " + removeErr.message + ". A imagem será enviada com o fundo original.");
        }
      }

      setStatusMsg('A enviar para a Nuvem...');
      let imageUrl = await uploadToCloudinary(fileToUpload);
      
      if (formData.type.toLowerCase() === 'moldura') {
        imageUrl = applyCloudinaryTransform(imageUrl, 'e_make_transparent:30:black');
      }

      const itemId = Date.now().toString();
      
      await setDoc(doc(db, "loja_itens", itemId), {
        nome: formData.name,
        categoria: formData.type.toLowerCase(),
        preco: Number(formData.price),
        preview: imageUrl,
        raridade: "comum",
        descricao: "Criado manualmente",
        cssClass: "",
        animacao: "",
        createdAt: Date.now()
      });
      
      setFormData(defaultForm); setImageFile(null); fetchItens();
      alert("Item salvo com sucesso!");
    } catch (err) { alert("Erro ao salvar item da loja: " + err.message); } finally { setLoading(false); setStatusMsg(''); }
  };

  const confirmDelete = async () => {
    if(!itemToDelete) return;
    try { 
      await deleteDoc(doc(db, "loja_itens", itemToDelete.id)); 
      setItens(itens.filter(i => i.id !== itemToDelete.id)); 
      setItemToDelete(null);
    } catch(e) { 
      console.error("Erro ao apagar: " + e.message); 
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 p-6 md:p-10 rounded-[2rem] shadow-xl space-y-8">
        <h3 className="text-2xl font-black text-white flex items-center gap-2 border-b border-gray-800 pb-4"><ShoppingBag className="text-purple-500" /> Adicionar Item Manualmente</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-6">
            <div><label className="block text-sm font-bold text-gray-400 mb-2">Nome do Item</label><input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Ex: Capa de Fogo" className="w-full bg-gray-950 p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 transition-colors" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-gray-400 mb-2">Tipo de Item</label><select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full bg-gray-950 p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 cursor-pointer">{TIPOS_LOJA.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-1">Preço <Coins className="w-4 h-4 text-yellow-500"/></label><input type="number" min="0" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} placeholder="Preço em Moedas" className="w-full bg-gray-950 p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 transition-colors" /></div>
            </div>
            <p className="text-gray-500 text-xs italic">O sistema aplicará o recorte da API (Remove.bg) em avatares e o Chroma-key em molduras de forma automática!</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Imagem / Arte do Item</label>
              <label className="w-full h-32 md:h-44 bg-gray-950 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-gray-900 transition-all p-4">
                {imageFile ? (<span className="text-purple-400 font-bold text-center break-all text-sm">{imageFile.name}</span>) : (<><ImageIcon className="w-10 h-10 text-gray-600 mb-2" /><span className="text-gray-400 font-bold text-sm">Clique para carregar imagem</span></>)}
                <input type="file" accept="image/*" onChange={e=>setImageFile(e.target.files[0])} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex justify-end">
          <button type="submit" disabled={loading} className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white py-4 md:px-12 rounded-xl font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-600/30">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><PlusCircle className="w-6 h-6"/> {statusMsg || 'Salvar Item Manual'}</>}
          </button>
        </div>
      </form>

      {/* LISTA DE ITENS DA LOJA */}
      <div className="bg-gray-900 border border-gray-800 p-6 md:p-10 rounded-[2rem] shadow-xl space-y-6">
         <h3 className="text-xl font-black text-white flex items-center gap-2 border-b border-gray-800 pb-4"><Tag className="text-purple-500" /> Itens Disponíveis na Loja</h3>
         
         {fetching ? <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto my-10" /> : itens.length === 0 ? (
           <p className="text-center text-gray-500 font-bold py-10">A loja está vazia no momento.</p>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {itens.map(item => {
               const isCircular = ['moldura', 'avatar'].includes(item.categoria);
               const isBlendable = item.categoria === 'moldura';

               return (
                 <div key={item.id} className="bg-gray-950 border border-gray-800 p-4 rounded-2xl flex flex-col gap-4 relative group">
                    <div className="absolute top-2 right-2 flex gap-2 z-30">
                       <button onClick={() => setItemToDelete(item)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-lg relative z-50 pointer-events-auto"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    
                    <div className="flex justify-center w-full mt-4">
                      <div className={`w-32 h-32 md:w-40 md:h-40 bg-gray-900 overflow-hidden flex items-center justify-center border border-gray-800 p-2 relative ${isCircular ? 'rounded-full' : 'rounded-xl'} ${item.categoria === 'avatar' ? item.cssClass : ''}`}>
                         <style dangerouslySetInnerHTML={{__html: `.${item.cssClass || 'custom-class'} { ${item.css || ''} } \n ${item.animacao || ''}`}} />
                         
                         {item.preview && (
                           <img 
                              src={item.preview} 
                              alt={item.nome} 
                              className={`absolute inset-0 m-auto w-full h-full object-cover z-10 pointer-events-none ${item.categoria !== 'avatar' ? item.cssClass : ''}`} 
                              style={isBlendable ? { mixBlendMode: 'screen' } : {}}
                           />
                         )}

                         {item.css && !item.preview && item.categoria !== 'nickname' && <div className={`w-full h-full flex items-center justify-center font-black text-white ${item.cssClass || 'custom-class'}`}>Exemplo</div>}
                         {item.css && item.categoria === 'nickname' && <div className={`w-full h-full flex items-center justify-center font-black text-xl z-20 ${item.cssClass || 'custom-class'}`}>NomeAqui</div>}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-start mb-1"><h4 className="font-bold text-white text-lg truncate flex-1 pr-2">{item.nome}</h4></div>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-[10px] font-bold px-2 py-1 bg-gray-800 text-gray-300 rounded uppercase">{item.categoria}</span>
                         <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${item.raridade === 'lendario' ? 'bg-yellow-500/20 text-yellow-500' : item.raridade === 'mitico' ? 'bg-red-500/20 text-red-500' : item.raridade === 'epico' ? 'bg-purple-500/20 text-purple-500' : item.raridade === 'raro' ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-800 text-gray-300'}`}>{item.raridade}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                          <span className="text-xs text-gray-500 truncate mr-2 flex-1">{item.descricao}</span>
                          <span className="font-black text-yellow-500 flex items-center gap-1"><Coins className="w-4 h-4"/> {item.preco}</span>
                      </div>
                    </div>
                 </div>
               );
             })}
           </div>
         )}
      </div>

      {/* Modal Seguro para Excluir Item da Loja */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8"/></div>
            <h3 className="text-2xl font-black text-white mb-2">Apagar Item?</h3>
            <p className="text-gray-400 mb-8 text-sm">Tem a certeza que deseja eliminar permanentemente <b>"{itemToDelete.nome}"</b> da loja?</p>
            <div className="flex gap-4">
               <button onClick={() => setItemToDelete(null)} className="flex-1 bg-gray-800 text-white font-bold py-3.5 rounded-xl hover:bg-gray-700 transition-colors">Cancelar</button>
               <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-500 shadow-lg shadow-red-600/30 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LojaIAView() {
  const [prompt, setPrompt] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_IA[0]);
  const [raridadeSelecionada, setRaridadeSelecionada] = useState(RARIDADES_IA[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItem, setGeneratedItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedItem(null);
    setStatusMsg('A IA está a arquitetar o item...');

    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY; // Usando a chave que estiver configurada
    const textModelUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const imageModelUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

    const finalPrompt = prompt.trim() === '' ? 'Invente um tema totalmente aleatório e criativo.' : prompt;

    let regrasEspecificas = "";
    if (categoria === 'capa_fundo') {
        regrasEspecificas = "CRÍTICO: O usuário quer um FUNDO (Background). É PROIBIDO desenhar personagens. ImagePrompt: 'Scenery, landscape, background only, NO CHARACTERS'.";
    } else if (categoria === 'moldura') {
        regrasEspecificas = "CRÍTICO: MOLDURA DE AVATAR. Objeto 2D plano. CÍRCULO PERFEITO tocando as bordas da tela (sem margens). OBRIGATÓRIO: Cores BRILHANTES sobre um FUNDO 100% PRETO SÓLIDO (#000000). ImagePrompt: '2D flat UI asset, circular avatar profile frame touching the edges of the canvas, zero margins, perfect circle shape, bright glowing neon colors, PURE PITCH BLACK BACKGROUND #000000, empty center, NO WHITE BACKGROUND'.";
    } else if (categoria === 'avatar') {
        regrasEspecificas = "CRÍTICO MAXIMO: AVATAR. O segredo aqui é separar a imagem do fundo! Na imagem (imagePrompt), você DEVE gerar apenas o personagem sobre um fundo 100% BRANCO SÓLIDO E VAZIO. É EXPRESSAMENTE PROIBIDO desenhar círculos, luas, emblemas ou auras atrás do personagem na imagem. Em contrapartida, no código 'css', você DEVE adicionar uma propriedade 'background' incrível (ex: radial-gradient, linear-gradient) que combine com o personagem. A nossa API vai apagar o fundo branco da imagem e o seu fundo CSS vai brilhar por trás de forma perfeita! ImagePrompt OBRIGATÓRIO: 'Close-up portrait of [NOME DO PERSONAGEM, se pedido], perfectly centered, authentic 2D anime style, masterpiece, exactly two normal eyes, clean face, PURE SOLID WHITE BACKGROUND #FFFFFF, completely empty background, NO colored circles behind character, NO geometric shapes, NO halos, NO auras'.";
    } else if (categoria === 'nickname') {
        regrasEspecificas = "CRÍTICO: O usuário quer um EFEITO PARA NICKNAME (Texto). NÃO DEVE GERAR IMAGEM! OBRIGATÓRIO: Defina o campo 'imagePrompt' EXATAMENTE com a palavra 'NONE'.";
    }

    let regraRaridade = `A 'raridade' deve ser escolhida pela IA. Use EXATAMENTE: "comum", "raro", "epico", "lendario" ou "mitico".`;
    if (raridadeSelecionada !== 'aleatorio') {
        regraRaridade = `MUITO IMPORTANTE: A 'raridade' DEVE SER EXATAMENTE: "${raridadeSelecionada}".`;
    }

    const systemInstruction = `Você é o diretor de arte de um App de Mangá. Crie um item cosmético único da categoria '${categoria}'.
      Pedido do usuário: '${finalPrompt}'.
      
      REGRAS DE TEMA: NÃO crie tudo com o tema "galáxia", "universo" ou "infinito". Seja criativo.
      
      ${regrasEspecificas}

      REGRAS DO CSS E ANIMAÇÃO: 
      - O 'css' deve conter APENAS propriedades de ESTILO VISUAL (color, border, box-shadow, text-shadow, filter, background).
      - Para AVATARES, você DEVE gerar um 'background' no CSS (ex: linear-gradient) para servir de fundo ao personagem.
      - PROIBIDO usar propriedades de LAYOUT no CSS (como width, height, margin, position, display).
      - Se for animado, OBRIGATORIAMENTE crie animações no campo 'keyframes' e aplique na string do 'css'.

      REGRAS DE FIDELIDADE EXTREMA E COPYRIGHT: O usuário odeia personagens genéricos. Se ele pedir um personagem de Anime, Mangá ou Manhwa (ex: Sasuke, Naruto, Jinwoo, Gojo), VOCÊ É OBRIGADO a gerar o personagem EXATAMENTE como ele é, COM AS ROUPAS, OLHOS (ex: Sharingan) E CABELO ORIGINAIS. O gerador de imagens pode bloquear nomes com direitos de autor, portanto, no 'imagePrompt', use o NOME REAL do personagem, mas também inclua uma descrição visual absurdamente detalhada de como ele é, para garantir que ele saia perfeito se o nome for ignorado.
      
      ${regraRaridade}`;

    try {
      const response = await fetch(textModelUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                nome: { type: "STRING" },
                descricao: { type: "STRING" },
                raridade: { type: "STRING" },
                css: { type: "STRING", description: "Propriedades visuais. IMPORTANTE: Para avatares, forneça aqui um background (ex: linear-gradient) para ser o fundo!" },
                keyframes: { type: "STRING" },
                imagePrompt: { type: "STRING", description: "Em INGLÊS. Se a categoria for nickname, defina APENAS como 'NONE'." }
              },
              required: ["nome", "descricao", "raridade", "css", "imagePrompt"]
            }
          }
        })
      });

      const textData = await response.json();
      const aiResult = JSON.parse(textData.candidates[0].content.parts[0].text);

      let base64Image = "";
      
      if (aiResult.imagePrompt && aiResult.imagePrompt !== "NONE") {
         setStatusMsg('A desenhar a arte com precisão...');
         try {
           const imgRes = await fetch(imageModelUrl, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ instances: { prompt: aiResult.imagePrompt }, parameters: { sampleCount: 1 } })
           });
           const imgData = await imgRes.json();
           if(imgData.predictions && imgData.predictions[0]) {
              base64Image = `data:image/png;base64,${imgData.predictions[0].bytesBase64Encoded}`;
           } else {
              throw new Error("A imagem foi bloqueada. Tente descrever de forma mais genérica.");
           }
         } catch (imgErr) {
           console.error("Erro ao gerar imagem:", imgErr);
           alert(imgErr.message || "Ocorreu um erro ao gerar a imagem.");
           setIsGenerating(false);
           setStatusMsg('');
           return; 
         }
      }

      const raridadeFinal = raridadeSelecionada !== 'aleatorio' ? raridadeSelecionada : aiResult.raridade;
      const finalPrice = TABELA_PRECOS[raridadeFinal] || 1000;
      const uniqueId = "item_" + Date.now() + Math.floor(Math.random()*1000);

      setGeneratedItem({
        id: uniqueId,
        nome: aiResult.nome,
        categoria: categoria,
        descricao: aiResult.descricao,
        raridade: raridadeFinal,
        preco: finalPrice,
        css: aiResult.css,
        keyframes: aiResult.keyframes || "",
        cssClass: uniqueId,
        previewBase64: base64Image,
        imagePrompt: aiResult.imagePrompt
      });

    } catch (error) {
      alert("Erro ao conectar com a IA: " + error.message);
    } finally {
      setIsGenerating(false);
      setStatusMsg('');
    }
  };

  const handleSaveToStore = async () => {
    if(!generatedItem) return;
    setIsSaving(true);
    setStatusMsg('Processando imagem...');

    try {
       let finalImageUrl = "";
       if (generatedItem.previewBase64) {
          const res = await fetch(generatedItem.previewBase64);
          let blob = await res.blob();
          
          if (generatedItem.categoria === 'avatar') {
             setStatusMsg('A remover o fundo do ecrã branco com Remove.bg...');
             try {
                blob = await removeBackgroundWithRemoveBg(blob);
             } catch(removeErr) {
                console.warn("Remove.bg failed:", removeErr);
                alert("Aviso: A API do Remove.bg falhou (" + removeErr.message + "). A imagem será salva com o fundo original.");
             }
          }

          const file = new File([blob], `${generatedItem.id}.png`, { type: "image/png" });
          
          setStatusMsg('A guardar na Loja...');
          let cloudUrl = await uploadToCloudinary(file);
          
          let filtroOculto = 'none';
          if (generatedItem.categoria === 'moldura') {
            filtroOculto = 'e_make_transparent:30:black';
          }
          finalImageUrl = applyCloudinaryTransform(cloudUrl, filtroOculto);
       }

       await setDoc(doc(db, "loja_itens", generatedItem.id), {
          nome: generatedItem.nome,
          categoria: generatedItem.categoria,
          descricao: generatedItem.descricao,
          raridade: generatedItem.raridade,
          preco: Number(generatedItem.preco), 
          cssClass: generatedItem.cssClass,
          css: generatedItem.css,
          animacao: generatedItem.keyframes, 
          preview: finalImageUrl, 
          createdAt: Date.now()
       });

       alert("Cosmético guardado na Loja com sucesso!");
       setGeneratedItem(null);
       setPrompt('');
    } catch(err) {
       alert("Erro ao guardar na loja: " + err.message);
    } finally {
       setIsSaving(false);
       setStatusMsg('');
    }
  };

  const isItemBlendable = generatedItem && generatedItem.categoria === 'moldura';
  const isCircularPreview = generatedItem && ['moldura', 'avatar'].includes(generatedItem.categoria);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gray-900 border border-gray-800 p-6 md:p-10 rounded-[2rem] shadow-xl space-y-8 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10">
          <h3 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 mb-2"><Wand2 className="w-8 h-8 text-purple-500" /> IA Geradora de Cosméticos</h3>
          <p className="text-gray-400 text-sm md:text-base">Descreva o item ou deixe em branco para a inteligência artificial inventar algo surpreendente.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          <div className="lg:col-span-1 space-y-6 bg-gray-950 p-6 rounded-3xl border border-gray-800">
             <div>
               <label className="block text-sm font-bold text-gray-400 mb-3">Categoria do Item</label>
               <div className="flex flex-wrap gap-2">
                 {CATEGORIAS_IA.map(cat => (
                   <button key={cat} onClick={()=>setCategoria(cat)} className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${categoria === cat ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30' : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white hover:border-gray-600 capitalize'}`}>
                     {cat.replace('_', ' ')}
                   </button>
                 ))}
               </div>
             </div>
             
             <div>
               <label className="block text-sm font-bold text-gray-400 mb-2">Raridade Desejada</label>
               <select value={raridadeSelecionada} onChange={e=>setRaridadeSelecionada(e.target.value)} className="w-full bg-gray-900 p-3.5 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 cursor-pointer capitalize font-bold">
                 {RARIDADES_IA.map(r => (
                   <option key={r} value={r}>{r === 'aleatorio' ? 'Deixar IA Escolher (Aleatório)' : r}</option>
                 ))}
               </select>
             </div>

             <div>
               <label className="block text-sm font-bold text-gray-400 mb-2">Prompt (Opcional)</label>
               <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Descreva um personagem de anime (ex: Sasuke Uchiha) ou um efeito incrível..." rows="4" className="w-full bg-gray-900 p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-purple-500 resize-none transition-colors" />
             </div>

             <button onClick={handleGenerate} disabled={isGenerating || isSaving} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50">
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin"/> : <Sparkles className="w-6 h-6" />}
                {isGenerating ? statusMsg : 'Gerar Magia com IA'}
             </button>
          </div>

          <div className="lg:col-span-2 flex flex-col">
            <h4 className="text-gray-400 font-bold text-sm mb-4 uppercase tracking-widest flex items-center gap-2"><Palette className="w-4 h-4"/> Preview Visual</h4>
            
            <div className="flex-1 bg-gray-950 border border-gray-800 rounded-3xl p-5 md:p-10 flex flex-col items-center justify-center min-h-[400px] relative">
               {isGenerating && (
                 <div className="flex flex-col items-center text-center animate-pulse p-4">
                   <div className="w-16 h-16 md:w-20 md:h-20 mb-6 bg-purple-900/30 rounded-full flex items-center justify-center border border-purple-500/50 relative overflow-hidden">
                     <Wand2 className="w-8 h-8 md:w-10 md:h-10 text-purple-400 absolute animate-spin" style={{ animationDuration: '3s' }}/>
                   </div>
                   <h2 className="text-xl md:text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Trabalhando...</h2>
                   <p className="text-gray-500 mt-2 font-bold text-sm">{statusMsg}</p>
                 </div>
               )}

               {!isGenerating && !generatedItem && (
                 <div className="text-center opacity-30 p-4">
                    <Wand2 className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-gray-500" />
                    <p className="text-base md:text-lg font-bold text-gray-400">Aguardando instruções...</p>
                 </div>
               )}

               {!isGenerating && generatedItem && (
                 <div className="w-full h-full flex flex-col animate-in zoom-in-95 duration-500">
                    <style dangerouslySetInnerHTML={{__html: `.${generatedItem.cssClass} { ${generatedItem.css} } ${generatedItem.keyframes}`}} />

                    {/* CAIXA DE PREVIEW REDONDA SEMPRE PARA AVATAR E MOLDURA */}
                    <div className="flex-1 flex items-center justify-center w-full relative mb-6 md:mb-8 mt-4 md:mt-0">
                      {/* Adicionamos a classe CSS no próprio wrapper para o Fundo Animado aparecer por trás do Avatar recortado! */}
                      <div className={`relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden group ${isCircularPreview ? 'rounded-full' : 'rounded-3xl'} ${generatedItem.categoria === 'avatar' ? generatedItem.cssClass : ''}`}>
                         
                         {generatedItem.categoria === 'capa_fundo' && generatedItem.previewBase64 && (
                           <img src={generatedItem.previewBase64} className={`absolute inset-0 m-auto w-full h-full object-cover opacity-50 ${generatedItem.cssClass}`} />
                         )}

                         {isItemBlendable && (
                           <div className="absolute inset-0 m-auto w-32 h-32 md:w-44 md:h-44 bg-gray-800 rounded-full border-4 border-gray-900 z-10 flex items-center justify-center overflow-hidden shadow-inner">
                              <ImageIcon className="w-8 h-8 md:w-10 md:h-10 text-gray-600"/>
                           </div>
                         )}

                         {/* Aplica Mix-Blend Screen na Preview e usa h-full w-full cover para as molduras/avatares preencherem tudo */}
                         {generatedItem.previewBase64 && generatedItem.categoria !== 'capa_fundo' && (
                            <img 
                              src={generatedItem.previewBase64} 
                              className={`absolute inset-0 m-auto w-full h-full object-cover z-20 pointer-events-none ${generatedItem.categoria !== 'avatar' ? generatedItem.cssClass : ''}`} 
                              style={isItemBlendable ? { mixBlendMode: 'screen' } : {}}
                            />
                         )}

                         {generatedItem.categoria === 'nickname' && (
                           <div className={`absolute inset-0 m-auto flex items-center justify-center font-black text-2xl md:text-3xl z-20 ${generatedItem.cssClass}`}>AdminManga</div>
                         )}
                      </div>
                    </div>

                    <div className="w-full bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-800 flex flex-col">
                       <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                         <div className="w-full sm:flex-1">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                              <h2 className="text-xl sm:text-2xl font-black text-white">{generatedItem.nome}</h2>
                              <span className={`text-[10px] sm:text-xs font-black px-2 py-1 rounded uppercase ${generatedItem.raridade === 'lendario' ? 'bg-yellow-500/20 text-yellow-500' : generatedItem.raridade === 'mitico' ? 'bg-red-500/20 text-red-500' : generatedItem.raridade === 'epico' ? 'bg-purple-500/20 text-purple-500' : generatedItem.raridade === 'raro' ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-800 text-gray-300'}`}>
                                {generatedItem.raridade}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-2 line-clamp-3 sm:line-clamp-none">{generatedItem.descricao}</p>
                         </div>
                         
                         <div className="w-full sm:w-auto text-left sm:text-right mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-800 sm:border-0 shrink-0">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Preço Final (Moedas)</span>
                            <div className="flex items-center justify-start sm:justify-end gap-2">
                               <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500"/>
                               <input type="number" min="0" value={generatedItem.preco} onChange={(e) => setGeneratedItem({...generatedItem, preco: e.target.value})} className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-white font-black text-xl w-28 outline-none focus:border-purple-500 transition-colors text-right" />
                            </div>
                         </div>
                       </div>
                       
                       <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-800 flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <button onClick={() => setGeneratedItem(null)} disabled={isSaving} className="w-full sm:w-1/3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-colors">Descartar</button>
                          <button onClick={handleSaveToStore} disabled={isSaving} className="w-full sm:w-2/3 bg-green-600 hover:bg-green-500 text-white font-black py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/30">
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <ShoppingBag className="w-5 h-5"/>}
                            {isSaving ? statusMsg : 'Salvar Oficialmente na Loja'}
                          </button>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() { return <ErrorBoundary><AdminPanel /></ErrorBoundary>; }
