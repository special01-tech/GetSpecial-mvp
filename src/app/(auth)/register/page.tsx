'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from '../layout.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Si Supabase a la confirmation email activée, pas de session immédiate
    if (data?.user && !data.session) {
      setInfo('Compte créé avec succès ! Un e-mail de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <h1 className={styles.title}>Créer un compte</h1>
      <p className={styles.subtitle}>Lancez votre marketing intelligent</p>

      {error && <div className={styles.errorMsg}>{error}</div>}
      {info && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          color: '#22c55e',
          fontSize: '14px',
          marginBottom: '20px',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          lineHeight: '1.4'
        }}>
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>Votre nom</label>
          <input
            id="name"
            type="text"
            required
            minLength={2}
            className={styles.input}
            placeholder="Jean Dupont"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            required
            className={styles.input}
            placeholder="gerant@restaurant.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            className={styles.input}
            placeholder="8 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Création…' : "S'inscrire"}
        </button>
      </form>

      <p className={styles.footer}>
        Déjà un compte ?{' '}
        <Link href="/login" className={styles.footerLink}>Se connecter</Link>
      </p>
    </>
  )
}
