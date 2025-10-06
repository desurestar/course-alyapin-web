import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/auth'
import styles from './loginPage.module.css'

type Mode = 'login' | 'register'
type Method = 'email' | 'phone'

export const LoginPage: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const {
		loginEmail,
		loginPhone,
		register,
		error: authError,
		loading,
	} = useAuth()

	const [mode, setMode] = useState<Mode>('register')
	const [method, setMethod] = useState<Method>('email')

	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (mode === 'register' && !fullName.trim()) {
			setError('Укажите ФИО')
			return
		}
		if (method === 'email') {
			if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				setError('Введите корректный e-mail')
				return
			}
		} else {
			const clean = phone.replace(/\s|[()-]/g, '')
			if (!clean.trim() || /^\+?\d{10,15}$/.test(clean) === false) {
				setError('Введите телефон в формате +79990000000')
				return
			}
		}
		if (!password || password.length < 6) {
			setError('Пароль должен быть не короче 6 символов')
			return
		}
		if (mode === 'register' && password !== confirm) {
			setError('Пароли не совпадают')
			return
		}

		try {
			if (mode === 'login') {
				if (method === 'email') await loginEmail(email.trim(), password)
				else await loginPhone(phone.replace(/\s|[()-]/g, ''), password)
			} else {
				await register({
					full_name: fullName.trim(),
					email: method === 'email' ? email.trim() : undefined,
					phone:
						method === 'phone' ? phone.replace(/\s|[()-]/g, '') : undefined,
					password,
				})
			}
			const from = (location.state as any)?.from?.pathname || '/'
			navigate(from, { replace: true })
		} catch (e: any) {
			// error already set by context, local fallback
			if (!error) setError(e.message || 'Ошибка')
		}
	}

	const handleCantSignIn = () => {
		window.open('mailto:support@university.ru?subject=Не могу войти', '_self')
	}

	return (
		<main className={styles.page}>
			<section className={styles.card}>
				<div className={styles.tabs}>
					<button
						type='button'
						className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}
						onClick={() => setMode('login')}
						disabled={loading}
					>
						Вход
					</button>
					<button
						type='button'
						className={`${styles.tab} ${
							mode === 'register' ? styles.active : ''
						}`}
						onClick={() => setMode('register')}
						disabled={loading}
					>
						Регистрация
					</button>
				</div>

				<form className={styles.form} onSubmit={handleSubmit} noValidate>
					<div className={styles.methodSwitch}>
						<span className={styles.methodLabel}>Способ:</span>
						<label className={styles.radio}>
							<input
								type='radio'
								name='method'
								checked={method === 'email'}
								onChange={() => setMethod('email')}
								disabled={loading}
							/>
							По почте
						</label>
						<label className={styles.radio}>
							<input
								type='radio'
								name='method'
								checked={method === 'phone'}
								onChange={() => setMethod('phone')}
								disabled={loading}
							/>
							По телефону
						</label>
					</div>

					{mode === 'register' && (
						<div className={styles.field}>
							<label className={styles.label}>ФИО</label>
							<input
								className={styles.input}
								type='text'
								placeholder='Иванов Иван Иванович'
								value={fullName}
								onChange={e => setFullName(e.target.value)}
								autoComplete='name'
								disabled={loading}
							/>
						</div>
					)}

					{method === 'email' ? (
						<div className={styles.field}>
							<label className={styles.label}>E-mail</label>
							<input
								className={styles.input}
								type='email'
								placeholder='name@example.com'
								value={email}
								onChange={e => setEmail(e.target.value)}
								autoComplete='email'
								disabled={loading}
							/>
						</div>
					) : (
						<div className={styles.field}>
							<label className={styles.label}>Телефон</label>
							<input
								className={styles.input}
								type='tel'
								placeholder='+7 999 000 00 00'
								inputMode='tel'
								value={phone}
								onChange={e => setPhone(e.target.value)}
								autoComplete='tel'
								disabled={loading}
							/>
						</div>
					)}

					<div className={styles.field}>
						<label className={styles.label}>Пароль</label>
						<input
							className={styles.input}
							type='password'
							placeholder='Пароль'
							value={password}
							onChange={e => setPassword(e.target.value)}
							autoComplete={
								mode === 'register' ? 'new-password' : 'current-password'
							}
							disabled={loading}
						/>
					</div>

					{mode === 'register' && (
						<div className={styles.field}>
							<label className={styles.label}>Повторите пароль</label>
							<input
								className={styles.input}
								type='password'
								placeholder='Повтор пароля'
								value={confirm}
								onChange={e => setConfirm(e.target.value)}
								autoComplete='new-password'
								disabled={loading}
							/>
						</div>
					)}

					{(error || authError) && (
						<div className={styles.error}>{error || authError}</div>
					)}

					<div className={styles.actions}>
						<button type='submit' className={styles.submit} disabled={loading}>
							{loading
								? 'Подождите...'
								: mode === 'register'
								? 'Зарегистрироваться'
								: 'Войти'}
						</button>
						<button
							type='button'
							className={styles.linkBtn}
							onClick={handleCantSignIn}
							disabled={loading}
						>
							Не можете войти?
						</button>
					</div>
				</form>
			</section>
		</main>
	)
}
