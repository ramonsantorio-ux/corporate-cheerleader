const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Iniciando navegador...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER CONSOLE ERROR:', msg.text());
      }
    });

    page.on('pageerror', err => {
      console.log('BROWSER PAGE ERROR:', err.toString());
    });

    console.log('Acessando http://localhost:8080/evolucao...');
    await page.goto('http://localhost:8080/evolucao', { waitUntil: 'networkidle0', timeout: 15000 });
    
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.close();
    console.log('Análise concluída.');
  } catch (err) {
    console.error('Erro na execução do script:', err);
  }
})();
