/**
 * Script de Migração para Cloudinary
 * 
 * Migra imagens de Firebase e Supabase para Cloudinary
 * - Apenas produtos ATIVOS (deleted_at IS NULL)
 * - Organiza em pasta leoiphone/produtos/{produto_id}/
 * - Gera backup das URLs antigas para reversão
 * - Atualiza banco de dados após upload bem-sucedido
 */

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Tipos
interface Produto {
  id: string;
  nome: string;
  foto_principal: string | null;
  fotos: string[] | null;
}

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

interface MigrationResult {
  success: boolean;
  produtoId: string;
  produtoNome: string;
  imagesUploaded: number;
  imagesFailed: number;
  errors: string[];
  urlMapping: Record<string, string>;
}

// Diretório de backups
const BACKUP_DIR = path.join(process.cwd(), 'scripts', 'backups');

// Função para identificar origem da URL
function getUrlOrigin(url: string): 'firebase' | 'supabase' | 'cloudinary' | 'unknown' {
  if (url.includes('firebasestorage.googleapis.com')) return 'firebase';
  if (url.includes('supabase.co/storage')) return 'supabase';
  if (url.includes('cloudinary.com')) return 'cloudinary';
  return 'unknown';
}

// Função para fazer upload de uma imagem para Cloudinary
async function uploadToCloudinary(
  imageUrl: string,
  publicId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Ignora se já está no Cloudinary
    if (getUrlOrigin(imageUrl) === 'cloudinary') {
      return { success: true, url: imageUrl };
    }

    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: 'leoiphone/produtos',
      overwrite: true,
      resource_type: 'image',
      // Transforma para WebP otimizado no upload
      format: 'webp',
      quality: 'auto:good',
      fetch_format: 'auto',
    });

    return { success: true, url: result.secure_url };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ Erro ao fazer upload: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// Função para migrar um produto
async function migrateProduto(produto: Produto): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    produtoId: produto.id,
    produtoNome: produto.nome,
    imagesUploaded: 0,
    imagesFailed: 0,
    errors: [],
    urlMapping: {},
  };

  const urlsToMigrate: { url: string; type: 'principal' | 'foto'; index?: number }[] = [];

  // Coleta URLs para migrar (apenas as que NÃO são do Cloudinary)
  if (produto.foto_principal && getUrlOrigin(produto.foto_principal) !== 'cloudinary') {
    urlsToMigrate.push({ url: produto.foto_principal, type: 'principal' });
  }

  if (produto.fotos && Array.isArray(produto.fotos)) {
    produto.fotos.forEach((url, index) => {
      if (url && getUrlOrigin(url) !== 'cloudinary') {
        urlsToMigrate.push({ url, type: 'foto', index });
      }
    });
  }

  if (urlsToMigrate.length === 0) {
    console.log(`  ⏭️  Produto já migrado ou sem imagens`);
    return result;
  }

  // Processa cada URL
  for (const item of urlsToMigrate) {
    // Gera public_id único
    const publicId =
      item.type === 'principal'
        ? `${produto.id}/principal`
        : `${produto.id}/${item.index}`;

    console.log(`  📤 Migrando: ${item.type === 'principal' ? 'foto_principal' : `foto[${item.index}]`}`);

    const uploadResult = await uploadToCloudinary(item.url, publicId);

    if (uploadResult.success && uploadResult.url) {
      result.urlMapping[item.url] = uploadResult.url;
      result.imagesUploaded++;
    } else {
      result.imagesFailed++;
      result.errors.push(`${item.type}[${item.index ?? 0}]: ${uploadResult.error}`);
      result.success = false;
    }
  }

  return result;
}

// Função para atualizar produto no banco
async function updateProdutoUrls(
  produtoId: string,
  urlMapping: Record<string, string>,
  originalFotoPrincipal: string | null,
  originalFotos: string[] | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const newFotoPrincipal = originalFotoPrincipal
      ? urlMapping[originalFotoPrincipal] || originalFotoPrincipal
      : null;

    const newFotos = originalFotos
      ? originalFotos.map((url) => urlMapping[url] || url)
      : null;

    const { error } = await supabase
      .from('produtos')
      .update({
        foto_principal: newFotoPrincipal,
        fotos: newFotos,
      })
      .eq('id', produtoId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando migração para Cloudinary...\n');
  console.log('📁 Pasta destino: leoiphone/produtos/\n');

  // Cria diretório de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Busca produtos ativos
  console.log('📊 Buscando produtos ativos...');
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, nome, foto_principal, fotos')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    process.exit(1);
  }

  if (!produtos || produtos.length === 0) {
    console.log('⚠️  Nenhum produto ativo encontrado');
    process.exit(0);
  }

  console.log(`✅ Encontrados ${produtos.length} produtos ativos\n`);

  // Prepara backup
  const backup: MigrationBackup = {
    timestamp: new Date().toISOString(),
    produtos: [],
  };

  // Estatísticas
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalImagesUploaded = 0;
  let totalImagesFailed = 0;

  // Processa cada produto
  for (let i = 0; i < produtos.length; i++) {
    const produto = produtos[i] as Produto;
    console.log(`\n[${i + 1}/${produtos.length}] 📦 ${produto.nome}`);

    // Migra imagens
    const result = await migrateProduto(produto);

    if (result.imagesUploaded > 0) {
      // Atualiza banco de dados
      console.log(`  💾 Atualizando banco de dados...`);
      const updateResult = await updateProdutoUrls(
        produto.id,
        result.urlMapping,
        produto.foto_principal,
        produto.fotos
      );

      if (updateResult.success) {
        totalSuccess++;
        totalImagesUploaded += result.imagesUploaded;
        console.log(`  ✅ Migrado com sucesso (${result.imagesUploaded} imagens)`);

        // Adiciona ao backup
        backup.produtos.push({
          id: produto.id,
          nome: produto.nome,
          original: {
            foto_principal: produto.foto_principal,
            fotos: produto.fotos,
          },
          migrated: {
            foto_principal: produto.foto_principal
              ? result.urlMapping[produto.foto_principal] || produto.foto_principal
              : null,
            fotos: produto.fotos
              ? produto.fotos.map((url) => result.urlMapping[url] || url)
              : null,
          },
        });
      } else {
        totalFailed++;
        totalImagesFailed += result.imagesUploaded;
        console.log(`  ❌ Erro ao atualizar banco: ${updateResult.error}`);
      }
    } else if (result.imagesFailed > 0) {
      totalFailed++;
      totalImagesFailed += result.imagesFailed;
      console.log(`  ❌ Falha na migração: ${result.errors.join(', ')}`);
    } else {
      // Sem imagens para migrar
      totalSuccess++;
    }

    // Pequena pausa para não sobrecarregar APIs
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Salva backup
  const backupFileName = `cloudinary-migration-${Date.now()}.json`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  // Relatório final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RELATÓRIO DE MIGRAÇÃO');
  console.log('='.repeat(50));
  console.log(`\n✅ Produtos migrados com sucesso: ${totalSuccess}`);
  console.log(`❌ Produtos com falha: ${totalFailed}`);
  console.log(`📤 Total de imagens migradas: ${totalImagesUploaded}`);
  console.log(`⚠️  Imagens com falha: ${totalImagesFailed}`);
  console.log(`\n💾 Backup salvo em: ${backupPath}`);
  console.log('\n📝 Para reverter a migração, execute:');
  console.log(`   npx tsx scripts/revert-cloudinary-migration.ts ${backupFileName}\n`);
}

main().catch(console.error);
