// client/src/App.tsx
import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import Attendance from "@/pages/Attendance";
import AttendanceHistory from "@/pages/AttendanceHistory";
import ChatRoom from "@/pages/ChatRoom";
import Calendar from "@/pages/Calendar";
import ExamSchedule from "@/pages/ExamSchedule";
import Syllabus from "@/pages/Syllabus";
import Profile from "@/pages/profile";
import Upcoming from "@/pages/upcoming";
import Devlopers from "@/pages/Devlopers";
import Saarthi from "@/components/Saarthi";
import EscalationMatrix from "@/pages/EscalationMatrix";
import Feedback from "@/pages/feedback";
import Admin from "@/pages/admin";
import StudentCorner from "@/pages/StudentCorner";
import NotFound from "@/pages/not-found";
import StudyTracker from "./pages/StudyTracker";
import Notes from "@/pages/notes";
import TimeTable from "./pages/timetable";
import  Syllabustracker from "./pages/Syllabustracker";
import Todaysgoal from "./pages/todaysgoal";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>

      <Route path="/attendance">
        <ProtectedRoute>
          <Attendance />
        </ProtectedRoute>
      </Route>

      <Route path="/history">
        <ProtectedRoute>
          <AttendanceHistory />
        </ProtectedRoute>
      </Route>

      <Route path="/chat">
        <ProtectedRoute>
          <ChatRoom />
        </ProtectedRoute>
      </Route>

      <Route path="/calendar">
        <ProtectedRoute>
          <Calendar />
        </ProtectedRoute>
      </Route>

      <Route path="/exams">
        <ProtectedRoute>
          <ExamSchedule />
        </ProtectedRoute>
      </Route>

      <Route path="/syllabus">
        <ProtectedRoute>
          <Syllabus />
        </ProtectedRoute>
      </Route>

      <Route path="/upcoming">
        <ProtectedRoute>
          <Upcoming />
        </ProtectedRoute>
      </Route>

      <Route path="/escalationmatrix">
        <ProtectedRoute>
          <EscalationMatrix />
        </ProtectedRoute>
      </Route>

      <Route path="/devlopers">
        <ProtectedRoute>
          <Devlopers />
        </ProtectedRoute>
      </Route>

      <Route path="/feedback">
        <ProtectedRoute>
          <Feedback />
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      <Route path="/saarthi">
        <ProtectedRoute>
          <Saarthi />
        </ProtectedRoute>
      </Route>
      <Route path="/StudentCorner">
        <ProtectedRoute>
          <StudentCorner />
        </ProtectedRoute>
      </Route>

<Route path="/studytracker">
        <ProtectedRoute>
          <StudyTracker />
        </ProtectedRoute>
      </Route>
      
         <Route path="/notes">
        <ProtectedRoute>
          <Notes />
        </ProtectedRoute>
      </Route>

      <Route path="/timetable">
        <ProtectedRoute>
          <TimeTable />
        </ProtectedRoute>
      </Route>

      <Route path="/Syllabustracker">
        <ProtectedRoute>
          < Syllabustracker />
        </ProtectedRoute>
      </Route>

 <Route path="/todaysgoal">
        <ProtectedRoute>
          < Todaysgoal />
        </ProtectedRoute>
      </Route>

       <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
