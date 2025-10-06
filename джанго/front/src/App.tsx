import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider, RequireAuth, useAuth } from './auth/auth'
import { Footer } from './components/footer/footer'
import { Header } from './components/header/header'
import {
	contactInfo,
	departmentName,
	partners,
	quickLinks,
	socialLinks,
	universityName,
} from './mocks/footer.mocks'
import { logoUrl, navItems } from './mocks/header.mocks'
import { DepartmentPage } from './pages/departmentPage/departmentPage'
import { GrantsPage } from './pages/grantsPage/grantsPage'
import { GroupPage } from './pages/groupPage/groupPage'
import { HomePage } from './pages/homePage/homePage'
import { LoginPage } from './pages/loginPage/loginPage'
import { ProfilePage } from './pages/profilePage/profilePage'
import { ProjectsPage } from './pages/projectsPage/projectsPage'
import { PublicationPage } from './pages/publicationPage/publicationPage'

function AppShell() {
	const { loggedIn } = useAuth()
	return (
		<>
			{loggedIn && (
				<Header
					departmentName={departmentName}
					universityName={universityName}
					logoUrl={logoUrl}
					navItems={navItems}
					showSearch
					onNavItemClick={path => console.log('Перейти:', path)}
					onSearch={q => console.log('Поиск:', q)}
				/>
			)}

			{/* Центрирующий контейнер для всех страниц */}
			<div className='siteContent'>
				<Routes>
					<Route path='/login' element={<LoginPage />} />
					<Route
						path='/'
						element={
							<RequireAuth>
								<HomePage />
							</RequireAuth>
						}
					/>
					<Route
						path='/departments/:id'
						element={
							<RequireAuth>
								<DepartmentPage />
							</RequireAuth>
						}
					/>
					<Route
						path='/groups/:id'
						element={
							<RequireAuth>
								<GroupPage />
							</RequireAuth>
						}
					/>
					<Route
						path='/profile/:id'
						element={
							<RequireAuth>
								<ProfilePage />
							</RequireAuth>
						}
					/>
					<Route
						path='/publications'
						element={
							<RequireAuth>
								<PublicationPage />
							</RequireAuth>
						}
					/>
					<Route
						path='/projects'
						element={
							<RequireAuth>
								<ProjectsPage />
							</RequireAuth>
						}
					/>
					<Route
						path='/grants'
						element={
							<RequireAuth>
								<GrantsPage />
							</RequireAuth>
						}
					/>
					<Route
						path='*'
						element={<Navigate to={loggedIn ? '/' : '/login'} replace />}
					/>
				</Routes>
			</div>

			{loggedIn && (
				<Footer
					departmentName={departmentName}
					universityName={universityName}
					contactInfo={contactInfo}
					quickLinks={quickLinks}
					socialLinks={socialLinks}
					partners={partners}
				/>
			)}
		</>
	)
}

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<AppShell />
			</BrowserRouter>
		</AuthProvider>
	)
}

export default App
