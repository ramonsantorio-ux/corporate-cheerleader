import { renderToString } from 'react-dom/server';
import EvolucaoContrato from './EvolucaoContrato';
import React from 'react';
import { StaticRouter } from 'react-router-dom/server';

try {
  const html = renderToString(
    <StaticRouter location="/evolucao">
      <EvolucaoContrato />
    </StaticRouter>
  );
  console.log("Render EvolucaoContrato successful. Length:", html.length);
} catch (error) {
  console.error("Render failed:", error);
}
