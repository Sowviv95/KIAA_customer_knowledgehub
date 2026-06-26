import { useState, useEffect, useCallback } from "react";
import { TopNav } from "./components/TopNav";
import { Dashboard } from "./components/Dashboard";
import { FileLibrary } from "./components/FileLibrary";
import { Summaries } from "./components/Summaries";
import { AskAI } from "./components/AskAI";
import { Alerts } from "./components/Alerts";
import { Settings } from "./components/Settings";
import { EvidenceDrawer } from "./components/EvidenceDrawer";
import { DevAnnotations } from "./components/DevAnnotations";
import { StateShowcase } from "./components/StateShowcase";
import { DesignTokensView } from "./components/DesignTokensView";
import { Page, NavContext, EvidenceItem, Role } from "./types";
import { color } from "./tokens";
import { getDashboardStats } from "./api/dashboardApi";

export default function App() {
  const [activePage, setActivePage]   = useState<Page>("dashboard");
  const [navCtx, setNavCtx]           = useState<NavContext>({});
  const [drawerItem, setDrawerItem]   = useState<EvidenceItem | null>(null);
  const [role, setRole]               = useState<Role>("Project Manager");
  const [showDevNotes, setShowDevNotes] = useState(false);
  const [showStates, setShowStates]   = useState(false);
  const [showTokens, setShowTokens]   = useState(false);
  const [alertCount, setAlertCount]   = useState(0);

  const fetchAlertCount = useCallback(async () => {
    try {
      const stats = await getDashboardStats();
      setAlertCount(stats.open_alerts);
    } catch { /* backend offline — show 0 */ }
  }, []);

  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchAlertCount]);

  const clearDevOverlays = () => { setShowStates(false); setShowTokens(false); };

  const navigateTo = (page: Page, ctx: NavContext = {}) => {
    clearDevOverlays();
    setNavCtx(ctx);
    setActivePage(page);
    setDrawerItem(null);
  };

  const openAsk = (context: string) => {
    clearDevOverlays();
    setNavCtx({ askContext: context });
    setActivePage("ask");
    setDrawerItem(null);
  };

  const openDrawer  = (item: EvidenceItem) => setDrawerItem(item);
  const closeDrawer = () => setDrawerItem(null);
  const devActive   = showStates || showTokens;

  const renderPage = () => {
    if (showTokens) return <DesignTokensView />;
    if (showStates) return <StateShowcase />;
    switch (activePage) {
      case "dashboard": return <Dashboard onNavigate={navigateTo} onOpenAsk={openAsk} onOpenDrawer={openDrawer} role={role} />;
      case "files":     return <FileLibrary initialFilter={navCtx.fileLibraryFilter} onNavigate={navigateTo} onOpenDrawer={openDrawer} onOpenAsk={openAsk} />;
      case "summaries": return <Summaries initialTab={navCtx.summariesTab} initialTopic={navCtx.summariesTopic} onOpenDrawer={openDrawer} onOpenAsk={openAsk} onNavigate={navigateTo} role={role} />;
      case "ask":       return <AskAI context={navCtx.askContext} role={role} onOpenDrawer={openDrawer} />;
      case "alerts":    return <Alerts initialFilter={navCtx.alertsFilter} onOpenDrawer={openDrawer} onOpenAsk={openAsk} role={role} />;
      case "settings":  return <Settings />;
    }
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: color.pageBg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", minWidth: 1024 }}
    >
      <TopNav
        activePage={activePage}
        onNavigate={(p) => navigateTo(p)}
        alertCount={alertCount}
        role={role}
        onRoleChange={setRole}
        showDevNotes={showDevNotes}
        onToggleDevNotes={() => setShowDevNotes((v) => !v)}
        showStates={showStates}
        onToggleStates={() => { setShowStates((v) => !v); setShowTokens(false); }}
        showTokens={showTokens}
        onToggleTokens={() => { setShowTokens((v) => !v); setShowStates(false); }}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden relative">{renderPage()}</main>
        {showDevNotes && !devActive && (
          <DevAnnotations page={activePage} onClose={() => setShowDevNotes(false)} />
        )}
      </div>

      <EvidenceDrawer item={drawerItem} onClose={closeDrawer} onOpenAsk={openAsk} />
    </div>
  );
}
