const fs = require('fs');

const path = 'components/financial-manager.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
  'Ã§Ã£': 'çã',
  'Ã§Ãµ': 'çõ',
  'Ã£': 'ã',
  'Ãµ': 'õ',
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ãª': 'ê',
  'Ã¢': 'â',
  'Ã§': 'ç',
  'Ã ': 'À',
  'Ã‰': 'É',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ã\x8D': 'Í', // Ã followed by 141 (often represented as \x8d)
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

// Some specific ones that might have space or weird boundaries
content = content.replace(/DescriÃ§Ã£o/g, 'Descrição');
content = content.replace(/CompetÃªncia/g, 'Competência');
content = content.replace(/AÃ§Ã£o/g, 'Ação');
content = content.replace(/MÃªs/g, 'Mês');
content = content.replace(/SaÃ­da/g, 'Saída');
content = content.replace(/ExcluÃ­da/g, 'Excluída');
content = content.replace(/SincronizaÃ§Ã£o/g, 'Sincronização');
content = content.replace(/RelatÃ³rio/g, 'Relatório');
content = content.replace(/ConcluÃ­da/g, 'Concluída');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed encoding in', path);
