import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// OBS Pages
import { ObsScoreboard, ObsStats, ObsEvents, ObsPoll, ObsLeagueName, ObsHomeTeam, ObsAwayTeam, ObsScore, ObsMatchTime, ObsPlayerRatings, ObsLineups, ObsStandings, ObsPredictions, ObsH2H, ObsInjuries, ObsBolinha } from "@/presentation/pages/obs";

// Site Pages
import { LiveDashboard, JoinUs, AdminBolinha } from "@/presentation/pages/site";
import TodayMatches from "@/presentation/pages/site/TodayMatches";
import PreMatch from "@/presentation/pages/site/PreMatch";
import StandingsPage from "@/presentation/pages/site/Standings";
import CalendarPage from "@/presentation/pages/site/Calendar";

// Route configuration
import { ROUTES, isOBSRoute } from "@/config/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to handle OBS-specific body class
const OBSBodyHandler = () => {
  const location = useLocation();

  useEffect(() => {
    if (isOBSRoute(location.pathname)) {
      document.body.classList.add('obs-mode');
    } else {
      document.body.classList.remove('obs-mode');
    }
    return () => { document.body.classList.remove('obs-mode'); };
  }, [location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OBSBodyHandler />
          <Routes>
            {/* Public Pages */}
            <Route path={ROUTES.HOME} element={<Index />} />
            <Route path={ROUTES.LIVE} element={<LiveDashboard />} />
            <Route path={ROUTES.TODAY_MATCHES} element={<TodayMatches />} />
            <Route path={ROUTES.PRE_MATCH} element={<PreMatch />} />
            <Route path={ROUTES.STANDINGS} element={<StandingsPage />} />
            <Route path={ROUTES.CALENDAR} element={<CalendarPage />} />
            <Route path={ROUTES.JOIN_US} element={<JoinUs />} />
            <Route path={ROUTES.COMMUNITY} element={<Navigate to={ROUTES.JOIN_US} replace />} />

            {/* Admin Pages */}
            <Route path={ROUTES.ADMIN_BOLINHA} element={<AdminBolinha />} />

            {/* OBS Overlay Pages */}
            <Route path={ROUTES.OBS_SCOREBOARD} element={<ObsScoreboard />} />
            <Route path={ROUTES.OBS_STATS} element={<ObsStats />} />
            <Route path={ROUTES.OBS_EVENTS} element={<ObsEvents />} />
            <Route path={ROUTES.OBS_POLL} element={<ObsPoll />} />
            <Route path={ROUTES.OBS_LEAGUE} element={<ObsLeagueName />} />
            <Route path={ROUTES.OBS_HOME} element={<ObsHomeTeam />} />
            <Route path={ROUTES.OBS_AWAY} element={<ObsAwayTeam />} />
            <Route path={ROUTES.OBS_SCORE} element={<ObsScore />} />
            <Route path={ROUTES.OBS_TIME} element={<ObsMatchTime />} />
            <Route path={ROUTES.OBS_RATINGS} element={<ObsPlayerRatings />} />
            <Route path={ROUTES.OBS_LINEUPS} element={<ObsLineups />} />
            <Route path={ROUTES.OBS_STANDINGS} element={<ObsStandings />} />
            <Route path={ROUTES.OBS_PREDICTIONS} element={<ObsPredictions />} />
            <Route path={ROUTES.OBS_H2H} element={<ObsH2H />} />
            <Route path={ROUTES.OBS_INJURIES} element={<ObsInjuries />} />
            <Route path={ROUTES.OBS_BOLINHA} element={<ObsBolinha />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
