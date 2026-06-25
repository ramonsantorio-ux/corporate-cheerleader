const arr = [
  {mes: 'Mai/2026', fatLocacao: 1000, aderenciaDiaria: []}, 
  {mes: 'Mai/2026', fatLocacao: 0, aderenciaDiaria: [{dia: '01', aderencia: 100}]}
]; 
const merged = arr.reduce((acc, curr) => { 
  const existing = acc.find(m => m.mes === curr.mes); 
  if (existing) { 
    Object.keys(curr).forEach(key => { 
      if (Array.isArray(curr[key]) && curr[key].length > 0) { 
        existing[key] = curr[key]; 
      } else if (typeof curr[key] === 'number' && curr[key] !== 0 && existing[key] === 0) { 
        existing[key] = curr[key]; 
      } else if (curr[key] && !existing[key]) { 
        existing[key] = curr[key]; 
      } 
    }); 
  } else { 
    acc.push({ ...curr }); 
  } 
  return acc; 
}, []); 
console.log(JSON.stringify(merged, null, 2));
