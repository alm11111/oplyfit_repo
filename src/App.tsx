import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './store/auth'
import { ErrorBoundary } from './components/ErrorBoundary'
import Login from './pages/Login'
import DashboardLayout from './pages/DashboardLayout'
import Overview from './pages/Overview'
import Members from './pages/Members'
import MemberDetail from './pages/MemberDetail'
import Plans from './pages/Plans'
import Classes from './pages/Classes'
import Staff from './pages/Staff'
import Treasury from './pages/Treasury'
import GymProfile from './pages/GymProfile'
import Marketplace from './pages/Marketplace'
import KpiDashboard from './pages/KpiDashboard'
import Invoices from './pages/Invoices'
import Notifications from './pages/Notifications'
import Compliance from './pages/Compliance'
import ZkTeco from './pages/ZkTeco'
import Onboarding from './pages/Onboarding'
import CredentialChecklist from './pages/CredentialChecklist'
import Nutrition from './pages/Nutrition'
import Gamification from './pages/Gamification'
import Machines from './pages/Machines'
import HealthSync from './pages/HealthSync'
import Wellness from './pages/Wellness'
import ServiceMarket from './pages/ServiceMarket'
import Recovery from './pages/Recovery'
import AiCoach from './pages/AiCoach'
import BodyScore from './pages/BodyScore'
import Campaigns from './pages/Campaigns'
import Churn from './pages/Churn'
import Videos from './pages/Videos'
import Merch from './pages/Merch'
import Courses from './pages/Courses'
import Challenges from './pages/Challenges'
import Referral from './pages/Referral'
import FitChain from './pages/FitChain'
import Reports from './pages/Reports'
import Franchise from './pages/Franchise'
import CorporateWellness from './pages/CorporateWellness'
import Contracts from './pages/Contracts'
import Technogym from './pages/Technogym'
import LifeFitness from './pages/LifeFitness'
import ComputerVision from './pages/ComputerVision'
import SportsPsychology from './pages/SportsPsychology'
import OpenApiPortal from './pages/OpenApiPortal'
import WhiteLabel from './pages/WhiteLabel'
import DeveloperMarketplace from './pages/DeveloperMarketplace'
import PremiumInsights from './pages/PremiumInsights'
import ApiLicensing from './pages/ApiLicensing'
import Localization from './pages/Localization'
import ArVrClasses from './pages/ArVrClasses'
import Payments from './pages/Payments'
import Workouts from './pages/Workouts'
import Forecast from './pages/Forecast'
import UserPermissions from './pages/UserPermissions'

function Protected({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuth((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/setup"
        element={
          <Protected>
            <Onboarding />
          </Protected>
        }
      />
      <Route
        path="/"
        element={
          <Protected>
            <DashboardLayout />
          </Protected>
        }
      >
        <Route index element={<Overview />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="plans" element={<Plans />} />
        <Route path="classes" element={<Classes />} />
        <Route path="staff" element={<Staff />} />
        <Route path="treasury" element={<Treasury />} />
        <Route path="payments" element={<Payments />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="kpi" element={<KpiDashboard />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="zkteco" element={<ZkTeco />} />
        <Route path="gym" element={<GymProfile />} />
        <Route path="credentials" element={<CredentialChecklist />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="gamification" element={<Gamification />} />
        <Route path="machines" element={<Machines />} />
        <Route path="healthsync" element={<HealthSync />} />
        <Route path="wellness" element={<Wellness />} />
        <Route path="servicemarket" element={<ServiceMarket />} />
        <Route path="recovery" element={<Recovery />} />
        <Route path="aicoach" element={<AiCoach />} />
        <Route path="bodyscore" element={<BodyScore />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="churn" element={<Churn />} />
        <Route path="videos" element={<Videos />} />
        <Route path="merch" element={<Merch />} />
        <Route path="courses" element={<Courses />} />
        <Route path="challenges" element={<Challenges />} />
        <Route path="referral" element={<Referral />} />
        <Route path="fitchain" element={<FitChain />} />
        <Route path="reports" element={<Reports />} />
        <Route path="franchise" element={<Franchise />} />
        <Route path="corporate" element={<CorporateWellness />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="technogym" element={<Technogym />} />
        <Route path="lifefitness" element={<LifeFitness />} />
        <Route path="computervision" element={<ComputerVision />} />
        <Route path="sportspsychology" element={<SportsPsychology />} />
        <Route path="openapi" element={<OpenApiPortal />} />
        <Route path="whitelabel" element={<WhiteLabel />} />
        <Route path="devmarketplace" element={<DeveloperMarketplace />} />
        <Route path="insights" element={<PremiumInsights />} />
        <Route path="apilicensing" element={<ApiLicensing />} />
        <Route path="localization" element={<Localization />} />
        <Route path="arvr" element={<ArVrClasses />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="forecast" element={<Forecast />} />
        <Route path="users" element={<UserPermissions />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  )
}
