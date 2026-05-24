
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login";
import ForgotPasswordPage from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ProfilePage  from "./pages/profile";
import ProfileSettings from "./pages/setting";
import HomePage from "./pages/Home";
import AddExpense from "./components/expense/ExpenseForm";
import GroupSplit from "./pages/GroupPage";
import GroupDashboard from "./pages/GroupDashboard";
import FriendsDashboard from "./pages/FriendsDashboard";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/Home" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/Dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/group-dashboard" element={<GroupDashboard />} />
          <Route path="/groups" element={<Navigate to="/group-dashboard" replace />} />
          <Route path="/friends-dashboard" element={<FriendsDashboard />} />
          <Route path="/expense" element={<AddExpense />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/setting" element={<ProfileSettings/>}/>
          <Route path ="/home"element={<HomePage/>}/>
          <Route path ="/group"element={<GroupSplit/>}/>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;



