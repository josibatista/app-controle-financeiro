import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/Login.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
