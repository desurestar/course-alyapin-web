import type { FC } from 'react'
import { List, type ArticleRef } from '../list/list'

type Props = {
	title?: string
	items: ArticleRef[]
	onArticleClick?: (a: ArticleRef) => void
	emptyText?: string
}

export const PublicationList: FC<Props> = ({
	title = 'Публикации',
	items,
	onArticleClick,
	emptyText,
}) => {
	return (
		<List<ArticleRef>
			variant='articles'
			title={title}
			items={items}
			emptyText={emptyText || 'Нет публикаций'}
			onItemClick={onArticleClick}
		/>
	)
}
