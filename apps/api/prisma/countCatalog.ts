export const COUNT_LISTS: Array<{
  id: string;
  title: string;
  categories: Array<{ id: string; name: string; products: Array<{ id: string; name: string }> }>;
}> = [
  {
    id: "lijst-start",
    title: "Lijst start",
    categories: [
      {
        id: "start-meat-protein",
        name: "Meat / Protein",
        products: [
          { id: "start-pulled-chicken", name: "Pulled Chicken" },
          { id: "start-ground-beef", name: "Ground Beef" },
          { id: "start-pulled-beef", name: "Pulled Beef" },
          { id: "start-jackfruit", name: "Jackfruit" },
          { id: "start-beans", name: "Beans" }
        ]
      },
      {
        id: "start-vegetables",
        name: "Vegetables",
        products: [
          { id: "start-bell-peppers", name: "Bell peppers" },
          { id: "start-onions-moons", name: "Onions Moons" },
          { id: "start-onions-diced", name: "Onions Diced" },
          { id: "start-onions-pickled", name: "Onions Pickled" },
          { id: "start-tomato", name: "Tomato" },
          { id: "start-lettuce", name: "Lettuce" },
          { id: "start-lime", name: "Lime" },
          { id: "start-fresh-coriander", name: "Fresh Coriander" },
          { id: "start-avocado", name: "Avocado" },
          { id: "start-guacamole", name: "Guacamole" }
        ]
      },
      {
        id: "start-sauces",
        name: "Sauces",
        products: [
          { id: "start-chicken-sauce", name: "Chicken Sauce" },
          { id: "start-beef-sauce", name: "Beef Sauce" },
          { id: "start-cilantro-sauce", name: "Cilantro Sauce" },
          { id: "start-chipotle-sauce", name: "Chipotle Sauce" },
          { id: "start-garlic-sauce", name: "Garlic Sauce" },
          { id: "start-birria", name: "Birria" }
        ]
      }
    ]
  },
  {
    id: "lijst-sluit",
    title: "Lijst sluit",
    categories: [
      {
        id: "spices-sauzen",
        name: "Spices & Sauzen",
        products: [
          { id: "spices-for-fries", name: "Spices for fries" },
          { id: "salt", name: "Salt" },
          { id: "cinnamon-powder", name: "Cinnamon powder" },
          { id: "sugar-bags", name: "Sugar bags" },
          { id: "samurai-saus", name: "Samurai saus" },
          { id: "mayo-850ml", name: "Mayo 850ml" },
          { id: "ketchup-850ml", name: "Ketchup 850ml" },
          { id: "chocolade-topping-500ml", name: "Chocolade topping 500ml" },
          { id: "jalapeno-blik", name: "Jalapeno blik" },
          { id: "parboiled-rice-25kg", name: "Parboiled rice 25kg" }
        ]
      },
      {
        id: "frying-products",
        name: "Frying Products",
        products: [
          { id: "fries-l-weston-901", name: "Fries L. weston 901" },
          { id: "twister-fries", name: "Twister fries" },
          { id: "chilli-cheese-nuggets", name: "Chilli cheese nuggets" },
          { id: "churros-per-bag", name: "Churros per bag" },
          { id: "beef-empanadas", name: "Beef empanadas" }
        ]
      },
      {
        id: "dranken",
        name: "Dranken",
        products: [
          { id: "cola", name: "Cola" },
          { id: "cola-zero", name: "Cola zero" },
          { id: "fanta-exotic", name: "Fanta exotic" },
          { id: "fanta-orange", name: "Fanta orange" },
          { id: "ice-thee-green", name: "Ice thee green" },
          { id: "ice-thee-peach", name: "Ice thee peach" },
          { id: "spa-blauw", name: "Spa blauw" },
          { id: "spa-rood", name: "Spa rood" },
          { id: "spa-strawberry-watermelon", name: "Spa strawberry watermelon" },
          { id: "redbull", name: "RedBull" },
          { id: "jarritos-mandarin", name: "Jarritos mandarin" },
          { id: "jarritos-mango", name: "Jarritos mango" },
          { id: "jarritos-strawberry", name: "Jarritos strawberry" },
          { id: "jarritos-passion-fruit", name: "Jarritos passion fruit" },
          { id: "jarritos-pineapple", name: "Jarritos pineapple" },
          { id: "jarritos-guava", name: "Jarritos guava" },
          { id: "jarritos-lime", name: "Jarritos lime" },
          { id: "jarritos-cola", name: "Jarritos cola" },
          { id: "jarritos-fruit-punch", name: "Jarritos fruit punch" },
          { id: "jarritos-grapefruit", name: "Jarritos grapefruit" },
          { id: "kleine-fles-water-dolu", name: "Kleine fles water DOLU" }
        ]
      },
      {
        id: "verpakking",
        name: "Verpakking",
        products: [
          { id: "sauce-bakes-50cc", name: "Sauce bakes 50cc" },
          { id: "plastic-bags", name: "Plastic bags" },
          { id: "napkins", name: "Napkins" },
          { id: "aluminium-foil", name: "Aluminium foil" },
          { id: "plastic-foil", name: "Plastic foil" },
          { id: "maaltijdbox-1300ml", name: "Maaltijdbox 1300ml" },
          { id: "handschoenen-l-zwart", name: "Handschoenen maat L zwart" },
          { id: "patat-bakjes-a13", name: "Patat bakjes A13 (Snack tray)" },
          { id: "papierzak-05-pond", name: "Papierzak 0,5 pond (Snack bags)" },
          { id: "papierzak-15-ons", name: "Papierzak 1.5 ons (Snack bags)" },
          { id: "papier-draagtas", name: "Papier draagtas (32x18x27)" },
          { id: "vuilniszakken-120l", name: "Vuilniszakken 120 liter" },
          { id: "tork-rol", name: "Tork rol" }
        ]
      },
      {
        id: "verpakking-takeaway",
        name: "Verpakking takeaway",
        products: [
          { id: "grease-paper", name: "Grease paper" },
          { id: "bowls-1100ml", name: "Bowls 1100 ml" },
          { id: "lids-for-bowls", name: "Lids for bowls" },
          { id: "printer-receipts", name: "Printer receipts" },
          { id: "birria-bakjes-deksel", name: "Birria bakjes deksel" },
          { id: "birria-bakjes", name: "Birria bakjes" },
          { id: "cheese-cake-box", name: "Cheese cake box" },
          { id: "straw", name: "Straw" },
          { id: "fork", name: "Fork" },
          { id: "spoon", name: "Spoon" }
        ]
      },
      {
        id: "viking",
        name: "Viking",
        products: [{ id: "nietjes-stapels", name: "Nietjes (stapels)" }]
      },
      {
        id: "desserts-snacks",
        name: "Desserts & Snacks",
        products: [
          { id: "cookies-doos", name: "Cookies (doos)" },
          { id: "brownies-doos", name: "Brownies (doos)" },
          { id: "cheesecake-doos", name: "Cheesecake (doos)" }
        ]
      },
      {
        id: "tortillas",
        name: "Tortilla's",
        products: [
          { id: "tortillas-30cm", name: "Tortillas 30 cm" },
          { id: "tortillas-16cm", name: "Tortillas 16 cm" }
        ]
      },
      {
        id: "ah",
        name: "AH",
        products: [
          { id: "fish", name: "Fish" },
          { id: "sweet-corn", name: "Sweet corn" },
          { id: "siroop", name: "Siroop" },
          { id: "tortilla-chips", name: "Tortilla chips" },
          { id: "toilet-paper", name: "Toilet paper" },
          { id: "cheese-mix", name: "Cheese mix" },
          { id: "sour-cream", name: "Sour cream" },
          { id: "frying-oil", name: "Frying oil" },
          { id: "sunflower-oil-fles", name: "Sunflower oil fles" }
        ]
      },
      {
        id: "mexus-food",
        name: "Mexus Food",
        products: [
          { id: "salsa-verde-fles", name: "Salsa verde fles" },
          { id: "habanero-fles", name: "Habanero fles" },
          { id: "chilliflakes", name: "Chilliflakes" },
          { id: "sesamzaad", name: "Sesamzaad" },
          { id: "gebakken-uitjes", name: "Gebakken uitjes" }
        ]
      }
    ]
  }
];
