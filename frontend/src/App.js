import { Route, Routes } from "react-router-dom";
import Home from "./components/Home.js";
import Navbar from "./components/Navbar.js";
import CreateTeam from "./components/CreateTeam.js";
import Team from "./components/Team.js";
import LogInPage from "./components/LogInPage.js";
import MyTeams from "./components/MyTeams.js";
import MyTasks from "./components/MyTasks.js";
import Notifications from "./components/Notifications.js";
import Profile from "./components/Profile.js";
import MainPage from "./components/MainPage.js";
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/myTasks" element={<MyTasks />} />
        <Route path="/logIn" element={<LogInPage />} />
        <Route path="/" element={<MainPage />} />
        <Route path="/create" element={<CreateTeam />} />
        <Route path="/team/:id" element={<Team />} />
        <Route path="/myteams" element={<MyTeams />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </>
  );
}

export default App;
