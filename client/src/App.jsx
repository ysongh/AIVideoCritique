import { HashRouter, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import FeedbackForm from "./pages/FeedbackForm";
import NpmDependencyAnalyzer from './pages/NpmDependencyAnalyzer';
import PythonDependenciesViewer from './pages/PythonDependenciesViewer';

function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route
          path="/pythondependenciesviewer"
          element={<PythonDependenciesViewer />} />
        <Route
          path="/npmanalysing"
          element={<NpmDependencyAnalyzer />} />
        <Route
          path="/"
          element={<FeedbackForm />} />
      </Routes>
    </HashRouter>
  )
}

export default App
