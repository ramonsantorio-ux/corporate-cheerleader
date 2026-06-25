import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DailyChart } from './DailyChart';
import { TrendingUp, Briefcase, Settings } from "lucide-react";

interface Medicao {
  id: number;
  mes: string;
  aderenciaDiaria?: { dia: string; aderencia: number }[];
  aderenciaMinerioDiaria?: { dia: string; aderencia: number }[];
  aderenciaTpmDiaria?: { dia: string; aderencia: number }[];
  [key: string]: any;
}

interface AderenciaDiariaViewerProps {
  medicoes: Medicao[];
  setExpandedChart: (chart: string) => void;
}

export function AderenciaDiariaViewer({ medicoes, setExpandedChart }: AderenciaDiariaViewerProps) {
  // Use a set or filter to remove duplicate months from the dropdown
  const uniqueMedicoes = medicoes.filter((medicao, index, self) =>
    index === self.findIndex((t) => t.mes === medicao.mes)
  ).slice().reverse();

  const [selectedMes, setSelectedMes] = useState<string>(
    uniqueMedicoes.length > 0 ? uniqueMedicoes[0].mes : ''
  );

  // Find the selected medicao (we take the first one that matches the month)
  const selectedMedicao = medicoes.find(m => m.mes === selectedMes);

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Select value={selectedMes} onValueChange={setSelectedMes}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {uniqueMedicoes.map(m => (
              <SelectItem key={m.id} value={m.mes}>{m.mes}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DailyChart 
        title="Aderência Geral (Diária)"
        icon={<TrendingUp className="w-6 h-6 text-success" />}
        mes={selectedMes}
        data={selectedMedicao?.aderenciaDiaria || []}
        colorName="success"
        emptyStateMessage={`Nenhum dado diário geral lançado para ${selectedMes}. Acesse o Lançar Medição Mensal para importar.`}
        onClick={() => setExpandedChart('diario')}
      />

      <DailyChart 
        title="Porto - Minério"
        icon={<Briefcase className="w-6 h-6 text-primary" />}
        mes={selectedMes}
        data={selectedMedicao?.aderenciaMinerioDiaria || []}
        colorName="primary"
        emptyStateMessage={`Nenhum dado diário de minério lançado para ${selectedMes}. Acesse o Lançar Medição Mensal para importar.`}
        onClick={() => setExpandedChart('minerio')}
      />

      <DailyChart 
        title="Porto - TPM"
        icon={<Settings className="w-6 h-6 text-primary" />}
        mes={selectedMes}
        data={selectedMedicao?.aderenciaTpmDiaria || []}
        colorName="primary"
        emptyStateMessage={`Nenhum dado diário de TPM lançado para ${selectedMes}. Acesse o Lançar Medição Mensal para importar.`}
        onClick={() => setExpandedChart('tpm')}
      />
    </div>
  );
}
