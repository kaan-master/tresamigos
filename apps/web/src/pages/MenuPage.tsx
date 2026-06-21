import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { MenuTabs } from "../components/MenuTabs";
import { useMenuSectionCollapse } from "../hooks/useMenuSectionCollapse";
import { productImageUrl } from "../lib/productImage";
import { pageSeo } from "../lib/seo";

export function MenuPage({ content }: { content: SiteContent }) {
  const { site, menu } = content;
  const seo = pageSeo(content, "menu");
  const activeMenu = menu.filter((category) => category.active !== false);
  useMenuSectionCollapse();

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="page-head compact">
        <div className="shell">
          <h1>Pick your feast</h1>
          <p>Alle producten uit het menu overzichtelijk per categorie. Goed leesbaar, minder over de top en direct te koppelen aan bestellen.</p>
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
                      <article className="product-card has-image" key={item.id}>
                        <img src={productImageUrl(item.image, item.id)} alt={item.name} loading="lazy" />
                        <div>
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
                        </div>
                        <strong>{item.price}</strong>
                      </article>
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
            <h2 className="section-title">Order the menu</h2>
            <p className="lead">Choose your nearest Tres Amigos location and use Take Away, Delivery, Thuisbezorgd or Uber Eats.</p>
            <div className="actions">
              <a className="btn" href="/order">
                View all shops
              </a>
            </div>
          </div>
          <div className="photo-block">
            <img src="/assets/brand/breakfast-lunch-dinner.png" alt="Breakfast lunch and dinner brand image" />
          </div>
        </div>
      </section>
    </>
  );
}
