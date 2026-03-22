'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

const CATEGORIES = ['tech', 'finance', 'health', 'ecommerce', 'other']

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('listings').select('*').eq('id', id).single().then(({ data }) => setListing(data))
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    const priceStr = data.get('asking_price') as string
    const askingPrice = priceStr ? Math.round(parseFloat(priceStr) * 100) : null

    const { error: err } = await supabase
      .from('listings')
      .update({
        asking_price: askingPrice,
        description: data.get('description') as string,
        category: data.get('category') as string,
        contact_email: data.get('contact_email') as string,
      })
      .eq('id', id)

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/listings/${id}`)
  }

  if (!listing) return <div className="text-gray-400 py-20 text-center">Loading...</div>

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Edit {listing.domain_name}</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asking_price">Asking Price (USD)</Label>
              <Input
                id="asking_price"
                name="asking_price"
                type="number"
                min="1"
                step="1"
                defaultValue={listing.asking_price ? listing.asking_price / 100 : ''}
                placeholder="Leave blank for price on request"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                required
                defaultValue={listing.category}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={listing.description} rows={3} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input id="contact_email" name="contact_email" type="email" defaultValue={listing.contact_email} required />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
