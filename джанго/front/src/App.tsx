import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider, RequireAdmin, RequireAuth, useAuth } from './auth/auth'
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
import { logoUrl } from './mocks/header.mocks'
import { AdminDepartmentPage } from './pages/adminDepartmentPage/adminDepartmentPage'
import { AdminGrantsPage } from './pages/adminGrantsPage/adminGrantsPage'
import { AdminGroupPage } from './pages/adminGropPage/adminGroupPage'
import { AdminMainPage } from './pages/adminMainPage/adminMainPage'
import { AdminProjectPage } from './pages/adminProgectPage/adminProjectPage'
import { AdminPublicationPage } from './pages/adminPublicationPage/adminPublicationPage'
import { AdminUserPage } from './pages/adminUserPage/adminUserPage'
import { DepartmentPage } from './pages/departmentPage/departmentPage'
import { GrantsPage } from './pages/grantsPage/grantsPage'
import { GroupPage } from './pages/groupPage/groupPage'
import { HomePage } from './pages/homePage/homePage'
import { LoginPage } from './pages/loginPage/loginPage'
import { ProfilePage } from './pages/profilePage/profilePage'
import { ProjectsPage } from './pages/projectsPage/projectsPage'
import { PublicationPage } from './pages/publicationPage/publicationPage'

function AppShell() {
	const { loggedIn, user } = useAuth()
	return (
		<>
			{loggedIn && (
				<Header
					universityName={universityName}
					logoUrl={logoUrl}
					showSearch
					onSearch={q => console.log('Поиск:', q)}
				/>
			)}
			<div className='siteContent'>
				<Routes>
					<Route path='/login' element={<LoginPage />} />
					<Route
						path='/admin/grants'
						element={
							<RequireAdmin>
								<AdminGrantsPage />
							</RequireAdmin>
						}
					/>
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

					{/* Admin */}
					<Route
						path='/admin'
						element={
							<RequireAdmin>
								<AdminMainPage />
							</RequireAdmin>
						}
					/>
					<Route
						path='/admin/departments'
						element={
							<RequireAdmin>
								<AdminDepartmentPage />
							</RequireAdmin>
						}
					/>
					<Route
						path='/admin/groups'
						element={
							<RequireAdmin>
								<AdminGroupPage />
							</RequireAdmin>
						}
					/>
					<Route
						path='/admin/projects'
						element={
							<RequireAdmin>
								<AdminProjectPage />
							</RequireAdmin>
						}
					/>
					<Route
						path='/admin/publications'
						element={
							<RequireAdmin>
								<AdminPublicationPage />
							</RequireAdmin>
						}
					/>
					<Route
						path='/admin/users'
						element={
							<RequireAdmin>
								<AdminUserPage />
							</RequireAdmin>
						}
					/>

					<Route
						path='*'
						element={
							<Navigate
								to={loggedIn ? (user?.is_superuser ? '/admin' : '/') : '/login'}
								replace
							/>
						}
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
