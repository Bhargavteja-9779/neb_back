import fs from 'fs';
import path from 'path';

const directory = 'c:/Users/Harsh/Downloads/NebulaAI/nebula-frontend/src';

function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Remove text gradients
            content = content.replace(/bg-clip-text text-transparent bg-gradient-to-r from-[a-z]+-\d+ (via-[a-z]+-\d+ )?to-[a-z]+-\d+/g, 'text-brand');
            
            // Replace glowing drop shadows
            content = content.replace(/shadow-\[0_0_[0-9]+px_rgba\([^)]+\)\]/g, '');
            content = content.replace(/shadow-\[0_4px_[0-9]+px_rgba\([^)]+\)\]/g, 'shadow-md');
            content = content.replace(/shadow-\[inner_0_0_[0-9]+px_rgba\([^)]+\)\]/g, 'shadow-inner');

            // Replace neon text colors with brand or neutral
            content = content.replace(/text-(blue|cyan|emerald|purple|violet|amber|red)-(400|500|600)/g, 'text-brand');
            content = content.replace(/text-(blue|cyan|emerald|purple|violet|amber|red)-(300|200)/g, 'text-gray-300');

            // Replace border colors
            content = content.replace(/border-(blue|cyan|emerald|purple|violet|amber|red)-[0-9]+\/[0-9]+/g, 'border-brand/20');

            // Replace backgrounds
            content = content.replace(/bg-(blue|cyan|emerald|purple|violet|amber|red)-[0-9]+\/[0-9]+/g, 'bg-brand/10');
            content = content.replace(/bg-(blue|cyan|emerald|purple|violet|amber|red)-(500|600)/g, 'bg-brand text-[#141413]');
            content = content.replace(/bg-gradient-to-[a-z]{1,2} from-[a-z]+-\d+ to-[a-z]+-\d+/g, 'bg-brand/10');

            // Specific overrides for button text contrasts and #0A0F1C
            content = content.replace(/#0A0F1C/g, '#1A1A19');
            content = content.replace(/#0F172A/g, '#20201F');
            content = content.replace(/#0B1220/g, '#1A1A19');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    });
}

processDirectory(directory);
console.log("Colors stripped and replaced with brand.");
