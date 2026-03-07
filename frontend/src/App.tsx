import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Queue from './pages/Queue';
import Kanban from './pages/Kanban';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import VieTracker from './pages/VieTracker';
import InterviewPrep from './pages/InterviewPrep';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MainLayout>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/queue" element={<Queue />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/applications" element={<Navigate to="/kanban" />} />
              <Route path="/vie" element={<VieTracker />} />
              <Route path="/interview-prep" element={<InterviewPrep />} />
              <Route path="/interview-prep/:id" element={<InterviewPrep />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </MainLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
