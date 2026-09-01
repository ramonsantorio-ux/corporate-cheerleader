import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ManualProcedimentos() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/MOP-RH-001_Manual_Procedimentos.html';
    link.download = 'MOP-RH-001_Manual_Procedimentos_Busato.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenRaw = () => {
    window.open('/MOP-RH-001_Manual_Procedimentos.html', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra Superior de Controle */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-slate-300 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-400/20">
                MOP-RH-001
              </span>
              <span className="text-xs text-slate-400 hidden md:inline">•</span>
              <span className="text-xs text-slate-300 font-semibold hidden md:inline">
                ISO 9001:2015
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none mt-0.5">
              Manual de Procedimentos Operacionais
            </h1>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="h-8 text-xs font-semibold gap-1.5 bg-white/5 border-white/20 text-slate-200 hover:bg-white/10 hover:text-white"
            title="Baixar o arquivo HTML completo com prints embutidos"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Baixar Arquivo</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="h-8 text-xs font-bold gap-1.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-md"
            title="Salvar como PDF ou Imprimir"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Salvar como PDF</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleOpenRaw}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
            title="Abrir em tela cheia (aba avulsa)"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Frame do Manual com visualização direta */}
      <main className="flex-1 w-full relative">
        <iframe
          ref={iframeRef}
          src="/MOP-RH-001_Manual_Procedimentos.html"
          title="Manual de Procedimentos Operacionais Busato"
          className="w-full h-[calc(100vh-57px)] border-0"
        />
      </main>
    </div>
  );
}
