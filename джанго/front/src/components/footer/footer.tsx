import React from 'react'
import styles from './footer.module.css'

// Типы для контактной информации
interface ContactInfo {
	address: string
	phone: string
	email: string
	fax?: string
}

// Типы для социальных сетей
interface SocialLink {
	id: number
	name: string
	url: string
	icon: string
}

// Типы для быстрых ссылок
interface QuickLink {
	id: number
	label: string
	url: string
}

// Типы для партнеров
interface Partner {
	id: number
	name: string
	url: string
	logoUrl: string
}

// Пропсы компонента Footer
interface FooterProps {
	departmentName: string
	universityName: string
	contactInfo: ContactInfo
	socialLinks?: SocialLink[]
	quickLinks?: QuickLink[]
	partners?: Partner[]
	copyrightText?: string
	onLinkClick?: (url: string) => void
}

export const Footer: React.FC<FooterProps> = ({
	departmentName,
	universityName,
	contactInfo,
	socialLinks = [],
	quickLinks = [],
	partners = [],
	copyrightText,
	onLinkClick,
}) => {
	const currentYear = new Date().getFullYear()

	const handleLinkClick = (url: string, e: React.MouseEvent) => {
		e.preventDefault()
		if (onLinkClick) {
			onLinkClick(url)
		}
	}

	return (
		<footer className={styles.departmentFooter}>
			<div className={styles.footerContent}>
				{/* Основная информация */}
				<div className={`${styles.footerSection} ${styles.footerMain}`}>
					<div className={styles.footerBrand}>
						<h3 className={styles.footerDepartmentName}>{departmentName}</h3>
						<p className={styles.footerUniversityName}>{universityName}</p>
					</div>

					<div className={styles.footerContacts}>
						<div className={styles.contactItem}>
							<span className={styles.contactIcon}>📍</span>
							<span>{contactInfo.address}</span>
						</div>
						<div className={styles.contactItem}>
							<span className={styles.contactIcon}>📞</span>
							<span>{contactInfo.phone}</span>
						</div>
						<div className={styles.contactItem}>
							<span className={styles.contactIcon}>✉️</span>
							<a
								href={`mailto:${contactInfo.email}`}
								className={styles.contactLink}
							>
								{contactInfo.email}
							</a>
						</div>
						{contactInfo.fax && (
							<div className={styles.contactItem}>
								<span className={styles.contactIcon}>📠</span>
								<span>Факс: {contactInfo.fax}</span>
							</div>
						)}
					</div>
				</div>

				{/* Быстрые ссылки */}
				{quickLinks.length > 0 && (
					<div className={`${styles.footerSection} ${styles.footerLinks}`}>
						<h4 className={styles.footerSectionTitle}>Быстрые ссылки</h4>
						<ul className={styles.footerLinksList}>
							{quickLinks.map(link => (
								<li key={link.id} className={styles.footerLinkItem}>
									<a
										href={link.url}
										onClick={e => handleLinkClick(link.url, e)}
										className={styles.footerLink}
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Социальные сети */}
				{socialLinks.length > 0 && (
					<div className={`${styles.footerSection} ${styles.footerSocial}`}>
						<h4 className={styles.footerSectionTitle}>Мы в соцсетях</h4>
						<div className={styles.socialLinks}>
							{socialLinks.map(social => (
								<a
									key={social.id}
									href={social.url}
									target='_blank'
									rel='noopener noreferrer'
									className={styles.socialLink}
									aria-label={social.name}
								>
									{social.icon}
								</a>
							))}
						</div>
					</div>
				)}

				{/* Партнеры */}
				{partners.length > 0 && (
					<div className={`${styles.footerSection} ${styles.footerPartners}`}>
						<h4 className={styles.footerSectionTitle}>Партнеры</h4>
						<div className={styles.partnersGrid}>
							{partners.map(partner => (
								<a
									key={partner.id}
									href={partner.url}
									target='_blank'
									rel='noopener noreferrer'
									className={styles.partnerLink}
									title={partner.name}
								>
									<img
										src={partner.logoUrl}
										alt={partner.name}
										className={styles.partnerLogo}
									/>
								</a>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Нижняя панель с копирайтом */}
			<div className={styles.footerBottom}>
				<div className={styles.footerBottomContent}>
					<p className={styles.copyright}>
						{copyrightText ||
							`© ${currentYear} ${departmentName}, ${universityName}. Все права защищены.`}
					</p>
					<div className={styles.footerBottomLinks}>
						<a href='/privacy' className={styles.bottomLink}>
							Политика конфиденциальности
						</a>
						<a href='/sitemap' className={styles.bottomLink}>
							Карта сайта
						</a>
					</div>
				</div>
			</div>
		</footer>
	)
}
