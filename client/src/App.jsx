import { HashRouter, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import FeedbackForm from "./pages/FeedbackForm";
import GitHubDependenciesViewer from './pages/GitHubDependenciesViewer';

function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route
          path="/githubdependenciesviewer"
          element={<GitHubDependenciesViewer />} />
        <Route
          path="/"
          element={<FeedbackForm />} />
      </Routes>
    </HashRouter>
  )
}

export default App
