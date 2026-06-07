import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Molecules from "@/pages/Molecules";
import Tasks from "@/pages/Tasks";
import SpectrumAnalysis from "@/pages/SpectrumAnalysis";
import ApprovalCenter from "@/pages/ApprovalCenter";
import Reports from "@/pages/Reports";
import StatisticsDashboard from "@/pages/StatisticsDashboard";
import Settings from "@/pages/Settings";
import TaskDetail from "@/pages/TaskDetail";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-auto">
        <div className="max-w-[1600px] mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/molecules" element={<Molecules />} />
          <Route path="/molecules/:id" element={<div className="text-center text-xl p-12 text-white">分子详情页</div>} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/spectrum/:taskId" element={<SpectrumAnalysis />} />
          <Route path="/approval" element={<ApprovalCenter />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/dashboard" element={<StatisticsDashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
