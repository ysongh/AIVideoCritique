import { HashRouter, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import FeedbackForm from "./pages/FeedbackForm";

function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route
          path="/test"
          element={
            <>
              <h1>Test</h1>
            </>} />
        <Route
          path="/"
          element={<FeedbackForm />} />
      </Routes>
    </HashRouter>
  )
}

export default App
