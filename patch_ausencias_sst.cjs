const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'Ausencias.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Attendance interface
content = content.replace(
  'turno?: string; letra?: string; cargo?: string;',
  'turno?: string; letra?: string; cargo?: string; cid?: string; crm?: string; dias_afastamento?: number;'
);

// 2. Update form state
content = content.replace(
  "const [form, setForm] = useState({ employee_id: '', date: '', status: 'presente', observation: '' });",
  "const [form, setForm] = useState({ employee_id: '', date: '', status: 'presente', observation: '', cid: '', crm: '', dias_afastamento: '0' });"
);

// 3. Update handleCreateAttendance
content = content.replace(
  "employee_id: form.employee_id, date: form.date, status: statusToSave, observation: form.observation,",
  "employee_id: form.employee_id, date: form.date, status: statusToSave, observation: form.observation, cid: form.status === 'atestado' ? form.cid : null, crm: form.status === 'atestado' ? form.crm : null, dias_afastamento: form.status === 'atestado' ? parseInt(form.dias_afastamento) || 0 : 0,"
);

// Update setForm reset in handleCreateAttendance
content = content.replace(
  "setForm({ employee_id: '', date: '', status: 'presente', observation: '' });",
  "setForm({ employee_id: '', date: '', status: 'presente', observation: '', cid: '', crm: '', dias_afastamento: '0' });"
);

// 4. Update the Dialog form
const atestadoFields = `{form.status === 'atestado' && (
                      <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                        <div className="space-y-2">
                          <Label>CID</Label>
                          <FastInput value={form.cid} onValueChange={v => setForm(f => ({ ...f, cid: v }))} placeholder="Ex: J00" />
                        </div>
                        <div className="space-y-2">
                          <Label>CRM</Label>
                          <FastInput value={form.crm} onValueChange={v => setForm(f => ({ ...f, crm: v }))} placeholder="Ex: 12345-PR" />
                        </div>
                        <div className="space-y-2">
                          <Label>Dias (Afastamento)</Label>
                          <Input type="number" value={form.dias_afastamento} onChange={e => setForm(f => ({ ...f, dias_afastamento: e.target.value }))} />
                        </div>
                      </div>
                    )}`;

content = content.replace(
  "<div className=\"space-y-2\">\n                    <Label>Observação</Label>",
  `${atestadoFields}\n                  <div className="space-y-2">\n                    <Label>Observação</Label>`
);

// 5. Add analytics computed values for Atestados
const atestadosAnalytics = `  // ─── Atestados Analytics ──────────────────────────────────────────────
  const atestadosAnalytics = useMemo(() => {
    let diasPerdidos = 0;
    const cidCount: Record<string, number> = {};
    const empAtestados: Record<string, { name: string, count: number, days: number }> = {};
    const cargoAtestados: Record<string, number> = {};

    attendance.forEach(a => {
      if (a.status === 'atestado') {
        const dias = a.dias_afastamento || 1; // assumindo 1 dia se não preenchido
        diasPerdidos += dias;
        
        if (a.cid) cidCount[a.cid.toUpperCase()] = (cidCount[a.cid.toUpperCase()] || 0) + 1;
        
        if (a.employee_id) {
          if (!empAtestados[a.employee_id]) empAtestados[a.employee_id] = { name: a.employee_name || '', count: 0, days: 0 };
          empAtestados[a.employee_id].count += 1;
          empAtestados[a.employee_id].days += dias;
        }

        if (a.cargo) {
          cargoAtestados[a.cargo] = (cargoAtestados[a.cargo] || 0) + 1;
        }
      }
    });

    const topCids = Object.entries(cidCount).sort(([,a], [,b]) => b - a).slice(0, 7).map(([name, value]) => ({ name, value }));
    const topEmpAtestados = Object.values(empAtestados).sort((a, b) => b.count - a.count).slice(0, 10);
    const topCargos = Object.entries(cargoAtestados).sort(([,a], [,b]) => b - a).slice(0, 5).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }));

    return { diasPerdidos, topCids, topEmpAtestados, topCargos };
  }, [attendance]);`;

content = content.replace(
  "const totalHorasNegativas = empAttendance.filter(a => ['falta_injustificada', 'falta_justificada', 'atestado'].includes(a.status)).length;",
  `${atestadosAnalytics}\n\n  const totalHorasNegativas = empAttendance.filter(a => ['falta_injustificada', 'falta_justificada', 'atestado'].includes(a.status)).length;`
);

// 6. Add Dashboard sections before "HORAS NEGATIVAS POR COLABORADOR"
const atestadoDashboard = `      {/* ═══ PAINEL CLÍNICO - ATESTADOS ═══ */}
      {totalAtestados > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.21 }} className="corporate-section bg-blue-50/20 border-blue-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Painel Clínico de Atestados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
             <div className="bg-card border border-border rounded-lg p-4 flex flex-col justify-center items-center text-center">
               <p className="text-xs text-muted-foreground font-medium">Dias Perdidos (Afastamento)</p>
               <p className="text-4xl font-bold text-blue-600 mt-2">{atestadosAnalytics.diasPerdidos}</p>
             </div>
             
             <div className="md:col-span-3 bg-card border border-border rounded-lg p-4">
               <p className="text-xs text-muted-foreground font-medium mb-3">Top Funcionários (Qtd. de Atestados)</p>
               <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                 {atestadosAnalytics.topEmpAtestados.map((emp, idx) => (
                   <div key={idx} className="p-2 bg-muted/30 rounded border text-center">
                     <p className="text-xs font-semibold truncate" title={emp.name}>{emp.name}</p>
                     <p className="text-sm text-blue-600 font-bold">{emp.count} <span className="text-[10px] font-normal text-muted-foreground">({emp.days}d)</span></p>
                   </div>
                 ))}
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 h-[250px]">
               <p className="text-xs text-muted-foreground font-medium mb-2">Top 7 CIDs</p>
               <ResponsiveContainer width="100%" height="90%">
                 <BarChart data={atestadosAnalytics.topCids} layout="vertical" margin={{ left: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                   <XAxis type="number" tick={{ fontSize: 10 }} />
                   <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                   <Tooltip content={<CustomTooltip />} />
                   <Bar dataKey="value" name="Atestados" fill="hsl(200, 70%, 50%)" radius={[0, 4, 4, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 h-[250px]">
               <p className="text-xs text-muted-foreground font-medium mb-2">Atestados por Função</p>
               <ResponsiveContainer width="100%" height="90%">
                 <PieChart>
                   <Pie data={atestadosAnalytics.topCargos} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" label={false}>
                     {atestadosAnalytics.topCargos.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                   </Pie>
                   <Tooltip content={<CustomTooltip />} />
                   <Legend wrapperStyle={{ fontSize: 10 }} layout="vertical" verticalAlign="middle" align="right" />
                 </PieChart>
               </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}`;

content = content.replace(
  "{/* ═══ HORAS NEGATIVAS POR COLABORADOR ═══ */}",
  `${atestadoDashboard}\n\n      {/* ═══ HORAS NEGATIVAS POR COLABORADOR ═══ */}`
);

// 7. Update Detailed table to show CID/Dias
content = content.replace(
  "<th className=\"text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground\">Status</th>",
  "<th className=\"text-left px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground\">Status</th>\n<th className=\"text-center px-4 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground\">Detalhe Médico</th>"
);

content = content.replace(
  "<td className=\"px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate\">{a.observation || '—'}</td>",
  `<td className="px-4 py-2.5 text-center">
    {a.status === 'atestado' ? (
      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
        CID: {a.cid || '—'} | {a.dias_afastamento || 0}d
      </span>
    ) : <span className="text-muted-foreground">—</span>}
  </td>\n  <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{a.observation || '—'}</td>`
);

fs.writeFileSync(filePath, content);
console.log('Ausencias.tsx atualizado com sucesso!');
