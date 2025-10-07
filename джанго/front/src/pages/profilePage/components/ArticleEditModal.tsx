import type { FC } from 'react'
import styles from '../profilePage.module.css'

interface ArticleEditValue {
	id: number
	title: string
	abstract?: string
	link?: string
	co_author_ids: number[]
}
interface ArticleEditModalProps {
	value: ArticleEditValue
	setValue: React.Dispatch<React.SetStateAction<ArticleEditValue | null>>
	candidates: { id: number; full_name: string }[]
	editing: boolean
	onClose: () => void
	onSubmit: () => void
	globalError: string | null
}

export const ArticleEditModal: FC<ArticleEditModalProps> = ({
	value,
	setValue,
	candidates,
	editing,
	onClose,
	onSubmit,
	globalError,
}) => {
	return (
		<div className={styles.modalBackdrop}>
			<div className={styles.modal}>
				<button className={styles.closeBtn} onClick={onClose}>
					&times;
				</button>
				<h4>Редактирование публикации</h4>
				<div className={styles.fieldGroup}>
					<label>Название *</label>
					<input
						value={value.title}
						onChange={e =>
							setValue(v => (v ? { ...v, title: e.target.value } : v))
						}
					/>
				</div>
				<div className={styles.fieldGroup}>
					<label>Аннотация</label>
					<textarea
						value={value.abstract || ''}
						onChange={e =>
							setValue(v => (v ? { ...v, abstract: e.target.value } : v))
						}
					/>
				</div>
				<div className={styles.fieldGroup}>
					<label>Ссылка</label>
					<input
						value={value.link || ''}
						onChange={e =>
							setValue(v => (v ? { ...v, link: e.target.value } : v))
						}
					/>
				</div>
				<div className={styles.fieldGroup}>
					<label>Соавторы</label>
					<select
						multiple
						className={styles.selectMulti}
						value={value.co_author_ids.map(String)}
						onChange={e => {
							const opts = Array.from(e.target.selectedOptions).map(o =>
								Number(o.value)
							)
							setValue(v => (v ? { ...v, co_author_ids: opts } : v))
						}}
					>
						{candidates.map(c => (
							<option key={c.id} value={c.id}>
								{c.full_name}
							</option>
						))}
					</select>
					<div className={styles.helper}>Вы также будете автором</div>
				</div>
				{globalError && <div className={styles.error}>{globalError}</div>}
				<div className={styles.actions}>
					<button
						className={styles.smallBtn}
						onClick={onSubmit}
						disabled={editing}
					>
						{editing ? 'Сохранение…' : 'Сохранить'}
						{editing && <span className={styles.spinnerInline} />}
					</button>
					<button className={styles.smallBtn} onClick={onClose}>
						Отмена
					</button>
				</div>
			</div>
		</div>
	)
}
