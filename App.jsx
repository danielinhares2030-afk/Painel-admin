import React, { useState, useEffect } from 'react';
import { 
  BookOpen, LayoutDashboard, PlusCircle, List, 
  UploadCloud, Trash2, LogOut, Loader2, Image as ImageIcon,
  Archive, AlertCircle, CheckCircle, Menu, X, Play, Edit3,
  ShoppingBag, Tag, Coins, Wand2, Sparkles, Palette, Layers
} from 'lucide-react';

// IMPORTAÇÕES DOS FICHEIROS DA RAIZ
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
        <h1 className="text-2xl font-bold text-white mb-2">Erro no Painel</h1>
        <pre className="bg-gray-900 p-6 rounded-2xl w-full max-w-2xl overflow-auto text-sm">{this.state.error.toString()}</pre>
        <button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Recarregar Painel</button>
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
      else if (currentUser) { signOut(auth); setUser(null); } 
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
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3 text-purple-500 font-black text-xl tracking-tight"><BookOpen className="w-8 h-8" /> ADMIN</div>
          <button className="md:hidden text-gray-400" onClick={() => setIsSidebarOpen(false)}><X /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <MenuButton icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
          <div className="pt-6 pb-2 text-xs font-black text-gray-600 uppercase tracking-widest pl-2">Conteúdo</div>
          <MenuButton icon={PlusCircle} label="Cadastrar Obras" active={currentView === 'nova_obra'} onClick={() => handleNavigate('nova_obra')} />
          <MenuButton icon={List} label="Gerenciar Obras" active={currentView === 'listar_obras'} onClick={() => handleNavigate('listar_obras')} />
          <MenuButton icon={UploadCloud} label="Upload Capítulos" active={currentView === 'upload_capitulo'} onClick={() => handleNavigate('upload_capitulo')} />
          <div className="pt-6 pb-2 text-xs font-black text-gray-600 uppercase tracking-widest pl-2">Loja</div>
          <MenuButton icon={Wand2} label="IA Geradora" active={currentView === 'loja_ia'} onClick={() => handleNavigate('loja_ia')} />
          <MenuButton icon={ShoppingBag} label="Gerenciar Itens" active={currentView === 'loja'} onClick={() => handleNavigate('loja')} />
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-colors"><LogOut className="w-5 h-5" /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative h-screen w-full">
        <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 p-4 md:p-6 sticky top-0 z-10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-400 bg-gray-800 p-2 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
            <h2 className="text-xl font-black text-white capitalize">{currentView.replace('_', ' ')}</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-black text-white">A</div>
          </div>
        </header>
        
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
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
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-all ${active ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
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
      setError("Credenciais inválidas ou acesso negado.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-purple-600/20 rounded-full blur-[120px]"></div>
      <div className="bg-gray-900 border border-gray-800 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 text-center">
        <div className="w-20 h-20 bg-gray-950 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-800"><BookOpen className="w-10 h-10 text-purple-500" /></div>
        <h1 className="text-3xl font-black text-white mb-2">Admin Hub</h1>
        <p className="text-gray-500 text-sm mb-8 font-medium">Controle Total Manga Infinity</p>
        {error && <div className="text-red-400 font-bold text-sm bg-red-500/10 p-4 rounded-xl mb-6">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="E-mail Administrativo" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-5 py-4 text-white outline-none focus:border-purple-500 font-medium" />
          <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} required placeholder="Senha" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-5 py-4 text-white outline-none focus:border-purple-500 font-medium" />
          <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl mt-4 flex justify-center items-center gap-2 transition-all shadow-lg disabled:opacity-50">
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
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="bg-gray-900 border border-gray-800 p-10 rounded-[2rem] flex items-center justify-between shadow-xl">
        <div><p className="text-gray-400 font-black uppercase text-xs mb-2 tracking-widest">Obras Registadas</p><h3 className="text-6xl font-black text-white">{loading ? '...' : stats.obras}</h3></div>
        <BookOpen className="w-20 h-20 text-purple-500/10" />
      </div>
      <div className="bg-gray-900 border border-gray-800 p-10 rounded-[2rem] flex items-center justify-between shadow-xl">
        <div><p className="text-gray-400 font-black uppercase text-xs mb-2 tracking-widest">Capítulos Ativos</p><h3 className="text-6xl font-black text-white">{loading ? '...' : stats.capitulos}</h3></div>
        <List className="w-20 h-20 text-indigo-500/10" />
      </div>
    </div>
  );
}

function CadastrarObraView() {
  const defaultForm = { title: '', author: '', synopsis: '', status: 'Em Lançamento', type: 'Mangá' };
  const [formData, setFormData] = useState(defaultForm);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [obrasQueue, setObrasQueue] = useState([]);

  const toggleGenre = (g) => setSelectedGenres(p => p.includes(g) ? p.filter(x=>x!==g) : [...p, g]);

  const handleAddToQueue = (e) => {
    e.preventDefault();
    if (!coverFile || selectedGenres.length === 0 || !formData.title) return alert('Por favor, preencha todos os campos e selecione a capa!');
    setObrasQueue([...obrasQueue, { id: Math.random().toString(), ...formData, genres: selectedGenres, coverFile, coverPreview: URL.createObjectURL(coverFile), statusText: 'pending' }]);
    setFormData(defaultForm); setSelectedGenres([]); setCoverFile(null);
  };

  const handleSubmitQueue = async () => {
    setLoading(true);
    for (let item of obrasQueue) {
      if (item.statusText === 'done') continue;
      try {
        const coverUrl = await uploadToCloudinary(item.coverFile);
        const obraId = Date.now().toString() + Math.floor(Math.random()*1000);
        await setDoc(doc(db, "obras", obraId), { 
          title: item.title, author: item.author, synopsis: item.synopsis, type: item.type, status: item.status, 
          genres: item.genres, coverUrl, createdAt: Date.now() 
        });
        setObrasQueue(prev => prev.map(q => q.id === item.id ? { ...q, statusText: 'done' } : q));
      } catch (err) { alert("Falha ao enviar a obra: " + item.title); }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleAddToQueue} className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] shadow-xl space-y-6">
        <h3 className="text-2xl font-black text-white flex items-center gap-2"><PlusCircle className="text-purple-500" /> Nova Obra</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" placeholder="Título" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="bg-gray-950 border border-gray-800 p-4 rounded-xl text-white outline-none" required />
          <input type="text" placeholder="Autor" value={formData.author} onChange={e=>setFormData({...formData, author: e.target.value})} className="bg-gray-950 border border-gray-800 p-4 rounded-xl text-white outline-none" required />
          <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="bg-gray-950 border border-gray-800 p-4 rounded-xl text-white">{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select>
          <input type="file" accept="image/*" onChange={e=>setCoverFile(e.target.files[0])} className="text-gray-400 file:bg-gray-800 file:text-white file:border-none file:px-4 file:py-2 file:rounded-lg file:cursor-pointer" />
        </div>
        <textarea placeholder="Sinopse da obra..." value={formData.synopsis} onChange={e=>setFormData({...formData, synopsis: e.target.value})} className="w-full bg-gray-950 border border-gray-800 p-4 rounded-xl text-white h-32 outline-none" required />
        <div className="flex flex-wrap gap-2">{GENEROS.map(g => (
          <button type="button" key={g} onClick={()=>toggleGenre(g)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedGenres.includes(g) ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>{g}</button>
        ))}</div>
        <button type="submit" className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-xl font-black text-white shadow-lg transition-all w-full">Adicionar à Fila de Upload</button>
      </form>
      
      {obrasQueue.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-[2rem] border border-gray-800 shadow-xl">
           <button onClick={handleSubmitQueue} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-black text-white mb-4 shadow-lg flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <><UploadCloud /> Gravar {obrasQueue.length} Obras no Sistema</>}
           </button>
           <div className="space-y-2">
              {obrasQueue.map(item => (
                 <div key={item.id} className="text-white text-sm py-3 px-4 bg-gray-950 rounded-xl border border-gray-800 flex justify-between items-center">
                    <span className="font-bold">{item.title}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${item.statusText === 'done' ? 'bg-green-600' : 'bg-yellow-600/20 text-yellow-500'}`}>{item.statusText === 'done' ? 'Sucesso' : 'Pendente'}</span>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}

function GerenciarObrasView() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "obras"));
      const list = []; snap.forEach(d => list.push({id: d.id, ...d.data()}));
      setObras(list.sort((a,b)=>b.createdAt - a.createdAt));
      setLoading(false);
    };
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if(window.confirm("Apagar permanentemente esta obra?")) {
      await deleteDoc(doc(db, "obras", id));
      setObras(obras.filter(o => o.id !== id));
    }
  };

  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin text-purple-500 mx-auto w-10 h-10" /></div>;

  return (
    <div className="space-y-4">
      {obras.length === 0 ? <p className="text-center text-gray-500 font-bold">Nenhuma obra registada.</p> : obras.map(o => (
        <div key={o.id} className="bg-gray-900 p-4 rounded-2xl flex items-center justify-between border border-gray-800 hover:border-gray-700 transition-all">
          <div className="flex items-center gap-4">
            <img src={o.coverUrl} className="w-14 h-20 object-cover rounded-xl shadow-md" alt="capa" />
            <div><h4 className="font-black text-white text-lg">{o.title}</h4><p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{o.type}</p></div>
          </div>
          <button onClick={()=>handleDelete(o.id)} className="text-red-500 p-3 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-5 h-5"/></button>
        </div>
      ))}
    </div>
  );
}

function UploadCapituloView() {
  const [obras, setObras] = useState([]);
  const [selectedObraId, setSelectedObraId] = useState('');
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState('');

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

  const handleUpload = async () => {
    if(!selectedObraId || files.length === 0) return alert("Selecione a obra e os arquivos!");
    setIsProcessing(true);
    setMsg('Processando ficheiros...');
    for(let file of files) {
       try {
          const zip = new window.JSZip(); const loadedZip = await zip.loadAsync(file);
          const images = []; loadedZip.forEach((path, entry) => { if(!entry.dir && path.match(/\.(jpg|jpeg|png|webp)$/i)) images.push(entry); });
          images.sort((a,b)=>a.name.localeCompare(b.name, undefined, {numeric: true}));
          const urls = [];
          for(let i=0; i<images.length; i++) {
             setMsg(`Enviando página ${i+1}/${images.length}...`);
             const blob = await images[i].async("blob");
             const url = await uploadToCloudinary(new File([blob], images[i].name));
             urls.push(url);
          }
          const capNum = file.name.match(/\d+(\.\d+)?/)?.[0] || "0";
          await setDoc(doc(db, `obras/${selectedObraId}/capitulos`, capNum.toString()), { 
             number: Number(capNum), pages: urls, createdAt: Date.now() 
          });
       } catch(e) { alert("Erro ao processar ficheiro: " + file.name); }
    }
    setIsProcessing(false); setMsg(''); alert("Uploads concluídos com sucesso!"); setFiles([]);
  };

  return (
    <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 space-y-6 shadow-xl">
       <h3 className="text-2xl font-black text-white flex items-center gap-3"><Archive className="text-purple-500" /> Upload em Massa (.zip / .cbz)</h3>
       <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest">Obra Destino</label>
          <select value={selectedObraId} onChange={e=>setSelectedObraId(e.target.value)} className="w-full bg-gray-950 border border-gray-800 p-4 rounded-xl text-white outline-none">
             {obras.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
       </div>
       <input type="file" multiple accept=".zip,.cbz" onChange={e=>setFiles(Array.from(e.target.files))} className="text-gray-400 file:bg-gray-800 file:text-white file:border-none file:px-4 file:py-2 file:rounded-lg file:cursor-pointer" />
       {msg && <p className="text-purple-400 font-bold animate-pulse">{msg}</p>}
       <button onClick={handleUpload} disabled={isProcessing} className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-black text-white shadow-lg transition-all flex justify-center items-center gap-2">
          {isProcessing ? <Loader2 className="animate-spin" /> : "Iniciar Uploads de Capítulos"}
       </button>
    </div>
  );
}

function LojaView() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "loja_itens")).then(snap => {
      const list = []; snap.forEach(d => list.push({id: d.id, ...d.data()}));
      setItens(list.sort((a,b)=>b.createdAt - a.createdAt));
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id) => {
    if(window.confirm("Deseja apagar este item da loja?")) {
      await deleteDoc(doc(db, "loja_itens", id));
      setItens(itens.filter(i => i.id !== id));
    }
  };

  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin text-purple-500 mx-auto w-10 h-10" /></div>;

  return (
    <div className="space-y-6">
       <h3 className="text-2xl font-black text-white flex items-center gap-2"><ShoppingBag className="text-purple-500" /> Catálogo da Loja</h3>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {itens.length === 0 ? <p className="text-gray-500 font-bold col-span-full text-center">A loja está vazia.</p> : itens.map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 p-4 rounded-3xl relative hover:border-gray-700 transition-all shadow-lg group">
               <button onClick={()=>handleDelete(item.id)} className="absolute top-2 right-2 text-red-500 bg-red-500/10 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all z-10"><Trash2 className="w-4 h-4"/></button>
               <div className="aspect-square bg-gray-950 rounded-2xl mb-4 overflow-hidden flex items-center justify-center border border-gray-800">
                  <img src={item.preview} className="w-full h-full object-cover" alt="cosmetico" />
               </div>
               <h4 className="font-black text-white truncate text-lg">{item.nome}</h4>
               <p className="text-[10px] font-black uppercase text-gray-500 mb-3 tracking-widest">{item.categoria} | {item.raridade}</p>
               <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                  <p className="text-yellow-500 font-black text-xl flex items-center gap-1"><Coins className="w-5 h-5"/>{item.preco}</p>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}

function LojaIAView() {
  const [prompt, setPrompt] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_IA[0]);
  const [raridadeSelecionada, setRaridadeSelecionada] = useState(RARIDADES_IA[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItem, setGeneratedItem] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true); setGeneratedItem(null); setStatusMsg('Conectando às IAs...');
    
    // PEGANDO AS CHAVES DA VERCEL
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const leonardoKey = import.meta.env.VITE_LEONARDO_API_KEY;

    if (!leonardoKey || !geminiKey) { 
       alert("Erro Crítico: Chaves API não encontradas na Vercel! Verifique VITE_GEMINI_API_KEY e VITE_LEONARDO_API_KEY."); 
       setIsGenerating(false); return; 
    }

    try {
      setStatusMsg('Gemini está desenhando o conceito...');
      // USANDO ROTA v1beta E CAMPO system_instruction EM MINÚSCULAS
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      const systemPrompt = `Você é Diretor de Arte do Manga Infinity. Crie o JSON para um item cosmético da categoria '${categoria}'. O tema pedido é '${prompt || 'Surrealista Premium'}'. 
      RESPONDA APENAS JSON NO FORMATO: {"nome": "string", "descricao": "string", "raridade": "string", "css": "string", "keyframes": "string", "imagePrompt": "string"}.
      No campo 'css' use estilos visuais como box-shadow e gradients. Se for avatar, gere obrigatoriamente um 'background' CSS incrível.
      No campo 'raridade' use: comum, raro, epico, lendario ou mitico.`;

      const geminiRes = await fetch(geminiUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Gere o item cosmético agora." }] }],
          system_instruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const geminiData = await geminiRes.json();
      if (geminiData.error) throw new Error("Erro na API Gemini: " + geminiData.error.message);
      
      const aiResult = JSON.parse(geminiData.candidates[0].content.parts[0].text);

      let finalImg = "";
      if (aiResult.imagePrompt && aiResult.imagePrompt.toUpperCase() !== "NONE") {
         setStatusMsg('Leonardo.ai pintando a arte...');
         const leoRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
            method: 'POST', headers: { 'accept': 'application/json', 'content-type': 'application/json', 'authorization': `Bearer ${leonardoKey}` },
            body: JSON.stringify({
              prompt: `high quality anime style, 2d masterpiece, vibrant colors, clean lineart, ${aiResult.imagePrompt}`,
              modelId: "b24e0cca-995d-43b9-ad31-80a56658097f", width: 512, height: 512, num_images: 1
            })
         });
         
         const leoData = await leoRes.json();
         if(leoData.error) throw new Error("Erro no Leonardo.ai: " + leoData.error);
         
         const genId = leoData.sdGenerationJob.generationId;

         // POLLING (ESPERA)
         let ready = false; let attempts = 0;
         while(!ready && attempts < 15) {
            await new Promise(r => setTimeout(r, 3500));
            const check = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`, { headers: { 'authorization': `Bearer ${leonardoKey}` } });
            const checkData = await check.json();
            if(checkData.generations_by_pk.status === 'COMPLETE') {
               finalImg = checkData.generations_by_pk.generated_images[0].url;
               ready = true;
            }
            attempts++; setStatusMsg(`Finalizando arte... (${attempts * 7}%)`);
         }
      }

      const raridadeFinal = raridadeSelecionada !== 'aleatorio' ? raridadeSelecionada : aiResult.raridade;

      setGeneratedItem({
        id: "item_" + Date.now(), 
        nome: aiResult.nome, 
        categoria: categoria, 
        descricao: aiResult.descricao,
        raridade: raridadeFinal, 
        preco: TABELA_PRECOS[raridadeFinal] || 1000,
        css: aiResult.css, 
        keyframes: aiResult.keyframes || "", 
        cssClass: "item_ia_" + Date.now(),
        preview: finalImg
      });
      
    } catch (e) { alert("Erro na geração: " + e.message); } finally { setIsGenerating(false); setStatusMsg(''); }
  };

  const handleSave = async () => {
    if(!generatedItem) return;
    setStatusMsg('Salvando na Nuvem...');
    try {
      let finalUrl = generatedItem.preview;
      if (generatedItem.preview) {
         const res = await fetch(generatedItem.preview);
         let blob = await res.blob();
         if (categoria === 'avatar') blob = await removeBackgroundWithRemoveBg(blob);
         const file = new File([blob], `${generatedItem.id}.png`, { type: "image/png" });
         finalUrl = await uploadToCloudinary(file);
         if (categoria === 'moldura') finalUrl = applyCloudinaryTransform(finalUrl, 'e_make_transparent:30:black');
      }
      
      await setDoc(doc(db, "loja_itens", generatedItem.id), { 
         ...generatedItem, 
         preview: finalUrl, 
         preco: Number(generatedItem.preco),
         createdAt: Date.now() 
      });
      
      alert("Item Premium salvo com sucesso!"); 
      setGeneratedItem(null); setPrompt('');
    } catch(e) { alert("Erro ao salvar: " + e.message); } finally { setStatusMsg(''); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-8 md:p-12 rounded-[3rem] shadow-2xl space-y-10 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]"></div>
       <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h3 className="text-3xl font-black text-white flex items-center gap-3"><Wand2 className="text-purple-500 w-8 h-8" /> IA Premium (Leonardo + Gemini)</h3>
             <p className="text-gray-500 font-medium">A elite da inteligência artificial ao serviço do seu site.</p>
          </div>
          <div className="flex flex-wrap gap-2">
             {CATEGORIAS_IA.map(c=>(
                <button key={c} onClick={()=>setCategoria(c)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${categoria === c ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>{c.replace('_',' ')}</button>
             ))}
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest pl-1">Tema / Prompt</label>
                <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ex: Guerreiro Samurai cibernético com aura elétrica roxa..." className="w-full bg-gray-950 p-5 rounded-2xl text-white outline-none border border-gray-800 focus:border-purple-500 h-40 transition-all resize-none shadow-inner" />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest pl-1">Raridade</label>
                <select value={raridadeSelecionada} onChange={e=>setRaridadeSelecionada(e.target.value)} className="w-full bg-gray-950 p-4 rounded-2xl text-white border border-gray-800 font-bold outline-none cursor-pointer">
                   {RARIDADES_IA.map(r=><option key={r} value={r}>{r === 'aleatorio' ? 'IA Decide' : r.toUpperCase()}</option>)}
                </select>
             </div>
             <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-5 rounded-2xl font-black text-white shadow-xl flex justify-center items-center gap-3 disabled:opacity-50 transition-all active:scale-95">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {isGenerating ? statusMsg : "DAR VIDA AO ITEM"}
             </button>
          </div>

          <div className="flex flex-col items-center justify-center bg-gray-950 rounded-[2.5rem] border border-gray-800 p-8 min-h-[400px] relative shadow-inner">
             {!generatedItem && !isGenerating && (
                <div className="text-center opacity-30">
                   <ImageIcon className="w-20 h-20 mx-auto mb-4 text-gray-700" />
                   <p className="font-black text-gray-700 text-lg uppercase tracking-widest">Preview Visual</p>
                </div>
             )}

             {isGenerating && (
                <div className="text-center">
                   <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30 animate-pulse">
                      <Wand2 className="text-purple-400 w-10 h-10 animate-bounce" />
                   </div>
                   <p className="text-purple-400 font-black tracking-widest animate-pulse">{statusMsg.toUpperCase()}</p>
                </div>
             )}

             {generatedItem && (
                <div className="w-full animate-in zoom-in-95 duration-500">
                   <style dangerouslySetInnerHTML={{__html: `.${generatedItem.cssClass} { ${generatedItem.css} } ${generatedItem.keyframes}`}} />
                   <div className="flex flex-col items-center text-center">
                      <div className={`w-48 h-48 md:w-56 md:h-56 bg-gray-900 shadow-2xl flex items-center justify-center overflow-hidden border-2 border-gray-800 mb-6 relative group ${categoria === 'avatar' || categoria === 'moldura' ? 'rounded-full' : 'rounded-3xl'} ${generatedItem.cssClass}`}>
                         {generatedItem.preview && <img src={generatedItem.preview} crossOrigin="anonymous" className="w-full h-full object-cover" alt="cosmetico" />}
                         {categoria === 'nickname' && <div className="text-2xl font-black z-20">Admin_Nix</div>}
                      </div>
                      <h2 className="text-2xl font-black text-white mb-2">{generatedItem.nome}</h2>
                      <div className="flex gap-2 justify-center mb-4">
                         <span className="bg-gray-800 text-gray-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{categoria}</span>
                         <span className="bg-purple-600/20 text-purple-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{generatedItem.raridade}</span>
                      </div>
                      <p className="text-gray-500 text-sm mb-8 font-medium italic">"{generatedItem.descricao}"</p>
                      <div className="flex gap-3 w-full">
                         <button onClick={()=>setGeneratedItem(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-4 rounded-2xl text-white font-bold transition-all">DESCARTAR</button>
                         <button onClick={handleSave} className="flex-[2] bg-green-600 hover:bg-green-500 py-4 rounded-2xl text-white font-black shadow-lg transition-all flex justify-center items-center gap-2">
                            {statusMsg ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                            {statusMsg || "CONFIRMAR NA LOJA"}
                         </button>
                      </div>
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

export default function App() { return <ErrorBoundary><AdminPanel /></ErrorBoundary>; }
