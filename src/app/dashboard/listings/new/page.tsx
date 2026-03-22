'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CATEGORIES = ['tech', 'finance', 'health', 'ecommerce', 'other']

function generateVerifyToken() {
  return `domainmarket-verify=${crypto.randomUUID()}`
}

export default function NewListingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = new FormData(form)
    const domainName = (data.get('domain_name') as string).toLowerCase().trim()
    const priceStr = data.get('asking_price') as string
    const askingPrice = priceStr ? Math.round(parseFloat(priceStr) * 100) : null

    // Basic domain format check
    const domainRegex = /^[a-z0-9][a-z0-9-]{0,61}(\.[a-z]{2,})+$/
    if (!domainRegex.test(domainName)) {
      setError('Enter a valid domain name (e.g. example.com)')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    const { data: listing, error: err } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        domain_name: domainName,
        asking_price: askingPrice,
        description: data.get('description') as string,
        category: data.get('category') as string,
        contact_email: data.get('contact_email') as string,
        verify_token: generateVerifyToken(),
        status: 'pending_verification',
      })
      .select()
      .single()

    if (err) {
      setError(err.message.includes('unique') ? 'This domain is already listed.' : err.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/listings/${listing.id}`)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">List a Domain</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="domain_name">Domain Name *</Label>
              <Input id="domain_name" name="domain_name" placeholder="example.com" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asking_price">Asking Price (USD) — leave blank for "Price on request"</Label>
              <Input id="asking_price" name="asking_price" type="number" min="1" step="1" placeholder="e.g. 5000" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Why is this domain valuable? Traffic, age, keywords..." rows={3} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input id="contact_email" name="contact_email" type="email" placeholder="you@example.com" required />
              <p className="text-xs text-gray-500">Buyers will use this email to reach you</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Listing'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
