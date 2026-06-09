import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, Eye, Plus, Edit, Trash2, Loader2, Camera, X, FileUp, FileText, Download, Upload, CheckSquare } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Input } from '@/components/ui/input';
import { FastInput } from '@/components/ui/fast-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Funcionario {
  id: string; nome: string; email: string; departamento: string; cargo: string;
  data_admissao: string; escolaridade: string; graduacao: string;
  pos_graduacao: boolean; pos_graduacao_tipo: string;
  feedbacks_recebidos: number; feedbacks_resolvidos: number;
  foto_url: string; turno: string; letra: string; encarregado_id: string | null;
}

const departamentos = ['Contrato Porto', 'Contrato Usina', 'Frotas', 'Medição', 'Segurança', 'CCO', 'CCM', 'Manutenção', 'RH', 'Financeiro'];
const escolaridades = ['Ensino Fundamental', 'Ensino Médio', 'Ensino Superior Cursando', 'Ensino Superior Completo', 'Pós-Graduação', 'Mestrado', 'Doutorado'];
const TURNOS = [
  { value: 'dia_a', label: 'Dia A' }, { value: 'dia_b', label: 'Dia B' },
  { value: 'noite_a', label: 'Noite A' }, { value: 'noite_b', label: 'Noite B' },
  { value: 'adm', label: 'ADM' },
];
const CARGOS_COM_DOCUMENTOS = ['motorista', 'operador de equipamentos', 'operador de mini'];
function cargoNeedsDocs(cargo: string) { return CARGOS_COM_DOCUMENTOS.some(c => cargo.toLowerCase().includes(c)); }
function letraFromTurno(turno: string): string {
  if (turno.endsWith('_a')) return 'A';
  if (turno.endsWith('_b')) return 'B';
  return '';
}

export default function Colaboradores() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('todos');
  const [turnoFilter, setTurnoFilter] = useState('todos');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const emptyForm = { nome: '', email: '', cargo: '', departamento: '', data_admissao: '', escolaridade: '', graduacao: '', pos_graduacao: false, pos_graduacao_tipo: '', turno: '', letra: '', encarregado_id: 'none' };
  const [newData, setNewData] = useState(emptyForm);
  const [editData, setEditData] = useState({ id: '', foto_url: '', ...emptyForm });
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState('');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState('');
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [editDocFiles, setEditDocFiles] = useState<File[]>([]);
  const newFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);
  const editDocFileRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const encarregados = funcionarios.filter(f => f.cargo.toLowerCase().includes('encarregado'));

  useEffect(() => { fetchFuncionarios(); }, []);

  async function fetchFuncionarios(silent = false) {
    if (!silent) setLoading(true);
    const { data, error } = await supabase.from('funcionarios').select('*').order('nome');
    if (!error && data) setFuncionarios(data as Funcionario[]);
    if (!silent) setLoading(false);
  }

  const filtered = funcionarios.filter((f) => {
    const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) || f.cargo.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'todos' || f.departamento === deptFilter;
    const matchTurno = turnoFilter === 'todos' || f.turno === turnoFilter;
    return matchSearch && matchDept && matchTurno;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every(f => selectedIds.has(f.id));

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(f => next.delete(f.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(f => next.add(f.id));
        return next;
      });
    }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    let deleted = 0;
    for (const id of ids) {
      const { error } = await supabase.from('funcionarios').delete().eq('id', id);
      if (!error) deleted++;
    }
    setBulkDeleting(false);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
    if (deleted > 0) {
      toast.success(`${deleted} funcionário(s) excluído(s) com sucesso!`);
      fetchFuncionarios(true);
    } else {
      toast.error('Erro ao excluir funcionários');
    }
  }

  async function uploadPhoto(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
  }

  async function uploadDocument(file: File) {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('documentos').upload(fileName, file);
    if (error) throw error;
    return { url: supabase.storage.from('documentos').getPublicUrl(fileName).data.publicUrl, name: file.name };
  }


  function parseTurno(raw: string): string {
    const lower = raw.toLowerCase().trim();
    if (lower === 'adm' || lower === 'administrativo') return 'adm';
    if (lower.includes('dia') && lower.includes('a')) return 'dia_a';
    if (lower.includes('dia') && lower.includes('b')) return 'dia_b';
    if (lower.includes('noite') && lower.includes('a')) return 'noite_a';
    if (lower.includes('noite') && lower.includes('b')) return 'noite_b';
    return '';
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
      const records = rows.map(row => ({
        nome: String(row['Nome'] || '').trim(), email: String(row['Email'] || '').trim(),
        cargo: String(row['Cargo'] || '').trim(), departamento: String(row['Departamento'] || '').trim(),
        data_admissao: String(row['Data Admissão'] || row['Data Admissao'] || '').trim() || undefined,
        escolaridade: String(row['Escolaridade'] || '').trim(), graduacao: String(row['Graduação'] || row['Graduacao'] || '').trim(),
        pos_graduacao: String(row['Pós-Graduação'] || '').toLowerCase() === 'sim',
        pos_graduacao_tipo: String(row['Tipo Pós-Graduação'] || '').trim(),
        turno: parseTurno(String(row['Turno'] || '')),
        letra: String(row['Letra'] || '').trim(),
      })).filter(r => r.nome && r.cargo && r.departamento);
      if (records.length === 0) { toast.error('Nenhum registro válido encontrado.'); setImporting(false); return; }
      const toInsert = records.map(r => {
        const obj: any = { nome: r.nome, email: r.email, cargo: r.cargo, departamento: r.departamento, escolaridade: r.escolaridade, graduacao: r.graduacao, pos_graduacao: r.pos_graduacao, pos_graduacao_tipo: r.pos_graduacao_tipo, turno: r.turno, letra: r.letra };
        if (r.data_admissao) obj.data_admissao = r.data_admissao;
        return obj;
      });
      const { error } = await supabase.from('funcionarios').insert(toInsert);
      if (error) toast.error('Erro ao importar: ' + error.message);
      else { toast.success(`${records.length} funcionário(s) importado(s)!`); fetchFuncionarios(true); }
    } catch { toast.error('Erro ao ler arquivo.'); }
    setImporting(false);
    if (importFileRef.current) importFileRef.current.value = '';
  }

  async function handleCreate() {
    if (!newData.nome || !newData.cargo || !newData.departamento) { toast.error('Preencha campos obrigatórios'); return; }
    setUploading(true);
    let foto_url = '';
    try { if (newPhotoFile) foto_url = await uploadPhoto(newPhotoFile); } catch { toast.error('Erro ao enviar foto'); setUploading(false); return; }
    const insertData: any = { nome: newData.nome, email: newData.email, cargo: newData.cargo, departamento: newData.departamento, escolaridade: newData.escolaridade, graduacao: newData.graduacao, pos_graduacao: newData.pos_graduacao, pos_graduacao_tipo: newData.pos_graduacao_tipo, turno: newData.turno, letra: newData.letra, foto_url };
    if (newData.data_admissao) insertData.data_admissao = newData.data_admissao;
    if (newData.encarregado_id && newData.encarregado_id !== 'none') insertData.encarregado_id = newData.encarregado_id;
    const { data: inserted, error } = await supabase.from('funcionarios').insert(insertData).select().single();
    if (error) { toast.error('Erro ao cadastrar'); setUploading(false); return; }
    if (docFiles.length > 0 && inserted) {
      for (const file of docFiles) {
        try { const { url, name } = await uploadDocument(file); await supabase.from('employee_documents').insert({ employee_id: inserted.id, file_url: url, file_name: name, document_type: 'habilitacao' }); } catch {}
      }
    }
    setUploading(false); setNewData(emptyForm); setNewPhotoFile(null); setNewPhotoPreview(''); setDocFiles([]); setCreateOpen(false);
    toast.success('Funcionário cadastrado!'); fetchFuncionarios(true);
  }

  function openEdit(f: Funcionario) {
    setEditData({ id: f.id, nome: f.nome, email: f.email || '', cargo: f.cargo, departamento: f.departamento, foto_url: f.foto_url || '', data_admissao: f.data_admissao || '', escolaridade: f.escolaridade || '', graduacao: f.graduacao || '', pos_graduacao: f.pos_graduacao || false, pos_graduacao_tipo: f.pos_graduacao_tipo || '', turno: f.turno || '', letra: f.letra || '', encarregado_id: f.encarregado_id || 'none' });
    setEditPhotoFile(null); setEditPhotoPreview(f.foto_url || ''); setEditDocFiles([]); setEditOpen(true);
  }

  async function handleEdit() {
    if (!editData.nome || !editData.cargo || !editData.departamento) { toast.error('Preencha campos obrigatórios'); return; }
    setUploading(true);
    let foto_url = editData.foto_url;
    try { if (editPhotoFile) foto_url = await uploadPhoto(editPhotoFile); } catch { toast.error('Erro foto'); setUploading(false); return; }
    const updateData: any = { nome: editData.nome, email: editData.email, cargo: editData.cargo, departamento: editData.departamento, escolaridade: editData.escolaridade, graduacao: editData.graduacao, pos_graduacao: editData.pos_graduacao, pos_graduacao_tipo: editData.pos_graduacao_tipo, turno: editData.turno, letra: editData.letra, encarregado_id: editData.encarregado_id && editData.encarregado_id !== 'none' ? editData.encarregado_id : null, foto_url };
    if (editData.data_admissao) updateData.data_admissao = editData.data_admissao;
    const { error } = await supabase.from('funcionarios').update(updateData).eq('id', editData.id);
    if (editDocFiles.length > 0) {
      for (const file of editDocFiles) {
        try { const { url, name } = await uploadDocument(file); await supabase.from('employee_documents').insert({ employee_id: editData.id, file_url: url, file_name: name, document_type: 'habilitacao' }); } catch {}
      }
    }
    setUploading(false);
    if (error) { toast.error('Erro ao atualizar'); return; }
    setEditOpen(false); toast.success('Funcionário atualizado!'); fetchFuncionarios(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from('funcionarios').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao excluir'); return; }
    setDeleteId(null); toast.success('Funcionário excluído!'); fetchFuncionarios(true);
  }

  function handleDocFilesChange(e: React.ChangeEvent<HTMLInputElement>, isEdit = false) {
    const files = Array.from(e.target.files || []);
    if (isEdit) setEditDocFiles(prev => [...prev, ...files]);
    else setDocFiles(prev => [...prev, ...files]);
  }

  function renderFormFields(data: typeof newData, setData: (d: typeof newData) => void, docs: File[], setDocs: React.Dispatch<React.SetStateAction<File[]>>, docRef: React.RefObject<HTMLInputElement>) {
    return (
      <>
        <div className="space-y-2"><Label>Nome completo</Label><FastInput value={data.nome} onValueChange={v => setData({ ...data, nome: v })} placeholder="Nome do funcionário" /></div>
        <div className="space-y-2"><Label>Data de Admissão</Label><Input type="date" value={data.data_admissao} onChange={e => setData({ ...data, data_admissao: e.target.value })} /></div>
        <div className="space-y-2">
          <Label>Escolaridade</Label>
          <Select value={data.escolaridade} onValueChange={v => setData({ ...data, escolaridade: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{escolaridades.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-2"><Label>Graduação</Label><FastInput value={data.graduacao} onValueChange={v => setData({ ...data, graduacao: v })} placeholder="Ex: Engenharia Civil" /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label>Possui Pós-Graduação?</Label><Switch checked={data.pos_graduacao} onCheckedChange={v => setData({ ...data, pos_graduacao: v, pos_graduacao_tipo: v ? data.pos_graduacao_tipo : '' })} /></div>
          {data.pos_graduacao && <FastInput value={data.pos_graduacao_tipo} onValueChange={v => setData({ ...data, pos_graduacao_tipo: v })} placeholder="Qual pós-graduação?" className="mt-2" />}
        </div>
        <div className="space-y-2"><Label>Cargo</Label><FastInput value={data.cargo} onValueChange={v => setData({ ...data, cargo: v })} placeholder="Cargo" /></div>
        <div className="space-y-2"><Label>E-mail</Label><FastInput value={data.email} onValueChange={v => setData({ ...data, email: v })} placeholder="email@empresa.com" type="email" /></div>
        <div className="space-y-2">
          <Label>Departamento</Label>
          <Select value={data.departamento} onValueChange={v => setData({ ...data, departamento: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{departamentos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Label className="text-sm font-semibold">Turno / Escala</Label>
          <Select value={data.turno} onValueChange={v => setData({ ...data, turno: v, letra: letraFromTurno(v) })}><SelectTrigger><SelectValue placeholder="Selecione o turno" /></SelectTrigger><SelectContent>{TURNOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
          
        </div>
        {encarregados.length > 0 && (
          <div className="space-y-2">
            <Label>Encarregado (Supervisor)</Label>
            <Select value={data.encarregado_id} onValueChange={v => setData({ ...data, encarregado_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem>{encarregados.map(enc => <SelectItem key={enc.id} value={enc.id}>{enc.nome}</SelectItem>)}</SelectContent></Select>
          </div>
        )}
        {cargoNeedsDocs(data.cargo) && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Label className="flex items-center gap-2"><FileUp className="w-4 h-4 text-primary" />Documentos</Label>
            <input ref={docRef} type="file" accept=".pdf,image/*" multiple className="hidden" onChange={e => handleDocFilesChange(e, docs === editDocFiles)} />
            <Button type="button" variant="outline" size="sm" onClick={() => docRef.current?.click()} className="w-full"><FileUp className="w-4 h-4 mr-2" />Anexar</Button>
            {docs.length > 0 && <div className="space-y-1 mt-2">{docs.map((f, i) => <div key={i} className="flex items-center gap-2 text-sm p-1.5 bg-background rounded"><FileText className="w-4 h-4 text-muted-foreground" /><span className="truncate flex-1">{f.name}</span><button onClick={() => { const u = [...docs]; u.splice(i, 1); setDocs(u); }} className="text-destructive"><X className="w-3 h-3" /></button></div>)}</div>}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Colaboradores</h1>
        <p className="text-muted-foreground text-sm mt-1">Lista e cadastro de funcionários</p>
      </motion.div>

      <Tabs defaultValue="lista" className="w-full mt-6">
        <TabsList className="w-full justify-start h-auto flex-wrap p-1.5 bg-muted/30 rounded-xl mb-6 border border-border">
          <TabsTrigger value="lista" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Lista de Colaboradores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista" className="space-y-6 outline-none">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou cargo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos</SelectItem>{departamentos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={turnoFilter} onValueChange={setTurnoFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Turno/Escala" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Turnos</SelectItem>
            {TURNOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" onClick={() => importFileRef.current?.click()} disabled={importing}>{importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}Importar</Button>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Funcionário</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cadastrar Funcionário</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center gap-2">
                <input ref={newFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setNewPhotoFile(file); setNewPhotoPreview(URL.createObjectURL(file)); }}} />
                {newPhotoPreview ? (
                  <div className="relative"><img src={newPhotoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" /><button onClick={() => { setNewPhotoFile(null); setNewPhotoPreview(''); }} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button></div>
                ) : (
                  <button onClick={() => newFileRef.current?.click()} className="w-20 h-20 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"><Camera className="w-6 h-6 text-muted-foreground" /></button>
                )}
              </div>
              {renderFormFields(newData, setNewData, docFiles, setDocFiles, docFileRef as React.RefObject<HTMLInputElement>)}
              <Button className="w-full" onClick={handleCreate} disabled={uploading}>{uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Nenhum colaborador encontrado</p></div>
      ) : (
        <>
          {/* Bulk selection bar */}
          <div className="flex items-center gap-3 glass-card rounded-xl p-3">
            <Checkbox
              checked={allFilteredSelected}
              onCheckedChange={toggleSelectAll}
              id="select-all-employees"
            />
            <label htmlFor="select-all-employees" className="text-sm font-medium cursor-pointer">
              Selecionar todos ({filtered.length})
            </label>
            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground ml-auto">
                  {selectedIds.size} selecionado(s)
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir Selecionados
                </Button>
              </>
            )}
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((f, i) => {
            const turnoLabel = TURNOS.find(t => t.value === f.turno)?.label;
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-4 hover:ring-1 hover:ring-primary/30 transition-all relative overflow-hidden group ${selectedIds.has(f.id) ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
              >
                <div className="absolute top-4 left-4">
                  <Checkbox
                    checked={selectedIds.has(f.id)}
                    onCheckedChange={() => toggleSelect(f.id)}
                  />
                </div>
                
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => openEdit(f)} title="Editar"><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive hover:text-destructive" onClick={() => setDeleteId(f.id)} title="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>

                <div className="mt-2">
                  {f.foto_url ? (
                    <img src={f.foto_url} alt={f.nome} className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-md mx-auto" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-4 border-background shadow-sm mx-auto"><span className="text-primary font-black text-2xl">{f.nome.charAt(0)}</span></div>
                  )}
                </div>
                
                <div className="flex-1 w-full space-y-2">
                  <div>
                    <p className="font-bold text-base line-clamp-1">{f.nome}</p>
                    <p className="text-xs text-primary font-medium">{f.cargo}</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{f.departamento}</span>
                    {turnoLabel && <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-chart-3/10 text-chart-3">{turnoLabel}</span>}
                  </div>
                </div>
                
                <div className="w-full mt-2 pt-4 border-t border-border/50">
                  <Button variant="outline" className="w-full text-xs" onClick={() => navigate(`/funcionario/${f.id}`)}><Eye className="w-3.5 h-3.5 mr-2" /> Ver Perfil</Button>
                </div>
              </motion.div>
            );
          })}
        </div>
        </>
      )}
      </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Funcionário</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-2">
              <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setEditPhotoFile(file); setEditPhotoPreview(URL.createObjectURL(file)); }}} />
              {editPhotoPreview ? (
                <div className="relative"><img src={editPhotoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" /><button onClick={() => { setEditPhotoFile(null); setEditPhotoPreview(''); setEditData({ ...editData, foto_url: '' }); }} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button></div>
              ) : (
                <button onClick={() => editFileRef.current?.click()} className="w-20 h-20 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"><Camera className="w-6 h-6 text-muted-foreground" /></button>
              )}
            </div>
            {renderFormFields(editData, setEditData as any, editDocFiles, setEditDocFiles, editDocFileRef as React.RefObject<HTMLInputElement>)}
            <Button className="w-full" onClick={handleEdit} disabled={uploading}>{uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Salvar Alterações</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir funcionário?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={open => !open && setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} funcionário(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir permanentemente os funcionários selecionados. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDeleting ? 'Excluindo...' : `Excluir ${selectedIds.size} funcionário(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
