import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get the listing (only the owner can verify)
  const { data: listing } = await supabase
    .from('listings')
    .select('domain_name, verify_token, seller_id')
    .eq('id', id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.seller_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // DNS TXT lookup via Google DNS-over-HTTPS (free, no API key)
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(listing.domain_name)}&type=TXT`,
      { headers: { Accept: 'application/dns-json' } }
    )
    const dns = await res.json()

    // dns.Answer is an array of DNS records. TXT records have type 16.
    const txtRecords: string[] = (dns.Answer ?? [])
      .filter((r: { type: number }) => r.type === 16)
      .map((r: { data: string }) => r.data.replace(/"/g, '').trim())

    console.log('verify_token from DB:', listing.verify_token)
    console.log('TXT records found:', txtRecords)

    const verified = txtRecords.some((txt) => txt.includes(listing.verify_token))

    if (verified) {
      await supabase
        .from('listings')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', id)
    }

    return NextResponse.json({ verified, txtRecords })
  } catch {
    return NextResponse.json({ error: 'DNS lookup failed' }, { status: 500 })
  }
}
