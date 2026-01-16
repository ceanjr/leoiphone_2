/**
 * Script para reverter migração do Cloudinary
 * 
 * Restaura URLs originais (Firebase/Supabase) a partir do backup
 * Uso: npx tsx scripts/revert-cloudinary-migration.ts <nome-do-backup.json>
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MigrationBackup {
  timestamp: string;
  produtos: {
    id: string;
    nome: string;
    original: {
      foto_principal: string | null;
      fotos: string[] | null;
    };
    migrated: {
      foto_principal: string | null;
      fotos: string[] | null;
    };
  }[];
}

async function main() {
  const backupFileName = process.argv[2];

  if (!backupFileName) {
    console.error('❌ Uso: npx tsx scripts/revert-cloudinary-migration.ts <nome-do-backup.json>');
    console.log('\n📁 Backups disponíveis:');
    
    const backupDir = path.join(process.cwd(), 'scripts', 'backups');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter(f => f.startsWith('cloudinary-migration-'));
      files.forEach(f => console.log(`   - ${f}`));
    }
    process.exit(1);
  }

  const backupPath = path.join(process.cwd(), 'scripts', 'backups', backupFileName);

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Arquivo de backup não encontrado: ${backupPath}`);
    process.exit(1);
  }

  console.log('🔄 Iniciando reversão da migração...\n');
  console.log(`📁 Usando backup: ${backupFileName}\n`);

  const backup: MigrationBackup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  console.log(`📊 Backup criado em: ${backup.timestamp}`);
  console.log(`📦 Produtos para reverter: ${backup.produtos.length}\n`);

  let success = 0;
  let failed = 0;

  for (const produto of backup.produtos) {
    console.log(`🔄 Revertendo: ${produto.nome}...`);

    const { error } = await supabase
      .from('produtos')
      .update({
        foto_principal: produto.original.foto_principal,
        fotos: produto.original.fotos,
      })
      .eq('id', produto.id);

    if (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      failed++;
    } else {
      console.log(`   ✅ Revertido`);
      success++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RELATÓRIO DE REVERSÃO');
  console.log('='.repeat(50));
  console.log(`\n✅ Produtos revertidos: ${success}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log('\n⚠️  Nota: As imagens no Cloudinary NÃO foram removidas.');
  console.log('    Para remover, acesse o painel do Cloudinary.\n');
}

main().catch(console.error);
