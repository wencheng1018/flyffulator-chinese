import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, 'public', 'data', 'Items.json');
const backupPath = path.join(__dirname, 'public', 'data', 'Items_backup.json');
const outputPath = path.join(__dirname, 'public', 'data', 'Items.json');

console.log('正在备份原文件...');
fs.copyFileSync(inputPath, backupPath);

console.log('正在读取 Items.json...');
const rawData = fs.readFileSync(backupPath, 'utf8');
const items = JSON.parse(rawData);

console.log('正在精简数据...');
const simplifiedItems = {};
let totalItems = 0;

for (const [id, item] of Object.entries(items)) {
    totalItems++;
    
    // 创建精简的物品对象
    const simplifiedItem = { ...item };
    
    // 只保留简体中文名称
    if (simplifiedItem.name) {
        simplifiedItem.name = simplifiedItem.name.cns || simplifiedItem.name.tw || simplifiedItem.name.en;
    }
    
    // 只保留简体中文描述（如果有）
    if (simplifiedItem.description) {
        simplifiedItem.description = simplifiedItem.description.cns || simplifiedItem.description.tw || simplifiedItem.description.en;
    }
    
    simplifiedItems[id] = simplifiedItem;
}

console.log(`正在写入精简后的文件...`);
fs.writeFileSync(outputPath, JSON.stringify(simplifiedItems, null, 2), 'utf8');

// 获取文件大小
const originalSize = fs.statSync(backupPath).size;
const simplifiedSize = fs.statSync(outputPath).size;
const sizeReduction = ((1 - simplifiedSize / originalSize) * 100).toFixed(2);

console.log(`
完成！
- 处理了 ${totalItems} 个物品
- 原始大小: ${(originalSize / 1024 / 1024).toFixed(2)} MB
- 精简后大小: ${(simplifiedSize / 1024 / 1024).toFixed(2)} MB
- 减少了: ${sizeReduction}%

备份文件已保存为: Items_backup.json
`);
