import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./routes/index";
import Login from "./routes/login";
import AppRoute from "./routes/app";
import Setups from "./routes/app.setups";
import SetupDetail from "./routes/app.setups.$id";
import Dashboard from "./routes/app.dashboard";
import Journal from "./routes/app.journal";
import NewTrade from "./routes/app.journal.new";
import { RequireAuth } from "./lib/auth";
import Profile from "./routes/app.profile";
import Analytics from "./routes/app.analytics";
import Calendar from "./routes/app.calendar";
import Propfirm from "./routes/app.propfirm";
import ShareSetup from "./routes/share.setup.$id";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route path="/app" element={<RequireAuth><AppRoute /></RequireAuth>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="journal/*" element={<Journal />} />
          <Route path="journal/new" element={<NewTrade />} />
          <Route path="setups" element={<Setups />} />
          <Route path="setups/:id" element={<SetupDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="propfirm" element={<Propfirm />} />
        </Route>
        <Route path="/share/setup/:id" element={<ShareSetup />} />
      </Routes>
    </BrowserRouter>
  );
}
