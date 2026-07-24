import { Routes, Route } from 'react-router-dom';
import ProjectForm from './pages/ProjectForm';
import TicketForm from './pages/TicketForm';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProjectForm />} />
      <Route path="/support" element={<TicketForm />} />
    </Routes>
  );
}

export default App;
