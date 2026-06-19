import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useLanguage } from "./i18n/LanguageProvider";
import { useSiteContent } from "./hooks/useSiteContent";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { LocationsPage, OrderPage } from "./pages/LocationsPage";
import { MenuPage } from "./pages/MenuPage";
import { OurStoryPage } from "./pages/OurStoryPage";
import { VacancyPage } from "./pages/VacancyPage";

function ShellRoutes() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useSiteContent();

  useEffect(() => {
    const toggle = document.querySelector("[data-menu-toggle]");
    const navLinks = document.querySelector(".nav-links");
    if (!toggle || !navLinks) return;

    const onToggle = () => navLinks.classList.toggle("open");
    toggle.addEventListener("click", onToggle);
    return () => toggle.removeEventListener("click", onToggle);
  }, []);

  if (isLoading) {
    return <div className="shell" style={{ padding: "80px 0" }}>{t("common.loading")}</div>;
  }

  if (error || !data) {
    return <div className="shell" style={{ padding: "80px 0" }}>{t("common.error")}</div>;
  }

  return (
    <Routes>
      <Route element={<Layout content={data} />}>
        <Route index element={<HomePage content={data} />} />
        <Route path="menu" element={<MenuPage content={data} />} />
        <Route path="order" element={<OrderPage content={data} />} />
        <Route path="locations" element={<LocationsPage content={data} />} />
        <Route path="contact" element={<ContactPage content={data} />} />
        <Route path="our-story" element={<OurStoryPage content={data} />} />
        <Route path="vacancy" element={<VacancyPage content={data} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return <ShellRoutes />;
}
