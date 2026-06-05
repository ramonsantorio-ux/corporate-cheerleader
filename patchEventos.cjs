const fs = require('fs');
let code = fs.readFileSync('src/pages/Eventos.tsx', 'utf8');

// 1. Add Pencil import
if (!code.includes('Pencil,')) {
  code = code.replace('import { AlertTriangle, Plus, Search', 'import { AlertTriangle, Plus, Search, Pencil');
}

// 2. Add editingEvent state
if (!code.includes('editingEvent')) {
  code = code.replace('const [dialogOpen, setDialogOpen] = useState(false);', 'const [dialogOpen, setDialogOpen] = useState(false);\n  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);');
}

// 3. Add temporary fix for "Mini Pá Carregadeira"
if (!code.includes('MIGRATE_MINI_PA')) {
  const fetchReplace = `const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', period.start)
        .lte('event_date', period.end)
        .order('event_date', { ascending: false });`;
        
  const fetchReplacement = `const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', period.start)
        .lte('event_date', period.end)
        .order('event_date', { ascending: false });
        
      if (data) {
        // MIGRATE_MINI_PA: Unify Mini Pá Carregadeira to Mini Carregadeira in the database automatically
        const badEvents = data.filter(e => e.equipment && e.equipment.toUpperCase().includes('PÁ CARREGADEIRA') && e.equipment.toUpperCase().includes('MINI'));
        for (const ev of badEvents) {
          await supabase.from('events').update({ equipment: 'MINI CARREGADEIRA' }).eq('id', ev.id);
          ev.equipment = 'MINI CARREGADEIRA'; // update locally
        }
      }`;
  code = code.replace(fetchReplace, fetchReplacement);
}

// 4. Update save function
const saveReplace = `const { error } = await supabase.from('events').insert(newEvent);`;
const saveReplacement = `let error;
    if (editingEvent) {
      const res = await supabase.from('events').update(newEvent).eq('id', editingEvent.id);
      error = res.error;
    } else {
      const res = await supabase.from('events').insert(newEvent);
      error = res.error;
    }`;
if (!code.includes('if (editingEvent) {') && code.includes(saveReplace)) {
  code = code.replace(saveReplace, saveReplacement);
}

// 5. Reset editingEvent on close
if (!code.includes('setEditingEvent(null)') && code.includes('setDialogOpen(false);\n      setNewEvent')) {
  code = code.replace('setDialogOpen(false);\n      setNewEvent', 'setDialogOpen(false);\n      setEditingEvent(null);\n      setNewEvent');
}

// 6. Change modal title
if (!code.includes('editingEvent ?')) {
  code = code.replace('<DialogTitle>Registrar Novo Evento</DialogTitle>', '<DialogTitle>{editingEvent ? "Editar Evento" : "Registrar Novo Evento"}</DialogTitle>');
}

// 7. Add Edit button to table row
const actionReplace = `<Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDetailEvent(ev); }} className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"><Eye className="w-4 h-4" /></Button>`;
const actionReplacement = `<Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDetailEvent(ev); }} className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setNewEvent({ event_date: ev.event_date.split('T')[0], event_time: ev.event_time, day_of_week: ev.day_of_week, description: ev.description, location: ev.location, contract: ev.contract, equipment: ev.equipment, plate_tag: ev.plate_tag, shift: ev.shift, supervisor: ev.supervisor, involved_name: ev.involved_name }); setDialogOpen(true); }} className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-50"><Pencil className="w-4 h-4" /></Button>`;
if (!code.includes('<Pencil className="w-4 h-4" />') && code.includes(actionReplace)) {
  code = code.replace(actionReplace, actionReplacement);
}

// 8. Add equipment filter directly to TableHead
const headReplace = `<TableHead className="hidden md:table-cell">Equipamento</TableHead>`;
const headReplacement = `<TableHead className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        Equipamento
                        <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                          <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent shadow-none [&>svg]:opacity-0">
                            <Filter className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer opacity-100 absolute" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {equipmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>`;
if (!code.includes('<Filter className="w-4 h-4 text-muted-foreground') && code.includes(headReplace)) {
  code = code.replace(headReplace, headReplacement);
}


fs.writeFileSync('src/pages/Eventos.tsx', code, 'utf8');
console.log('Eventos.tsx updated successfully');
