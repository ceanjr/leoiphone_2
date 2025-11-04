#!/usr/bin/env node

/**
 * Script para substituir console.* por logger.* em arquivos TypeScript/TSX
 * 
 * Uso: node scripts/replace-console-logger.js
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['app', 'lib', 'components', 'hooks'];
const LOGGER_IMPORT = "import { logger } from '@/lib/utils/logger'";
const SKIP_FILES = ['logger.ts', 'logger.js'];

function shouldSkipFile(filePath) {
  return SKIP_FILES.some(skip => filePath.includes(skip));
}

function hasConsoleStatements(content) {
  return /console\.(log|error|warn|info|debug)/.test(content);
}

function hasLoggerImport(content) {
  return content.includes("from '@/lib/utils/logger'") || 
         content.includes('from "@/lib/utils/logger"');
}

function addLoggerImport(content) {
  // Se já tem o import, não adicionar
  if (hasLoggerImport(content)) {
    return content;
  }

  const lines = content.split('\n');
  let insertIndex = 0;

  // Procurar por 'use server' ou 'use client'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "'use server'" || line === '"use server"' || 
        line === "'use client'" || line === '"use client"') {
      insertIndex = i + 1;
      break;
    }
  }

  // Se não encontrou, procurar pela última linha de import
  if (insertIndex === 0) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      } else if (insertIndex > 0) {
        break;
      }
    }
  }

  // Inserir o import
  lines.splice(insertIndex, 0, LOGGER_IMPORT);
  return lines.join('\n');
}

function replaceConsoleWithLogger(content) {
  return content
    .replace(/console\.log\(/g, 'logger.log(')
    .replace(/console\.error\(/g, 'logger.error(')
    .replace(/console\.warn\(/g, 'logger.warn(')
    .replace(/console\.info\(/g, 'logger.info(')
    .replace(/console\.debug\(/g, 'logger.debug(');
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (!hasConsoleStatements(content)) {
    return false;
  }

  // Adicionar import se necessário
  if (!hasLoggerImport(content)) {
    content = addLoggerImport(content);
  }

  // Substituir console por logger
  content = replaceConsoleWithLogger(content);

  // Escrever arquivo
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Pular node_modules e .next
      if (file !== 'node_modules' && file !== '.next') {
        walkDirectory(filePath, fileList);
      }
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  console.log('🔄 Substituindo console por logger...\n');

  let totalProcessed = 0;
  let totalFiles = 0;

  for (const dir of DIRECTORIES) {
    const dirPath = path.join(process.cwd(), dir);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Diretório ${dir}/ não encontrado, pulando...`);
      continue;
    }

    console.log(`📁 Processando ${dir}/...`);
    const files = walkDirectory(dirPath);
    totalFiles += files.length;

    let processed = 0;
    for (const file of files) {
      if (processFile(file)) {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`  ✅ ${relativePath}`);
        processed++;
      }
    }

    totalProcessed += processed;
    console.log(`  ${processed} arquivo(s) modificado(s) em ${dir}/\n`);
  }

  console.log('='.repeat(60));
  console.log(`✅ Concluído!`);
  console.log(`📊 Total de arquivos processados: ${totalProcessed} de ${totalFiles}`);
  console.log('='.repeat(60));
}

main();
