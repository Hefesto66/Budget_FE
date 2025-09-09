// src/app/proposal-template/page.server.tsx
import React from 'react';
import ProposalTemplateClient from './ProposalTemplateClient';

// Este Server Component injeta um script inline para capturar mensagens antes da hidratação do React.
export default function ProposalTemplateServerPage() {
  const inlineScript = `
    (function(){
      try {
        // Armazena o listener numa propriedade global para permitir a sua remoção futura, se necessário.
        window.__proposalImmediateListener = function(e) {
          try {
            // Em produção, deve-se verificar e.origin. Para depuração, podemos ser mais permissivos.
            // if (e.origin !== 'SUA_ORIGEM_DE_PRODUCAO') return;
            
            var msg = e && e.data;
            if (!msg || typeof msg !== 'object') return;

            // Processa apenas as mensagens do tipo esperado.
            if (msg.type === 'PROPOSAL_DATA') {
              // Guarda os dados globalmente para que o cliente React os possa ler mais tarde.
              window.__PROPOSAL_DATA__ = msg;
              
              // Tenta enviar uma confirmação (ACK) imediata para a janela que a abriu.
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ type: 'PROPOSAL_ACK', requestId: msg.requestId }, '*');
                }
              } catch (err) {
                // Ignora erros que possam ocorrer se a janela que a abriu já não estiver acessível.
              }
            }
          } catch (err) { /* ignora erros internos do listener */ }
        };
        
        window.addEventListener('message', window.__proposalImmediateListener, { passive: true });

      } catch(e){ /* ignora erros de configuração do script */ }
    })();
  `;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
      <ProposalTemplateClient />
    </>
  );
}
