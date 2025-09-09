'use client';

import { useEffect, useRef } from 'react';
import './imprimir.css'; // We'll create this file for print-specific styles
import { useToast } from '@/hooks/use-toast';

export default function PrintPage() {
  const { toast } = useToast();
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (hasPrinted.current) return;

    try {
      const htmlContent = sessionStorage.getItem('proposalHtmlToPrint');
      const contentDiv = document.getElementById('print-content');

      if (htmlContent && contentDiv) {
        contentDiv.innerHTML = htmlContent;
        
        // Give the browser a moment to render images before printing
        setTimeout(() => {
          window.print();
        }, 500);

      } else {
        toast({
          title: "Erro ao Gerar Proposta",
          description: "O conteúdo da proposta não foi encontrado. Por favor, volte à página anterior e tente gerar o PDF novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Print page error:", error);
      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro ao preparar a página para impressão.",
        variant: "destructive",
      });
    }

    hasPrinted.current = true;
    
    // Optional: close the tab after printing
    window.onafterprint = () => {
        // window.close(); // This can be aggressive, use with caution
    };

  }, [toast]);

  return (
    <html>
      <head>
        <title>Imprimir Proposta</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Poppins:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="print-content">
            {/* O HTML da proposta será injetado aqui */}
        </div>
      </body>
    </html>
  );
}
