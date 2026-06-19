import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { productImageUrl } from "../lib/productImage";
import { pageSeo } from "../lib/seo";

export function MenuPage({ content }: { content: SiteContent }) {
  const { site, menu } = content;
  const seo = pageSeo(content, "menu");
  const activeMenu = menu.filter((category) => category.active !== false);

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="page-head compact">
        <div className="shell">
          <div className="eyebrow">Full menu</div>
          <h1>Pick your feast</h1>
          <p>Alle producten uit het menu overzichtelijk per categorie. Goed leesbaar, minder over de top en direct te koppelen aan bestellen.</p>
        </div>
      </header>
      <main className="section menu-page">
        <div className="shell">
          <div className="menu-tabs">
            {activeMenu.map((category) => (
              <a href={`#${category.title}`} key={category.id}>
                {category.title}
              </a>
            ))}
          </div>
          {activeMenu.map((category) => (
            <section className="menu-section" id={category.title} key={category.id}>
              <div className="menu-section-head">
                <h2>{category.title}</h2>
                <a className="small-order" href="/order">
                  {category.orderLabel}
                </a>
              </div>
              <div className="product-grid">
                {category.items
                  .filter((item) => item.active !== false)
                  .map((item) => (
                    <article className="product-card has-image" key={item.id}>
                      <img src={productImageUrl(item.image)} alt={item.name} loading="lazy" />
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                      </div>
                      <strong>{item.price}</strong>
                    </article>
                  ))}
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
