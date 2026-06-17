import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ProcessCards from "@/pages/ProcessCards";
import FurnacePlanning from "@/pages/FurnacePlanning";
import Carburizing from "@/pages/Carburizing";
import Tempering from "@/pages/Tempering";
import Metallography from "@/pages/Metallography";
import Hardness from "@/pages/Hardness";
import Deformation from "@/pages/Deformation";
import Traceability from "@/pages/Traceability";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/process-cards" element={<ProcessCards />} />
          <Route path="/furnace-planning" element={<FurnacePlanning />} />
          <Route path="/carburizing" element={<Carburizing />} />
          <Route path="/tempering" element={<Tempering />} />
          <Route path="/metallography" element={<Metallography />} />
          <Route path="/hardness" element={<Hardness />} />
          <Route path="/deformation" element={<Deformation />} />
          <Route path="/traceability" element={<Traceability />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
