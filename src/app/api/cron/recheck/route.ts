import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkDns(domainName: string, verifyToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domainName)}&type=TXT`,
      { headers: { Accept: 'application/dns-json' } }
    )
    const dns = await res.json()
    const txtRecords: string[] = (dns.Answer ?? [])
      .filter((r: { type: number }) => r.type === 16)
      .map((r: { data: string }) => r.data.replace(/"/g, '').trim())
    return txtRecords.some((txt) => txt.includes(verifyToken))
  } catch {
    return true // DNS lookup failed — keep listing live, don't penalise seller
  }
}

export async function GET(request: Request) {
  // Protect the cron route — Vercel sends this header automatically
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all verified listings
  const { data: listings } = await supabase
    .from('listings')
    .select('id, domain_name, verify_token')
    .eq('status', 'verified')

  if (!listings?.length) return NextResponse.json({ checked: 0 })

  let revoked = 0

  // Check each listing in parallel
  const results = await Promise.all(
    listings.map(async (listing) => {
      const stillOwned = await checkDns(listing.domain_name, listing.verify_token)
      return { id: listing.id, stillOwned }
    })
  )

  // Revert any that failed
  const toRevoke = results.filter((r) => !r.stillOwned).map((r) => r.id)
  if (toRevoke.length > 0) {
    await supabase
      .from('listings')
      .update({ status: 'pending_verification', verified_at: null })
      .in('id', toRevoke)
    revoked = toRevoke.length
  }

  console.log(`Cron recheck: ${listings.length} checked, ${revoked} revoked`)
  return NextResponse.json({ checked: listings.length, revoked })
}
