import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/auth'
import styles from './header.module.css'

export interface NavItem {
	id: number
	label: string
	path: string
	subItems?: NavItem[]
}

interface HeaderProps {
	departmentName: string
	universityName: string
	logoUrl?: string
	navItems: NavItem[]
	onNavItemClick?: (path: string) => void
	showSearch?: boolean
	onSearch?: (query: string) => void
}

export const Header: React.FC<HeaderProps> = ({
	universityName,
	logoUrl, // не используем, оставлено в типе для совместимости
	navItems,
	onNavItemClick,
	showSearch = true,
	onSearch,
}) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const navigate = useNavigate()
	const { userId, logout } = useAuth()

	const handleNavClick = (path: string) => {
		navigate(path) // переход по пунктам меню, включая «Публикации»
		onNavItemClick?.(path)
		setIsMobileMenuOpen(false)
		setActiveSubmenu(null)
	}

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		const q = searchQuery.trim()
		if (q) onSearch?.(q)
	}

	const toggleSubmenu = (id: number) => {
		setActiveSubmenu(prev => (prev === id ? null : id))
	}

	return (
		<header className={styles.departmentHeader}>
			<div className={styles.departmentMainHeader}>
				<div className={styles.container}>
					<div className={styles.departmentBrand}>
						{/* логотип + название института */}
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
									placeholder='Поиск по сайту'
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
								/>
								<button type='submit' className={styles.searchBtn}>
									Найти
								</button>
							</form>
						)}

						{/* Профиль */}
						<button
							type='button'
							className={`${styles.iconBtn} ${styles.profileBtn}`}
							title='Профиль'
							aria-label='Профиль'
							onClick={() => navigate(`/profile/${userId ?? 1}`)}
						>
							<svg viewBox='0 0 24 24' aria-hidden='true'>
								<path d='M12 12c2.761 0 5-2.686 5-6s-2.239-6-5-6-5 2.686-5 6 2.239 6 5 6zm0 2c-4.418 0-8 2.916-8 6.515C4 22.873 5.127 24 6.485 24h11.03C18.873 24 20 22.873 20 20.515 20 16.916 16.418 14 12 14z' />
							</svg>
						</button>

						{/* Выход */}
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

						<button
							className={`${styles.mobileToggle} ${
								isMobileMenuOpen ? styles.isOpen : ''
							}`}
							onClick={() => setIsMobileMenuOpen(v => !v)}
							aria-label='Меню'
							aria-expanded={isMobileMenuOpen}
						>
							<span />
							<span />
							<span />
						</button>
					</div>
				</div>
			</div>

			<nav
				className={`${styles.departmentNav} ${
					isMobileMenuOpen ? styles.navOpen : ''
				}`}
			>
				<div className={styles.container}>
					<ul className={styles.navList}>
						{navItems.map(item => (
							<li
								key={item.id}
								className={`${styles.navItem} ${
									item.subItems?.length ? styles.hasSub : ''
								}`}
							>
								{item.subItems?.length ? (
									<>
										<button
											className={`${styles.navLink} ${styles.submenuToggle}`}
											onClick={() => toggleSubmenu(item.id)}
											aria-expanded={activeSubmenu === item.id}
										>
											{item.label}
											<span
												className={`${styles.caret} ${
													activeSubmenu === item.id ? styles.caretOpen : ''
												}`}
											/>
										</button>
										<ul
											className={`${styles.submenu} ${
												activeSubmenu === item.id ? styles.submenuOpen : ''
											}`}
										>
											{item.subItems.map(si => (
												<li key={si.id} className={styles.submenuItem}>
													<a
														href={si.path}
														className={styles.submenuLink}
														onClick={e => {
															e.preventDefault()
															handleNavClick(si.path)
														}}
													>
														{si.label}
													</a>
												</li>
											))}
										</ul>
									</>
								) : (
									<a
										href={item.path}
										className={styles.navLink}
										onClick={e => {
											e.preventDefault()
											handleNavClick(item.path)
										}}
									>
										{item.label}
									</a>
								)}
							</li>
						))}
					</ul>
				</div>
			</nav>
		</header>
	)
}
