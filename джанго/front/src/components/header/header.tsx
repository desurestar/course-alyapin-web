import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/auth'
import styles from './header.module.css'

interface HeaderProps {
	universityName: string
	logoUrl?: string
	showSearch?: boolean
	onSearch?: (query: string) => void
}

const MAIN_LINKS = [
	{ label: 'Главная', to: '/' },
	{ label: 'Проекты', to: '/projects' },
	{ label: 'Публикации', to: '/publications' },
	{ label: 'Гранты', to: '/grants' },
]

export const Header: React.FC<HeaderProps> = ({
	universityName,
	logoUrl,
	showSearch = false,
	onSearch,
}) => {
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [searchQuery, setSearchQuery] = useState('')

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		const q = searchQuery.trim()
		if (q) onSearch?.(q)
	}

	return (
		<header className={styles.departmentHeader}>
			<div className={styles.departmentMainHeader}>
				<div className={styles.container}>
					<div className={styles.departmentBrand}>
						{logoUrl && (
							<img
								className={styles.brandLogo}
								src={logoUrl}
								alt={universityName}
								loading='lazy'
							/>
						)}
						<div className={styles.brandText}>
							<h1 className={styles.brandDepartment}>{universityName}</h1>
						</div>
					</div>

					<nav className={styles.primaryNav} aria-label='Основная навигация'>
						<ul className={styles.navList}>
							{MAIN_LINKS.map(l => (
								<li key={l.to} className={styles.navItem}>
									<NavLink
										to={l.to}
										className={({ isActive }) =>
											`${styles.navLink} ${isActive ? styles.active : ''}`
										}
										onClick={() => {
											/* close mobile if implemented later */
										}}
										end={l.to === '/'}
									>
										{l.label}
									</NavLink>
								</li>
							))}
						</ul>
					</nav>

					<div className={styles.headerActions}>
						{showSearch && (
							<form
								className={styles.searchForm}
								onSubmit={handleSearch}
								role='search'
							>
								<input
									type='search'
									className={styles.searchInput}
									placeholder='Поиск'
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
								/>
								<button type='submit' className={styles.searchBtn}>
									Найти
								</button>
							</form>
						)}
						<button
							type='button'
							className={`${styles.iconBtn} ${styles.profileBtn}`}
							title='Профиль'
							aria-label='Профиль'
							onClick={() => navigate(`/profile/${user?.id ?? 1}`)}
						>
							<svg viewBox='0 0 24 24' aria-hidden='true'>
								<path d='M12 12c2.761 0 5-2.686 5-6s-2.239-6-5-6-5 2.686-5 6 2.239 6 5 6zm0 2c-4.418 0-8 2.916-8 6.515C4 22.873 5.127 24 6.485 24h11.03C18.873 24 20 22.873 20 20.515 20 16.916 16.418 14 12 14z' />
							</svg>
						</button>
						<button
							type='button'
							className={`${styles.iconBtn} ${styles.logoutBtn}`}
							onClick={() => {
								logout()
								navigate('/login', { replace: true })
							}}
						>
							<svg viewBox='0 0 24 24' aria-hidden='true'>
								<path d='M16 17v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v2M10 17l5-5-5-5M15 12H3' />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</header>
	)
}
