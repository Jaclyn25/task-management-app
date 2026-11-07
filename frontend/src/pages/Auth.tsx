import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sun, ArrowRight, Check } from 'lucide-react'
import { api, json } from '../api'
const schema = z.object({ email: z.email('Enter a valid email address.'), password: z.string().min(1, 'Enter your password.').max(128), displayName: z.string().max(80).optional() })
export default function Auth({ register: creating = false }: {register?: boolean}) {
  const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  const navigate = useNavigate(); const client = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  async function submit(values: z.infer<typeof schema>) {
    setError('')
    if (creating && (!values.displayName?.trim() || values.password.length < 12 || !/[a-z]/.test(values.password) || !/[A-Z]/.test(values.password) || !/\d/.test(values.password) || !/[^a-zA-Z0-9]/.test(values.password))) { setError('Enter your name and a password with 12+ characters, uppercase, lowercase, a number and a symbol.'); return }
    try {
      await api(`/account/${creating ? 'register' : 'login'}`, json('POST', { ...values, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }))
      if (creating) { setSuccess('Account created. You can now sign in.'); navigate('/login') }
      else { await client.invalidateQueries({ queryKey: ['profile'] }); navigate('/') }
    } catch (e) { setError((e as Error).message) }
  }
  return <div className="auth-layout"><section className="auth-story"><Link className="brand" to="/login"><span className="brand-mark"><Sun/></span>daymark.</Link><div className="story-main"><span className="eyebrow">A CLEARER WAY FORWARD</span><h1>Good days start<br/>with a little<br/><em>direction.</em></h1><p>Bring your tasks, priorities and deadlines into one thoughtful workspace.</p><ul><li><Check size={17}/>A plan that belongs to you</li><li><Check size={17}/>Progress you can actually see</li><li><Check size={17}/>Space to focus on what matters</li></ul></div><span className="story-footer">A personal productivity workspace.</span></section><section className="auth-form"><div><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><h2>{creating ? 'Make space for progress' : 'Welcome back'}</h2><p>{creating ? 'Create your private Daymark account.' : 'A fresh perspective on everything ahead.'}</p>{success && <div className="success" role="status">{success}</div>}<form onSubmit={handleSubmit(submit)} noValidate>{creating && <label>Your name<input autoComplete="name" {...register('displayName')} aria-invalid={!!errors.displayName}/>{errors.displayName && <small className="field-error">{errors.displayName.message}</small>}</label>}<label>Email address<input type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email}/>{errors.email && <small className="field-error">{errors.email.message}</small>}</label><label>Password<input type="password" autoComplete={creating ? 'new-password' : 'current-password'} {...register('password')} aria-invalid={!!errors.password}/>{errors.password && <small className="field-error">{errors.password.message}</small>}</label>{creating && <p className="hint">12+ characters with uppercase, lowercase, a number and a symbol.</p>}{error && <div role="alert" className="error">{error}</div>}<button className="button primary" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : creating ? 'Create account' : 'Sign in'}<ArrowRight size={18}/></button></form><p className="auth-switch">{creating ? 'Already have an account?' : 'New to Daymark?'} <Link to={creating ? '/login' : '/register'} onClick={() => setError('')}>{creating ? 'Sign in' : 'Create an account'}</Link></p><p className="hint privacy">Your tasks are private to your account.</p></div></section></div>
}
