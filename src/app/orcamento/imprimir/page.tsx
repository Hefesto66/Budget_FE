
"use client";

import { useEffect } from 'react';
import './imprimir.css';

export default function ImprimirPropostaPage() {
  useEffect(() => {
    // Ponto de Inspeção 3: Conteúdo lido do sessionStorage
    const content = sessionStorage.getItem('proposalHtmlToPrint');
    console.log("3. CONTEÚDO LIDO DO SESSIONSTORAGE:", content);

    const printRoot = document.getElementById('print-root');

    if (content && printRoot) {
      printRoot.innerHTML = content;
      
      // Allow images to load before printing
      setTimeout(() => {
        window.print();
      }, 500); 

    } else {
      if (printRoot) {
        printRoot.innerHTML = `
          <div class="error-container">
            <h1>Erro ao Gerar Proposta</h1>
            <p>O conteúdo da proposta não foi encontrado. Por favor, volte à página anterior e tente gerar o PDF novamente.</p>
            <button onclick="window.close()">Fechar</button>
          </div>
        `;
      }
    }

    // Clean up after printing
    sessionStorage.removeItem('proposalHtmlToPrint');
    
    // Add a listener for after printing to close the window
    const handleAfterPrint = () => {
        // Use a short timeout to ensure the print dialog is fully closed
        setTimeout(() => {
            window.close();
        }, 100);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
    };

  }, []);

  return <div id="print-root"></div>;
}
