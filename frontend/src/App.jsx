/**
 * App.jsx — Root component with routing
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WeekendProvider } from './context/WeekendContext';

// Pages
import LoginPage from './pages/LoginPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import GroupFeedPage from './pages/GroupFeedPage';
import ConfessionsPage from './pages/ConfessionsPage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BingoPage from './pages/BingoPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import AMAPage from './pages/AMAPage';
import SuperlativesPage from './pages/SuperlativesPage';
import HashtagFeedPage from './pages/HashtagFeedPage';

// Layout
import Layout from './components/Layout/Layout';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-900">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">🍺</div>
          <p className="text-gold-400 font-display text-xl">Pouring your feed...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Profile completion (for new users) */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Protected — all use main Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="confessions" element={<ConfessionsPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/:slug" element={<GroupFeedPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile/:username" element={<ProfilePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/:conversationId" element={<MessagesPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="bingo" element={<BingoPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="ama/:id" element={<AMAPage />} />
        <Route path="superlatives" element={<SuperlativesPage />} />
        <Route path="hashtag/:tag" element={<HashtagFeedPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WeekendProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </WeekendProvider>
    </AuthProvider>
  );
}
