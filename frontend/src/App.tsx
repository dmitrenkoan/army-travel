import { Navigate, Route, Routes } from 'react-router-dom';
import { GoogleMapsProvider } from './context/GoogleMapsContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import TripsSearchPage from './pages/TripsSearchPage';
import CreateTripPage from './pages/CreateTripPage';
import MyTripsPage from './pages/MyTripsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import MilitaryUnitsPage from './pages/MilitaryUnitsPage';
import PeoplePage from './pages/PeoplePage';
import ComplaintsPage from './pages/ComplaintsPage';

export default function App() {
  return (
    <GoogleMapsProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/trips" replace />} />
          <Route path="/trips" element={<TripsSearchPage />} />
          <Route path="/trips/new" element={<CreateTripPage />} />
          <Route path="/my-trips" element={<MyTripsPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route
            path="/military-units"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <MilitaryUnitsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/people"
            element={
              <ProtectedRoute roles={['super_admin', 'unit_admin']}>
                <PeoplePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <ComplaintsPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/trips" replace />} />
      </Routes>
    </GoogleMapsProvider>
  );
}
