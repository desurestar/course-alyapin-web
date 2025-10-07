import type { FC } from 'react'
import type { NewArticleInput } from '../../../types/profile'
import styles from '../profilePage.module.css'

interface ArticleCreateModalProps {
	form: NewArticleInput
	setForm: React.Dispatch<React.SetStateAction<NewArticleInput>>
	candidates: { id: number; full_name: string }[]
	creating: boolean
	onClose: () => void
	onSubmit: () => void
	globalError: string | null
}

export const ArticleCreateModal: FC<ArticleCreateModalProps> = ({
	form,
	setForm,
	candidates,
	creating,
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
				<h4>Новая публикация</h4>
				<div className={styles.fieldGroup}>
					<label>Название *</label>
					<input
						value={form.title}
						onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
					/>
				</div>
				<div className={styles.fieldGroup}>
					<label>Аннотация</label>
					<textarea
						value={form.abstract}
						onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))}
					/>
				</div>
				<div className={styles.fieldGroup}>
					<label>Ссылка</label>
					<input
						value={form.link}
						onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
					/>
				</div>
				<div className={styles.fieldGroup}>
					<label>Соавторы</label>
					<select
						multiple
						className={styles.selectMulti}
						value={form.co_author_ids.map(String)}
						onChange={e => {
							const opts = Array.from(e.target.selectedOptions).map(o =>
								Number(o.value)
							)
							setForm(f => ({ ...f, co_author_ids: opts }))
						}}
					>
						{candidates.map(c => (
							<option key={c.id} value={c.id}>
								{c.full_name}
							</option>
						))}
					</select>
					<div className={styles.helper}>Вы автоматически будете автором</div>
				</div>
				{globalError && <div className={styles.error}>{globalError}</div>}
				<div className={styles.actions}>
					<button
						className={styles.smallBtn}
						onClick={onSubmit}
						disabled={creating}
					>
						{creating ? 'Создание…' : 'Создать'}
						{creating && <span className={styles.spinnerInline} />}
					</button>
					<button className={styles.smallBtn} onClick={onClose}>
						Отмена
					</button>
				</div>
			</div>
		</div>
	)
}
