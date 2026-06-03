const fs = require('fs');

const months = ['Ago/2025', 'Set/2025', 'Out/2025', 'Nov/2025', 'Dez/2025', 'Jan/2026', 'Fev/2026', 'Mar/2026', 'Abr/2026', 'Mai/2026'];

const mockData = months.map((mes, index) => {
    // Faturamento base random 2.4M a 2.7M
    const fatLocacao = 2400000 + (Math.random() * 300000);
    const fatMaoDeObra = Math.random() * 50000;
    
    // Folha base ~880k
    const custoFolha = 850000 + (Math.random() * 60000);
    const horasExtras = Math.random() * 20000;
    
    // Encargos
    const impostoInss = custoFolha * 0.20; // 20%
    const impostoFgts = custoFolha * 0.08; // 8%
    const inssAdSat = custoFolha * 0.03; // SAT 3%
    
    // Impostos
    const receitaBruta = fatLocacao + fatMaoDeObra;
    const impostoPis = receitaBruta * 0.0165;
    const impostoCofins = receitaBruta * 0.076;
    const impostoIss = receitaBruta * 0.05;
    const impostoCsll = receitaBruta * 0.0108;
    
    // Manutencao & Op
    const manutencaoPecas = 120000 + (Math.random() * 60000);
    const manutencaoServicos = 30000 + (Math.random() * 20000);
    const combustivelDieselS10 = 200000 + (Math.random() * 40000);
    
    // Beneficios
    const beneficioVr = 45000;
    const beneficioVt = 15000;
    const planoSaude = 35000;
    
    // Outros
    const uniforme = 5000;
    const escritorioMaterial = 2000;
    const aderencia = 94 + (Math.random() * 5);

    return {
        id: index + 1,
        mes,
        aderencia: Number(aderencia.toFixed(2)),
        fatLocacao: Number(fatLocacao.toFixed(2)),
        fatMaoDeObra: Number(fatMaoDeObra.toFixed(2)),
        eventuais: 0,
        descontos: [],
        multas: [],
        notificacoes: [],
        custoFolha: Number(custoFolha.toFixed(2)),
        horasExtras: Number(horasExtras.toFixed(2)),
        impostoInss: Number(impostoInss.toFixed(2)),
        impostoPis: Number(impostoPis.toFixed(2)),
        impostoCofins: Number(impostoCofins.toFixed(2)),
        impostoIss: Number(impostoIss.toFixed(2)),
        impostoCsll: Number(impostoCsll.toFixed(2)),
        impostoInssAdSat: Number(inssAdSat.toFixed(2)),
        manutencaoPecas: Number(manutencaoPecas.toFixed(2)),
        manutencaoServicos: Number(manutencaoServicos.toFixed(2)),
        combustivelDieselS10: Number(combustivelDieselS10.toFixed(2)),
        uniforme,
        escritorioMaterial,
        // Optional custom fields to simulate the user's specific inputs
        beneficioVr,
        beneficioVt,
        planoSaude,
        impostoFgts: Number(impostoFgts.toFixed(2))
    };
});

let fileContent = fs.readFileSync('src/pages/EvolucaoContrato.tsx', 'utf8');

const regex = /const mockData: Medicao\[\] = \[([\s\S]*?)\];/;
fileContent = fileContent.replace(regex, 'const mockData: Medicao[] = ' + JSON.stringify(mockData, null, 2) + ';');

fs.writeFileSync('src/pages/EvolucaoContrato.tsx', fileContent);
console.log('Mock data updated successfully!');
