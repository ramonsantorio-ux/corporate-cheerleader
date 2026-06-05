import { renderToString } from 'react-dom/server';
import GestaoNotificacoes from './GestaoNotificacoes';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

const html = renderToString(
  <BrowserRouter>
    <GestaoNotificacoes />
  </BrowserRouter>
);

console.log("Render GestaoNotificacoes successful. Length:", html.length);
