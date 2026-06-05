const fs = require('fs');
const file = 'src/pages/Eventos.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the <Tooltip content={<CustomTooltip />} /> with Tooltip + Legend
content = content.replace(/<Tooltip content={<CustomTooltip \/>} \/>\s*<\/PieChart>/g, '<Tooltip content={<CustomTooltip />} />\n                    <Legend wrapperStyle={{ fontSize: "10px" }} />\n                  </PieChart>');

// Remove the old custom HTML legend
content = content.replace(/<div className="flex flex-wrap gap-2 mt-2">[\s\S]*?<\/div>\s*<\/CardContent>/g, '</CardContent>');

fs.writeFileSync(file, content, 'utf8');
