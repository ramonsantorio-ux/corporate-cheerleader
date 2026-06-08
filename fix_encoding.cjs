const fs = require('fs');
const path = require('path');

const replacements = {
    'Ã¡': 'á',
    'Ã£': 'ã',
    'Ã¢': 'â',
    'Ã ': 'à',
    'Ã©': 'é',
    'Ãª': 'ê',
    'Ã­': 'í', // Note: this is actually 'Ã' followed by a soft hyphen or something similar depending on the exact byte. The standard UTF-8 for í is C3 AD, which is Ã­
    'Ã³': 'ó',
    'Ãµ': 'õ',
    'Ã´': 'ô',
    'Ãº': 'ú',
    'Ã§': 'ç',
    'Ã\xAD': 'í', // proper hex for í mojibake
    'Ã\x81': 'Á',
    'Ã\x83': 'Ã',
    'Ã\x89': 'É',
    'Ã\x8A': 'Ê',
    'Ã\x8D': 'Í',
    'Ã\x93': 'Ó',
    'Ã\x95': 'Õ',
    'Ã\x9A': 'Ú',
    'Ã\x87': 'Ç',
    'Ã³': 'ó',
    'Ã£': 'ã',
    'Ã¡': 'á',
    'Ãª': 'ê',
    'Ã©': 'é',
    'Ãµ': 'õ',
    'Ã§': 'ç',
    'Ã­': 'í',
    'Ãº': 'ú',
    'Ã¢': 'â',
    'Ã´': 'ô',
    'Ã ': 'à',
    'Ã\x81': 'Á',
    'Ã\x89': 'É',
    'Ã\x8D': 'Í',
    'Ã\x93': 'Ó',
    'Ã\x9A': 'Ú',
    'Ã\x83': 'Ã',
    'Ã\x95': 'Õ',
    'Ã\x87': 'Ç',
    'Ã\x8A': 'Ê',
    'â‚¬Â¢': '•',
    'â€¢': '•',
    'â€“': '–',
    'â€”': '—',
    'â€œ': '"',
    'â€ ': '"',
    'â€˜': "'",
    'â€™': "'",
    'Âº': 'º',
    'Âª': 'ª',
    'Ã\x82': 'Â'
};

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const [bad, good] of Object.entries(replacements)) {
                if (content.includes(bad)) {
                    content = content.split(bad).join(good);
                    modified = true;
                }
            }
            
            // Also handle double encoded cases or specific ones from screenshot
            const specificFixes = {
                'FuncionÃ¡rio': 'Funcionário',
                'VisÃ£o': 'Visão',
                'DossiÃª': 'Dossiê',
                'RelatÃ³rio': 'Relatório',
                'AdmissÃ£o': 'Admissão',
                'PendÃªncias': 'Pendências',
                'PsicomÃ©trico': 'Psicométrico',
                'ReuniÃµes': 'Reuniões',
                'AÃ§Ã£o': 'Ação',
                'AÃ§Ãµes': 'Ações',
                'PadrÃ£o': 'Padrão',
                'Ã\xAD': 'í',
                'Di??rio': 'Diário',
                'Cl??nico': 'Clínico'
            };

            for (const [bad, good] of Object.entries(specificFixes)) {
                if (content.includes(bad)) {
                    content = content.split(bad).join(good);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed encoding in: ' + fullPath);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Encoding fix completed.');
