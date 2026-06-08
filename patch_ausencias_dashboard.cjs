const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'Ausencias.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. We replace the Painel Clinico rendering block in Ausencias.tsx
const oldPainelClinico = `{/* ═══ PAINEL CLÍNICO - ATESTADOS ═══ */}`;
const endPainelClinico = `{/* ═══ HORAS NEGATIVAS POR COLABORADOR ═══ */}`;

const startIndex = content.indexOf(oldPainelClinico);
const endIndex = content.indexOf(endPainelClinico);

if (startIndex === -1 || endIndex === -1) {
    console.error("Painel Clínico markers not found!");
    process.exit(1);
}

const newPainelClinico = `{/* ═══ PAINEL CLÍNICO - ATESTADOS (DASHBOARD VISUAL) ═══ */}
      {totalAtestados > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.21 }} className="mt-8 bg-[#f4f6f8] p-4 rounded-xl border border-border shadow-sm">
          
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
            <div>
              <h2 className="text-3xl font-black text-[#2f5597] tracking-tighter uppercase leading-none">Dashboard</h2>
              <h3 className="text-2xl font-bold text-[#4472c4] tracking-tight uppercase">Atestado Médico</h3>
            </div>
            <div className="bg-white px-4 py-2 rounded shadow-sm flex items-center gap-2 border border-border text-[#2f5597] font-bold text-xs cursor-pointer hover:bg-slate-50">
              <Clock className="w-4 h-4" /> Atualizar Dados
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            
            {/* Esquerda: KPIs e Top 10 Funcionários */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-t-[#eb7d5b] flex flex-col items-center">
                   <p className="text-xs text-[#2f5597] font-bold mb-2">Quantidade de atestados</p>
                   <div className="flex items-center justify-center gap-4">
                     <div className="w-12 h-12 bg-[#eb7d5b] rounded-full flex items-center justify-center text-white"><User className="w-6 h-6" /></div>
                     <span className="text-4xl font-light text-slate-700">{totalAtestados}</span>
                   </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-t-[#4472c4] flex flex-col items-center">
                   <p className="text-xs text-[#2f5597] font-bold mb-2">Dias perdidos</p>
                   <div className="flex items-center justify-center gap-4">
                     <div className="w-12 h-12 flex items-center justify-center text-[#4472c4]"><Calendar className="w-8 h-8" /></div>
                     <span className="text-4xl font-light text-slate-700">{atestadosAnalytics.diasPerdidos}</span>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm flex-1">
                <p className="text-sm text-[#2f5597] font-bold text-center mb-6">Os 10 Funcionários que mais apresentaram atestado</p>
                <div className="space-y-3">
                  {atestadosAnalytics.topEmpAtestados.slice(0, 10).map((emp) => {
                    const maxAtestados = Math.max(...atestadosAnalytics.topEmpAtestados.map(e => e.count), 1);
                    const pct = (emp.count / maxAtestados) * 100;
                    return (
                      <div key={emp.name} className="flex items-center gap-3">
                        <span className="w-[120px] text-right truncate text-xs text-slate-700 font-medium" title={emp.name}>{emp.name}</span>
                        <div className="flex-1 h-5 bg-transparent relative flex items-center">
                          <div className="h-full bg-gradient-to-r from-[#2f5597] to-[#5b8cdd] rounded shadow-sm" style={{ width: \`\${pct}%\` }}></div>
                          <span className="absolute right-[-24px] font-bold text-xs text-slate-800">{emp.count}</span>
                        </div>
                        <div className="w-8"></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Direita: Gráficos */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm h-[200px] flex flex-col">
                 <p className="text-sm text-[#2f5597] font-bold text-center mb-2">Os 7 CIDs mais predominantes</p>
                 <div className="flex-1 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={atestadosAnalytics.topCids.slice(0, 7)} margin={{ top: 15, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                       <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                       <Bar dataKey="value" fill="#2f5597" radius={[2, 2, 0, 0]} barSize={40}>
                         <LabelList dataKey="value" position="top" style={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 h-[200px]">
                <div className="bg-white rounded-lg p-4 shadow-sm flex flex-col">
                   <p className="text-sm text-[#2f5597] font-bold text-center mb-2">5 CRMs mais predominantes</p>
                   <div className="flex-1 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={atestadosAnalytics.topCrms.slice(0, 5)} margin={{ top: 15, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                         <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                         <Bar dataKey="value" fill="#2f5597" radius={[2, 2, 0, 0]} barSize={30}>
                           <LabelList dataKey="value" position="top" style={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm flex flex-col">
                   <p className="text-sm text-[#2f5597] font-bold text-center mb-2">5 Funções que mais apresenta atestado</p>
                   <div className="flex-1 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={atestadosAnalytics.topCargos.slice(0, 5)} margin={{ top: 15, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                         <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#666' }} axisLine={false} tickLine={false} />
                         <Bar dataKey="value" fill="#2f5597" radius={[2, 2, 0, 0]} barSize={30}>
                           <LabelList dataKey="value" position="top" style={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      `;

const newContent = content.substring(0, startIndex) + newPainelClinico + content.substring(endIndex);

fs.writeFileSync(filePath, newContent);
console.log('Painel Clinico in Ausencias.tsx updated successfully!');
