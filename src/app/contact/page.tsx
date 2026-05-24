'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Clock, Facebook, Instagram, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function ContactPage() {
  const t = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    // Simulate sending message
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.success('Message sent successfully! We will get back to you soon.')
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    })
    setLoading(false)
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Address',
      content: 'Tbilisi, Georgia',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+995 555 123 456',
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'info@bepa.ge',
    },
    {
      icon: Clock,
      title: 'Working Hours',
      content: 'Mon - Sat: 10:00 - 19:00',
    },
  ]

  return (
    <div className="container py-10 sm:py-12">
      {/* Header */}
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">BEPA</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-slate-950">{t('contact')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
          Have a question or need assistance? We&apos;re here to help! Fill out the form below or reach out to us directly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="lg:col-span-1">
          <div className="rounded-[2rem] border border-white/70 bg-white/86 p-6 shadow-[0_20px_64px_-44px_rgba(15,23,42,0.48)] backdrop-blur-xl">
          <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">Get in touch</h2>
          <div className="mt-6 space-y-5">
            {contactInfo.map((info) => {
              const Icon = info.icon
              return (
                <div key={info.title} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950">{info.title}</h3>
                    <p className="text-sm leading-6 text-slate-500">{info.content}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Social Links */}
          <div className="mt-8">
            <h3 className="font-medium mb-4">Follow Us</h3>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="rounded-[2rem] border border-white/70 bg-white/86 p-6 shadow-[0_20px_64px_-44px_rgba(15,23,42,0.48)] backdrop-blur-xl md:p-8">
            <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">Send us a message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 rounded-xl bg-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 rounded-xl bg-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-11 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="h-11 rounded-xl bg-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="rounded-xl bg-white"
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="rounded-full" disabled={loading}>
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="mt-8">
        <div className="flex h-[22rem] items-center justify-center rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_20px_64px_-44px_rgba(15,23,42,0.48)] backdrop-blur-xl">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
            <p className="text-muted-foreground">Map integration coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
