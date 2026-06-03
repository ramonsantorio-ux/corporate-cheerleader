import { createClient } from '@supabase/supabase-js';

const url = 'https://xucfprdbduvrjslasyrt.supabase.co';
const key = 'sb_publishable_JhFa9TjXwOd2gy5-g2_6Gw_vwY2AqmD';

const supabase = createClient(url, key);

const mockData = [
  { "id": 1, "mes": "Ago/2025", "aderencia": 95.25, "fatLocacao": 2657193.57, "fatMaoDeObra": 2894.56, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 863991.85, "horasExtras": 19599.71, "impostoInss": 172798.37, "impostoPis": 43891.45, "impostoCofins": 202166.7, "impostoIss": 133004.41, "impostoCsll": 28728.95, "impostoInssAdSat": 25919.76, "manutencaoPecas": 121087.37, "manutencaoServicos": 45444.52, "combustivelDieselS10": 218115.91, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 69119.35 },
  { "id": 2, "mes": "Set/2025", "aderencia": 96.9, "fatLocacao": 2553023.52, "fatMaoDeObra": 21169.61, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 863167.41, "horasExtras": 4750.38, "impostoInss": 172633.48, "impostoPis": 42474.19, "impostoCofins": 195638.68, "impostoIss": 128709.66, "impostoCsll": 27801.29, "impostoInssAdSat": 25895.02, "manutencaoPecas": 135221.28, "manutencaoServicos": 37949.78, "combustivelDieselS10": 234795.68, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 69053.39 },
  { "id": 3, "mes": "Out/2025", "aderencia": 98.24, "fatLocacao": 2695354.76, "fatMaoDeObra": 47648.79, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 868157.16, "horasExtras": 17518.22, "impostoInss": 173631.43, "impostoPis": 45259.56, "impostoCofins": 208468.27, "impostoIss": 137150.18, "impostoCsll": 29624.44, "impostoInssAdSat": 26044.71, "manutencaoPecas": 142742.72, "manutencaoServicos": 42679.75, "combustivelDieselS10": 213826.09, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 69452.57 },
  { "id": 4, "mes": "Nov/2025", "aderencia": 97.64, "fatLocacao": 2576460.35, "fatMaoDeObra": 23932.71, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 851694.95, "horasExtras": 4188.74, "impostoInss": 170338.99, "impostoPis": 42906.49, "impostoCofins": 197629.87, "impostoIss": 130019.65, "impostoCsll": 28084.25, "impostoInssAdSat": 25550.85, "manutencaoPecas": 152992.79, "manutencaoServicos": 49046.48, "combustivelDieselS10": 210194.03, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 68135.6 },
  { "id": 5, "mes": "Dez/2025", "aderencia": 96.55, "fatLocacao": 2456504.91, "fatMaoDeObra": 23379.68, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 869895.75, "horasExtras": 10379.4, "impostoInss": 173979.15, "impostoPis": 40918.1, "impostoCofins": 188471.23, "impostoIss": 123994.23, "impostoCsll": 26782.75, "impostoInssAdSat": 26096.87, "manutencaoPecas": 130384.37, "manutencaoServicos": 32624.84, "combustivelDieselS10": 223833.23, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 69591.66 },
  { "id": 6, "mes": "Jan/2026", "aderencia": 94.42, "fatLocacao": 2620917.24, "fatMaoDeObra": 16501.69, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 876232.83, "horasExtras": 19274.3, "impostoInss": 175246.57, "impostoPis": 43517.41, "impostoCofins": 200443.84, "impostoIss": 131870.95, "impostoCsll": 28484.12, "impostoInssAdSat": 26286.98, "manutencaoPecas": 156135.64, "manutencaoServicos": 42946.16, "combustivelDieselS10": 223157.94, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 70098.63 },
  { "id": 7, "mes": "Fev/2026", "aderencia": 98.18, "fatLocacao": 2437646.29, "fatMaoDeObra": 17472.12, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 907328.74, "horasExtras": 18755.73, "impostoInss": 181465.75, "impostoPis": 40509.45, "impostoCofins": 186589, "impostoIss": 122755.92, "impostoCsll": 26515.28, "impostoInssAdSat": 27219.86, "manutencaoPecas": 157641.88, "manutencaoServicos": 40319.98, "combustivelDieselS10": 206840.96, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 72586.3 },
  { "id": 8, "mes": "Mar/2026", "aderencia": 98.71, "fatLocacao": 2678792.49, "fatMaoDeObra": 7306.58, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 851550.29, "horasExtras": 811.08, "impostoInss": 170310.06, "impostoPis": 44320.63, "impostoCofins": 204143.53, "impostoIss": 134304.95, "impostoCsll": 29009.87, "impostoInssAdSat": 25546.51, "manutencaoPecas": 137015.37, "manutencaoServicos": 42038.06, "combustivelDieselS10": 219837.08, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 68124.02 },
  { "id": 9, "mes": "Abr/2026", "aderencia": 94.85, "fatLocacao": 2496379.75, "fatMaoDeObra": 38455.92, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 877508.18, "horasExtras": 5394.69, "impostoInss": 175501.64, "impostoPis": 41824.79, "impostoCofins": 192647.51, "impostoIss": 126741.78, "impostoCsll": 27376.23, "impostoInssAdSat": 26325.25, "manutencaoPecas": 126650.27, "manutencaoServicos": 49156.4, "combustivelDieselS10": 227380.7, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 70200.65 },
  { "id": 10, "mes": "Mai/2026", "aderencia": 95.64, "fatLocacao": 2526574.55, "fatMaoDeObra": 12864.83, "eventuais": 0, "descontos": [], "multas": [], "notificacoes": [], "custoFolha": 873830.56, "horasExtras": 8273.06, "impostoInss": 174766.11, "impostoPis": 41900.75, "impostoCofins": 192997.39, "impostoIss": 126971.97, "impostoCsll": 27425.95, "impostoInssAdSat": 26214.92, "manutencaoPecas": 173515.64, "manutencaoServicos": 38086.56, "combustivelDieselS10": 237288.03, "uniforme": 5000, "escritorioMaterial": 2000, "beneficioVr": 45000, "beneficioVt": 15000, "planoSaude": 35000, "impostoFgts": 69906.44 }
];

async function run() {
  try {
    console.log('Deletando do banco hardcoded...');
    const { error: delError } = await supabase.from('medicoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) console.error(delError);
    
    console.log('Inserindo 10 meses...');
    const dataToInsert = mockData.map(item => ({ mes: item.mes, dados: item }));
    const { error: insertError } = await supabase.from('medicoes').insert(dataToInsert);
    if (insertError) console.error(insertError);
    else console.log('SUCESSO!');
  } catch (err) {
    console.error(err);
  }
}
run();
