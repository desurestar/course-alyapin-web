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
		<footer className={styles.footer}>
			{/* Удалены быстрые ссылки и название кафедры */}
			<div className={styles.institute}>
				Институт информационных технологий и анализа данных
			</div>
		</footer>
	)
}
