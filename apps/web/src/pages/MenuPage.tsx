import { useEffect, useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { MenuTabs } from "../components/MenuTabs";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { useLanguage } from "../i18n/LanguageProvider";
import { productImageUrl } from "../lib/productImage";
import { pageSeo } from "../lib/seo";

type MenuItem = SiteContent["menu"][number]["items"][number];

export function MenuPage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const { menu } = content;
  const seo = pageSeo(content, "menu");
  const activeMenu = menu.filter((category) => category.active !== false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    document.querySelector(".menu-page")?.classList.add("in-view");
  }, []);

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="page-head compact">
        <div className="shell">
          <h1>{t("menu.pageTitle")}</h1>
          <p>{t("menu.pageIntro")}</p>
        </div>
      </header>
      <main className="section menu-page">
        <div className="shell">
          <MenuTabs tabs={activeMenu.map((category) => ({ id: category.id, title: category.title }))} />
          {activeMenu.map((category) => (
            <section className="menu-section" id={category.title} key={category.id}>
              <div className="menu-section-inner">
                <div className="menu-section-head">
                  <h2>{category.title}</h2>
                </div>
                <div className="product-grid">
                  {category.items
                    .filter((item) => item.active !== false)
                    .map((item) => (
                      <button
                        type="button"
                        className="product-card has-image"
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                      >
                        <img src={productImageUrl(item.image, item.id)} alt={item.name} loading="lazy" />
                        <div>
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
                        </div>
                        <strong>{item.price}</strong>
                      </button>
                    ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
      <section className="section blue">
        <div className="shell split">
          <div>
            <h2 className="section-title">{t("menu.orderTitle")}</h2>
            <p className="lead">{t("menu.orderIntro")}</p>
            <div className="actions">
              <a className="btn" href="/locations">
                {t("menu.viewLocations")}
              </a>
            </div>
          </div>
          <div className="photo-block">
            <img src="/assets/brand/breakfast-lunch-dinner.png" alt="Breakfast lunch and dinner brand image" />
          </div>
        </div>
      </section>
      <ProductDetailModal
        open={Boolean(selectedItem)}
        product={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
