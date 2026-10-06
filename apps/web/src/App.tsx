import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useLanguage } from "./i18n/LanguageProvider";
import { useSiteBoot } from "./hooks/useSiteBoot";
import { useSiteContent } from "./hooks/useSiteContent";
import { dismissSiteBoot } from "./lib/waitForPageImages";
import { CateringPage } from "./pages/CateringPage";
import { ContactPage } from "./pages/ContactPage";
import { FranchisePage } from "./pages/FranchisePage";
import { FranchiseLoginPage, FranchiseShopPage } from "./pages/FranchiseShopPages";
import { HomePage } from "./pages/HomePage";
import { LocationsPage, OrderPage } from "./pages/LocationsPage";
import { LoginPage } from "./pages/LoginPage";
import { LoyaltyPage } from "./pages/LoyaltyPage";
import { PrivacyPage, TermsPage } from "./pages/LegalPages";
import { MenuPage } from "./pages/MenuPage";
import { OurStoryPage } from "./pages/OurStoryPage";
import { OurValuePage } from "./pages/OurValuePage";
import { VacancyPage } from "./pages/VacancyPage";
import { TellingPage } from "./pages/TellingPage";

function ShellRoutes() {
  const { t } = useLanguage();
  const { data, isLoading, error } = useSiteContent();
  const failed = Boolean(error) || (!isLoading && !data);

  useSiteBoot({ active: Boolean(data) || failed, skipImages: failed });

  if (isLoading) return null;

  if (failed || !data) {
    return <div className="shell" style={{ padding: "80px 0" }}>{t("common.error")}</div>;
  }

  return (
    <Routes>
      <Route element={<Layout content={data} />}>
        <Route index element={<HomePage content={data} />} />
        <Route path="menu" element={<MenuPage content={data} />} />
        <Route path="catering" element={<CateringPage content={data} />} />
        <Route path="order" element={<OrderPage content={data} />} />
        <Route path="locations" element={<LocationsPage content={data} />} />
        <Route path="franchise" element={<FranchisePage content={data} />} />
        <Route path="loyalty" element={<LoyaltyPage content={data} />} />
        <Route path="privacy" element={<PrivacyPage content={data} />} />
        <Route path="terms" element={<TermsPage content={data} />} />
        <Route path="contact" element={<ContactPage content={data} />} />
        <Route path="our-story" element={<OurStoryPage content={data} />} />
        <Route path="our-value" element={<OurValuePage content={data} />} />
        <Route path="vacancy" element={<VacancyPage content={data} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function LoginRoute() {
  useEffect(() => {
    dismissSiteBoot();
  }, []);

  return <LoginPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/telling" element={<TellingPage />} />
      <Route path="/franchise/login" element={<FranchiseLoginPage />} />
      <Route path="/franchise/shop" element={<FranchiseShopPage />} />
      <Route path="/*" element={<ShellRoutes />} />
    </Routes>
  );
}
