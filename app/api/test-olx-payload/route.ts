import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { produtoToOlxAdvert } from '@/lib/olx/api-client'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://leoiphone.com.br'

export async function POST(request: Request) {
  try {
    const { produto_id } = await request.json()

    const supabase = await createClient()

    // Buscar produto
    const { data: produto, error: produtoError } = await (supabase
      .from('produtos')
      .select('*')
      .eq('id', produto_id)
      .single() as any)

    if (produtoError || !produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Converter para formato OLX
    const config = { access_token: 'test_token_placeholder' }
    const olxAdvert = produtoToOlxAdvert(produto, SITE_URL, config.access_token)

    return NextResponse.json({
      produto: {
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        foto_principal: produto.foto_principal,
        fotos: produto.fotos,
        descricao: produto.descricao,
        cor: produto.cor,
        armazenamento: produto.armazenamento,
        condicao: produto.condicao,
        nivel_bateria: produto.nivel_bateria,
      },
      olxPayload: olxAdvert,
      validation: {
        hasAccessToken: !!olxAdvert.access_token,
        hasAdList: !!olxAdvert.ad_list && olxAdvert.ad_list.length > 0,
        adCount: olxAdvert.ad_list?.length || 0,
        firstAd: olxAdvert.ad_list?.[0] ? {
          hasId: !!olxAdvert.ad_list[0].id,
          hasTitle: !!olxAdvert.ad_list[0].subject && olxAdvert.ad_list[0].subject.length > 0,
          titleLength: olxAdvert.ad_list[0].subject?.length || 0,
          hasBody: !!olxAdvert.ad_list[0].body && olxAdvert.ad_list[0].body.length > 0,
          bodyLength: olxAdvert.ad_list[0].body?.length || 0,
          hasPrice: !!olxAdvert.ad_list[0].price && olxAdvert.ad_list[0].price > 0,
          price: olxAdvert.ad_list[0].price || 0,
          hasCategory: !!olxAdvert.ad_list[0].category,
          category: olxAdvert.ad_list[0].category,
          hasZipcode: !!olxAdvert.ad_list[0].zipcode,
          zipcode: olxAdvert.ad_list[0].zipcode,
          hasImages: !!olxAdvert.ad_list[0].images && olxAdvert.ad_list[0].images.length > 0,
          imageCount: olxAdvert.ad_list[0].images?.length || 0,
          images: olxAdvert.ad_list[0].images || [],
        } : null,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
