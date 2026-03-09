/**
 * The Pie Lab — Knowledge Hub Content Data
 *
 * Four content collections powering the tabbed Knowledge Hub:
 *   STYLE_LIBRARY     — History, authenticity, and regional debates
 *   TOPPING_COMBOS    — Classic, modern, and seasonal combos per style
 *   FLOUR_GUIDE       — Flour types, dough effects, and where to buy
 *   CHEESE_SAUCE_GUIDE — Cheese profiles, sauce types, and pairing matrix
 *
 * Keys in STYLE_LIBRARY and TOPPING_COMBOS match PIZZA_RECIPES keys
 * for contextual cross-referencing from the calculator.
 */

// ── Style Library ───────────────────────────────────
const STYLE_LIBRARY = {
  neapolitan: {
    name: "Neapolitan",
    origin: "Naples, Italy — late 18th century",
    story:
      "Neapolitan pizza traces its roots to the working-class neighborhoods of Naples, where flatbreads topped with tomato, garlic, and lard were sold from open-air stalls as cheap, fast food for laborers. The Margherita — topped with tomato, mozzarella, and basil to honor Queen Margherita of Savoy in 1889 — cemented pizza as a dish worth celebrating. By the early 1900s, dedicated pizzerias like Da Michele and Sorbillo had become institutions, cooking pies in blisteringly hot wood-fired ovens that charred the crust in 60 to 90 seconds.",
    authenticity:
      "In 1984, the Associazione Verace Pizza Napoletana (VPN) was founded to codify what makes a Neapolitan pizza authentic: Tipo 00 flour, San Marzano tomatoes, fresh mozzarella di bufala or fior di latte, hand-stretched dough (never a rolling pin), and a wood-fired oven reaching at least 430\u00B0C (806\u00B0F). The cornicione should be puffy, leopard-spotted, and slightly charred. The center stays soft — you fold it, not slice it, in Naples.",
    debates:
      "Purists argue that only Margherita and Marinara are true Neapolitan pizzas. Modern pizzaioli push back with seasonal toppings, burrata, and even dessert pizzas. Outside Italy, the biggest debate is temperature: can you make a legitimate Neapolitan in a home oven with a pizza steel, or does it require 900\u00B0F? The answer depends on who you ask \u2014 and how charred you like your crust.",
    keyFacts: [
      { label: "Certified Since", value: "1984 (VPN)" },
      { label: "Signature", value: "Soft center, charred leopard-spotted cornicione" },
      { label: "Oven Type", value: "Wood-fired, 800\u2013900\u00B0F" },
    ],
  },

  "new-york": {
    name: "New York Style",
    origin: "New York City, USA — early 1900s",
    story:
      "Italian immigrants brought pizza to New York in the early 20th century, but the style evolved into something distinctly American. Gennaro Lombardi opened what is often cited as America's first pizzeria on Spring Street in Manhattan in 1905, baking pies in a coal-fired oven. The New York slice \u2014 large, thin, foldable, sold by the slice from a glass counter \u2014 became the city's defining street food. Coal gave way to gas deck ovens, but the DNA stayed: high-gluten flour, low-moisture mozzarella, and a thin layer of sweet, slightly cooked tomato sauce.",
    authenticity:
      "A real New York slice is wide enough to fold in half lengthwise. The crust is thin but pliable, not cracker-crisp. The cheese is low-moisture mozzarella \u2014 never fresh \u2014 that browns and blisters in the oven. The sauce is lightly cooked and slightly sweet. Many swear the secret ingredient is New York City tap water, which has unusually low mineral content. Whether that actually matters is one of pizza's great unsettled debates.",
    debates:
      "The eternal question: is it the water? New York pizza makers who relocate swear something changes. Scientists say the mineral content could affect gluten development, but the evidence is thin. More practically: coal-fired vs. gas oven is the real dividing line. Purists say coal is non-negotiable. Dollar slice vs. artisan slice is another fault line \u2014 both claim to be the \u201Creal\u201D New York experience.",
    keyFacts: [
      { label: "First Pizzeria", value: "Lombardi's, 1905" },
      { label: "Signature", value: "The fold \u2014 large, thin, pliable" },
      { label: "Oven Type", value: "Coal-fired or gas deck, 500\u2013550\u00B0F" },
    ],
  },

  "chicago-tavern": {
    name: "Chicago Tavern",
    origin: "Chicago South Side, USA — mid-20th century",
    story:
      "While deep dish gets all the tourist attention, ask any Chicagoan what they actually eat on a Friday night and the answer is tavern-style: a cracker-thin crust, cut into squares, served on a round pan. It was born in the neighborhood taverns of Chicago's South Side, where pizza was bar food \u2014 cheap, shareable, and designed to keep people drinking. The crust is rolled thin with a rolling pin, not stretched by hand, giving it that signature snap.",
    authenticity:
      "Authentic tavern-style uses all-purpose flour for a lower-gluten, crispier crust. The dough is cold-proofed for 2 to 4 days, which develops flavor and makes it easier to roll paper-thin. It's always cut in squares (the \u201Cparty cut\u201D or \u201Ctavern cut\u201D) \u2014 never triangles. Toppings go edge-to-edge with no raised crust border. Sausage is the signature protein, applied raw and in large crumbles so it cooks directly on the pizza.",
    debates:
      "The biggest debate in Chicago isn't deep dish vs. New York \u2014 it's deep dish vs. tavern. Most locals will tell you deep dish is for tourists and tavern is the real Chicago pizza. Within tavern style, the arguments are about crust thickness (cracker-thin vs. slightly bready), sausage (crumbled vs. patty), and whether giardiniera belongs on the pizza or on the side. It always belongs on the pizza.",
    keyFacts: [
      { label: "Also Called", value: "Party cut, bar pizza, thin crust" },
      { label: "Signature", value: "Cracker-thin, square-cut, edge-to-edge toppings" },
      { label: "Key Topping", value: "Crumbled Italian sausage" },
    ],
  },

  detroit: {
    name: "Detroit Deep Dish",
    origin: "Detroit, Michigan, USA — 1946",
    story:
      "Detroit-style pizza was born at Buddy's Rendezvous in 1946, when owner Gus Guerra began baking pizza in blue steel pans borrowed from the auto industry \u2014 the same pans used to hold small parts on the assembly line. The rectangular shape, the thick and airy focaccia-like crust, and the caramelized cheese edges (called \u201Cfrico\u201D) became the style's calling cards. It stayed a local secret for decades before exploding nationally in the 2010s.",
    authenticity:
      "The pan is everything. Traditional Detroit pans are blue steel, well-seasoned, and conduct heat aggressively to fry the bottom crust and caramelize the cheese at the edges. Wisconsin brick cheese (not mozzarella) is the traditional choice, pressed all the way to the pan walls so it melts against the hot steel. Sauce goes on top of the cheese in two or three thick stripes \u2014 the \u201Cracing stripes\u201D that are Detroit's visual signature.",
    debates:
      "Brick cheese vs. a mozzarella-cheddar blend is the main battleground. Traditionalists insist on brick cheese for its buttery melt and crispy edges. The pan debate is real too: can you make legit Detroit pizza in a standard cake pan, or do you need a proper blue steel Detroit pan? Most serious home bakers say the pan matters more than any other single variable.",
    keyFacts: [
      { label: "Birthplace", value: "Buddy's Rendezvous, 1946" },
      { label: "Signature", value: "Caramelized cheese crust (frico)" },
      { label: "Pan", value: "Blue steel industrial parts tray" },
    ],
  },

  sicilian: {
    name: "Sicilian",
    origin: "Sicily, Italy \u2192 adapted in NYC",
    story:
      "Sicilian pizza in America is descended from sfincione, a thick, spongy focaccia-like bread topped with tomato, onions, anchovies, and breadcrumbs that's been a street food in Palermo for centuries. When Sicilian immigrants arrived in New York, the style evolved \u2014 the toppings became more American (mozzarella replaced anchovies as the star), but the thick, oily, pan-baked crust remained. It became a staple of New York pizzerias alongside the classic thin slice.",
    authenticity:
      "A proper Sicilian square uses a high-hydration dough made with bread flour (sometimes blended with semolina for extra crunch and color). The dough is generously oiled and proofed directly in the pan for 2 or more hours until it fills every corner. The result should be thick, airy, and almost focaccia-like, with a golden fried bottom from all that oil. Toppings traditionally go sauce-over-cheese.",
    debates:
      "The American Sicilian vs. actual sfincione is a huge gap. In Sicily, sfincione has no mozzarella at all \u2014 it's onion, anchovy, tomato, breadcrumbs, and caciocavallo cheese. The American version is essentially a different food that shares an ancestor. Among American Sicilian bakers, the debate centers on dough thickness: should it be an inch thick and bready, or thinner and crispier? Both camps are passionate.",
    keyFacts: [
      { label: "Ancestor", value: "Sfincione (Palermo street food)" },
      { label: "Signature", value: "Thick, airy, square, fried bottom" },
      { label: "Pan", value: "Oiled sheet pan, proofed 2+ hours" },
    ],
  },

  grandma: {
    name: "Grandma",
    origin: "Long Island, New York — 1970s\u201380s",
    story:
      "Grandma pizza was born in Italian-American home kitchens on Long Island, where making pizza meant pressing dough into a well-oiled sheet pan and baking it with whatever was on hand \u2014 no specialty equipment, no professional oven. The name comes from exactly where you'd expect: this is the pizza your grandmother made. It entered pizzeria menus in the early 2000s when shops like Umberto's in New Hyde Park put it on the map, and it's since become a Long Island institution.",
    authenticity:
      "Grandma pizza is thinner than Sicilian \u2014 that's the critical distinction. The dough uses all-purpose flour (not bread flour), gets pressed thin into an oiled pan, and doesn't get a long rise. Sharp provolone rounds from the deli counter are layered across the dough first, then sauce is spread on top in dollops or stripes. Pecorino Romano is sprinkled over the sauce before baking. It should be crispy on the bottom, thin in the middle, and saucy on top.",
    debates:
      "Grandma vs. Sicilian is the big one: both are square, both are pan-baked, but Grandma is thinner with less rise time, and traditionally uses provolone instead of mozzarella. Some pizzerias blur the line, selling thick Grandma slices that are really just Sicilian with a different name. Long Islanders will correct you. The sauce-on-top layering order is non-negotiable for a real Grandma pie.",
    keyFacts: [
      { label: "Home Base", value: "Long Island, NY" },
      { label: "Signature", value: "Thin, oily, sauce-on-top, square cut" },
      { label: "Cheese", value: "Deli-sliced sharp provolone" },
    ],
  },

  "thin-crust": {
    name: "Thin & Crispy",
    origin: "American bar and home pizza tradition",
    story:
      "Thin and crispy pizza is the great American default \u2014 the pizza you make at home on a sheet pan, the pizza served at dive bars, the frozen pizza archetype. It doesn't have the regional prestige of Neapolitan or the cult following of Detroit, but it might be the most widely eaten style in the country. The goal is simple: a cracker-crisp crust that shatters when you bite it, minimal dough, maximum topping-to-crust ratio.",
    authenticity:
      "There's no certification body for thin and crispy \u2014 it's a freestyle category. The common thread is a low-hydration dough (around 55%) rolled as thin as possible with a rolling pin, then docked with a fork to prevent bubbles. All-purpose flour keeps the gluten low so the crust stays crunchy rather than chewy. It's best baked on a preheated stone or steel at the highest temperature your oven can manage.",
    debates:
      "The line between thin-crust and tavern-style is blurry. Some argue they're the same thing; others say tavern-style is a specific Chicago tradition while thin-crust is a broader national style. The other debate is toppings: thin crust can't handle heavy toppings without getting soggy, so minimalism is key. How minimal is a matter of personal philosophy.",
    keyFacts: [
      { label: "Also Called", value: "Bar pizza, cracker crust" },
      { label: "Signature", value: "Cracker-crisp, docked, minimal dough" },
      { label: "Hydration", value: "~55% (low)" },
    ],
  },

  pan: {
    name: "Pan Pizza",
    origin: "American home and chain tradition — 1960s\u2013present",
    story:
      "Pan pizza's mainstream moment came in 1980 when Pizza Hut launched its Pan Pizza nationally, but the style existed long before that in home kitchens and local pizzerias. The concept is simple: press a high-hydration dough into a generously oiled cast iron skillet or cake pan, let it proof until puffy, then bake until the bottom is golden and fried. The home cast iron revival of the 2010s brought pan pizza back as a serious homemade style, with bakers using Lodge skillets and 48-hour cold ferments.",
    authenticity:
      "A great pan pizza has three signatures: a golden fried bottom crust (from the oil in the pan), a thick and airy interior with visible air pockets, and cheese that melts down the sides to crisp against the pan. The dough should be high-hydration (70%+) bread flour, cold-fermented for at least 24 hours. Traditionally, cheese goes under the sauce for pan pizza, creating a barrier that keeps the crust from getting soggy.",
    debates:
      "Cast iron vs. cake pan is the first argument. Cast iron retains more heat and gives a better fry on the bottom, but cake pans are lighter and easier to handle. The cheese question matters too: under the sauce (traditional) or over (modern)? And the big one: is Detroit pizza just a regional variation of pan pizza, or is it its own distinct style? Detroit purists have strong opinions.",
    keyFacts: [
      { label: "Key Tool", value: "Cast iron skillet or cake pan" },
      { label: "Signature", value: "Fried golden bottom, thick and airy" },
      { label: "Ferment", value: "24\u201348 hour cold proof" },
    ],
  },

  "st-louis": {
    name: "St. Louis",
    origin: "St. Louis, Missouri — mid-20th century",
    story:
      "St. Louis-style pizza was born in The Hill neighborhood, the city's Italian-American enclave. Ed and Margie Imo opened Imo's Pizza in 1964, popularizing a cracker-thin crust topped with Provel cheese — a processed blend of cheddar, Swiss, and provolone created by a local dairy. The pizza is cut into squares (party cut or tavern cut) and eaten without folding. It's a divisive style: locals are fiercely loyal, while outsiders often question the processed cheese.",
    authenticity:
      "Authentic St. Louis pizza requires Provel cheese — no substitutes. The crust must be unleavened and cracker-thin with no rise or puff. It is always cut into squares, never triangles. The sauce tends to be sweeter than New York or Neapolitan sauces, often with a noticeable oregano punch.",
    debates:
      "The biggest debate: is Provel cheese an abomination or a regional treasure? Outside Missouri, Provel is hard to find and even harder to love on first taste. But for St. Louisans, it's the whole point. There's also the question of whether a cracker crust with no yeast even counts as 'pizza dough.'",
    keyFacts: [
      { label: "Key Cheese", value: "Provel (processed blend)" },
      { label: "Crust", value: "Cracker-thin, no yeast" },
      { label: "Cut", value: "Squares (party cut)" },
      { label: "Icon Shop", value: "Imo's Pizza (1964)" },
    ],
  },

  "new-haven": {
    name: "New Haven Apizza",
    origin: "New Haven, Connecticut — early 1900s",
    story:
      "New Haven apizza (pronounced 'ah-BEETS') traces to Frank Pepe, a Neapolitan immigrant who started baking tomato pies in 1925 on Wooster Street. Pepe's and Sally's Apizza (opened by Pepe's nephew in 1938) created a rivalry that still defines the city's pizza identity. The style uses a coal-fired oven that reaches 600 to 800 degrees, producing a charred, blistered, thin crust with an irregular, oblong shape.",
    authenticity:
      "A true New Haven apizza is baked in a coal-fired oven — not wood, not gas. The default pie is a 'plain tomato pie' with no mozzarella (just sauce, garlic, pecorino, and olive oil). You add mozzarella as a topping. The crust is charred — sometimes aggressively — and that char is considered a feature, not a flaw.",
    debates:
      "Pepe's vs. Sally's vs. Modern is the eternal New Haven debate. The 'plain tomato pie' concept baffles outsiders who expect cheese on their pizza. The level of acceptable char is controversial — what New Haven calls 'well done,' most places would call 'burnt.' And the clam pie: genius or gimmick?",
    keyFacts: [
      { label: "Oven", value: "Coal-fired, 600–800°F" },
      { label: "Default Order", value: "Plain tomato pie (no mozz)" },
      { label: "Shape", value: "Oblong, irregular" },
      { label: "Icon Shop", value: "Frank Pepe's (1925)" },
    ],
  },

  "ohio-valley": {
    name: "Ohio Valley",
    origin: "Steubenville, Ohio / Ohio Valley — 1945",
    story:
      "Ohio Valley-style pizza originated at DiCarlo's Pizza in Steubenville, Ohio in 1945, where Primo DiCarlo used his family bakery's equipment to create something entirely new: a pizza topped with cold cheese after baking. The style spread across the upper Ohio River Valley into eastern Ohio, West Virginia, and western Pennsylvania. The defining feature is cold cheese — after the pizza comes out of the oven with sauce and toppings already baked, shredded provolone is piled on top and served immediately. The cheese partially melts from the residual heat but stays mostly unmelted, a texture unlike any other pizza style.",
    authenticity:
      "Authentic Ohio Valley pizza has cold shredded provolone applied after baking — this is non-negotiable. The crust is a medium-thickness, slightly bready rectangle. Pepperoni is baked on, but the cheese is always cold. The pizza is typically sold by the slice from a counter window and eaten immediately while the contrast between hot crust and cold cheese is at its peak.",
    debates:
      "The obvious debate: why would you put cold cheese on hot pizza? Defenders say the contrast of hot, saucy crust with cool, tangy cheese is the entire point — it's meant to be eaten immediately when the contrast is sharpest. Critics say it's just pizza that wasn't finished properly.",
    keyFacts: [
      { label: "Signature Move", value: "Cold cheese after bake" },
      { label: "Cheese", value: "Provolone, shredded cold" },
      { label: "Shape", value: "Rectangle, counter-cut" },
      { label: "Icon Shop", value: "DiCarlo's (1945)" },
    ],
  },

  "cast-iron": {
    name: "Cast Iron Skillet",
    origin: "Home kitchens — modern era",
    story:
      "Cast-iron pizza isn't tied to a specific city or tradition — it evolved in home kitchens as cooks discovered that a well-seasoned skillet produces an incredible crust. The butter (or oil) in the hot pan essentially fries the bottom of the dough, creating a golden, crispy base that rivals any pizzeria. It became a home-cooking phenomenon through food blogs and YouTube in the 2010s, offering pizzeria-quality results with minimal equipment.",
    authenticity:
      "There's no rigid authenticity standard for cast-iron pizza, which is part of its appeal. The core requirement is a preheated or stovetop-started cast-iron skillet. Butter in the pan is traditional for the fried-bottom effect. The dough is typically pressed into the pan and par-cooked on the stovetop before finishing in the oven. It's a technique-driven style rather than a tradition-driven one.",
    debates:
      "Butter vs. oil in the pan is the main debate — butter gives a richer, more golden crust but can burn. Stovetop-to-oven vs. all-oven is another: starting on the stove gives a crispier bottom but requires more attention. Some argue this is just pan pizza in a different pan, but the butter-fried bottom and stovetop start create a distinctly different result.",
    keyFacts: [
      { label: "Pan", value: "10–12″ cast iron skillet" },
      { label: "Fat", value: "Butter (traditional)" },
      { label: "Method", value: "Stovetop → oven" },
      { label: "Rise Time", value: "1–2 hours" },
    ],
  },

  "school-night": {
    name: "School Night (No Rise)",
    origin: "Home kitchens — modern convenience",
    story:
      "School Night pizza exists because sometimes you need pizza and you need it now. It skips the long fermentation that most serious dough recipes demand, using more yeast and immediate baking to get dinner on the table in about 30 minutes from start to finish. It's not going to win any pizza competitions, but it scratches the itch when ordering delivery feels like giving up and you want to make something with your own hands on a busy weeknight.",
    authenticity:
      "There are no authenticity rules for School Night pizza — the whole point is speed and flexibility. Use whatever flour you have, whatever cheese is in the fridge, whatever toppings the kids will eat. The only real requirement is that it works fast: no long rise, no special equipment, no planning ahead.",
    debates:
      "Purists will say no-rise pizza isn't real pizza, and they're not entirely wrong — the flavor complexity from fermentation is missing. But School Night pizza is honest about what it is: a quick, homemade alternative to delivery that's better than frozen. The debate is really about whether speed or craft matters more on a Tuesday night.",
    keyFacts: [
      { label: "Total Time", value: "~30 minutes" },
      { label: "Rise", value: "None" },
      { label: "Yeast", value: "High (compensates for no rise)" },
      { label: "Best For", value: "Weeknight dinners" },
    ],
  },
};

// ── Topping Combinations ────────────────────────────
const TOPPING_COMBOS = {
  neapolitan: {
    name: "Neapolitan",
    combos: [
      {
        tier: "Classic",
        name: "Margherita DOC",
        ingredients: ["San Marzano tomato", "Mozzarella di bufala", "Fresh basil", "EVOO"],
        why: "The original. Simplicity lets the dough and sauce shine.",
      },
      {
        tier: "Modern",
        name: "Burrata & Prosciutto",
        ingredients: ["Crushed tomato", "Burrata (added after bake)", "Prosciutto di Parma", "Arugula"],
        why: "Creamy burrata melts over hot crust; prosciutto adds salt and richness.",
      },
      {
        tier: "Seasonal",
        name: "Summer Garden",
        ingredients: ["Cherry tomato halves", "Stracciatella", "Zucchini blossom", "Basil oil"],
        why: "Light toppings that won't weigh down the delicate Neapolitan base.",
      },
    ],
  },

  "new-york": {
    name: "New York Style",
    combos: [
      {
        tier: "Classic",
        name: "The Regular Slice",
        ingredients: ["Cooked tomato sauce", "Low-moisture mozzarella", "Dried oregano", "Grated Parm"],
        why: "The benchmark. Every New York slice is measured against this.",
      },
      {
        tier: "Modern",
        name: "White Pie with Truffle",
        ingredients: ["Ricotta", "Low-moisture mozz", "Garlic oil", "Truffle honey drizzle"],
        why: "No sauce \u2014 the ricotta and garlic oil create richness that truffle honey lifts.",
      },
      {
        tier: "Seasonal",
        name: "Fall Harvest",
        ingredients: ["Cooked sauce", "Mozz", "Roasted butternut squash", "Crispy sage", "Brown butter"],
        why: "Earthy and savory. The brown butter ties squash and sage together.",
      },
    ],
  },

  "chicago-tavern": {
    name: "Chicago Tavern",
    combos: [
      {
        tier: "Classic",
        name: "Sausage & Giardiniera",
        ingredients: ["Crushed tomato sauce", "Low-moisture mozz", "Italian sausage (raw crumbles)", "Hot giardiniera"],
        why: "The definitive tavern combo. Spicy, meaty, crispy crust underneath.",
      },
      {
        tier: "Modern",
        name: "BBQ Chicken Tavern",
        ingredients: ["BBQ sauce base", "Mozz and cheddar blend", "Grilled chicken", "Red onion", "Cilantro"],
        why: "The thin crispy crust handles the sweet-smoky BBQ without going soggy.",
      },
      {
        tier: "Seasonal",
        name: "Italian Beef Pizza",
        ingredients: ["Crushed tomato", "Mozz", "Thinly sliced Italian beef", "Sweet peppers", "Giardiniera"],
        why: "A Chicago mashup that puts an Italian beef sandwich on a tavern crust.",
      },
    ],
  },

  detroit: {
    name: "Detroit Deep Dish",
    combos: [
      {
        tier: "Classic",
        name: "Pepperoni with Racing Stripes",
        ingredients: ["Wisconsin brick cheese", "Pepperoni (under cheese)", "Tomato stripe sauce on top"],
        why: "Brick cheese + pepperoni + frico edges = the Detroit holy trinity.",
      },
      {
        tier: "Modern",
        name: "Supreme Motor City",
        ingredients: ["Brick cheese + mozz blend", "Pepperoni", "Sausage", "Mushroom", "Green pepper", "Red onion", "Stripe sauce"],
        why: "Loaded but the thick Detroit crust can handle the weight.",
      },
      {
        tier: "Seasonal",
        name: "Mushroom & Truffle",
        ingredients: ["Brick cheese", "Mixed wild mushrooms (roasted)", "Garlic confit", "Thyme", "White stripe sauce"],
        why: "Earthy mushrooms contrast with the rich, buttery brick cheese crust.",
      },
    ],
  },

  sicilian: {
    name: "Sicilian",
    combos: [
      {
        tier: "Classic",
        name: "Traditional Square",
        ingredients: ["Low-moisture mozz (under)", "Crushed tomato (over)", "Pecorino Romano", "Olive oil"],
        why: "Cheese-under-sauce is the Sicilian way. Simple, thick, satisfying.",
      },
      {
        tier: "Modern",
        name: "Vodka Sicilian",
        ingredients: ["Mozz (under)", "Vodka sauce (over)", "Fresh ricotta dollops", "Basil"],
        why: "Creamy vodka sauce is a perfect match for the thick, absorbent Sicilian crust.",
      },
      {
        tier: "Seasonal",
        name: "Sfincione-Inspired",
        ingredients: ["Anchovy", "Caramelized onion", "Breadcrumbs", "Caciocavallo", "Oregano"],
        why: "A nod to the Sicilian ancestor. Bold, salty, and deeply savory.",
      },
    ],
  },

  grandma: {
    name: "Grandma",
    combos: [
      {
        tier: "Classic",
        name: "Long Island Original",
        ingredients: ["Sharp provolone rounds (under)", "Crushed tomato with garlic (over)", "Pecorino Romano", "Olive oil"],
        why: "Provolone under sauce is what makes a Grandma pie a Grandma pie.",
      },
      {
        tier: "Modern",
        name: "Pesto Grandma",
        ingredients: ["Fresh mozz slices", "Basil pesto (over)", "Cherry tomato halves", "Pine nuts"],
        why: "The thin oily crust is a perfect canvas for pesto instead of tomato sauce.",
      },
      {
        tier: "Seasonal",
        name: "Summer Grandma",
        ingredients: ["Provolone (under)", "Fresh tomato slices (over, uncooked)", "Garlic", "Fresh basil", "Flaky salt"],
        why: "Peak summer tomatoes on a Grandma pie need almost nothing else.",
      },
    ],
  },

  "thin-crust": {
    name: "Thin & Crispy",
    combos: [
      {
        tier: "Classic",
        name: "Margherita Cracker",
        ingredients: ["Thin tomato sauce", "Fresh mozz slices", "Basil", "Olive oil"],
        why: "Light toppings keep the thin crust crispy. Less is more here.",
      },
      {
        tier: "Modern",
        name: "Fig & Prosciutto",
        ingredients: ["Garlic cream base", "Fontina", "Fig jam", "Prosciutto (after bake)", "Arugula"],
        why: "Sweet, salty, creamy \u2014 the cracker crust adds texture without competing.",
      },
      {
        tier: "Seasonal",
        name: "Peach & Burrata",
        ingredients: ["Olive oil base", "Burrata (after bake)", "Grilled peach slices", "Basil", "Balsamic reduction"],
        why: "Summer stone fruit and burrata on a crispy crust is peak seasonal pizza.",
      },
    ],
  },

  pan: {
    name: "Pan Pizza",
    combos: [
      {
        tier: "Classic",
        name: "Cheese-Under Pan",
        ingredients: ["Mozz and cheddar blend (under)", "Cooked tomato sauce (over)", "Oregano"],
        why: "Cheese under sauce keeps the thick crust from going soggy.",
      },
      {
        tier: "Modern",
        name: "Buffalo Chicken Pan",
        ingredients: ["Ranch base", "Mozz", "Crispy buffalo chicken", "Pickled jalape\u00F1o", "Blue cheese crumble"],
        why: "The thick pan crust stands up to bold, wet toppings like buffalo sauce.",
      },
      {
        tier: "Seasonal",
        name: "Sausage & Apple",
        ingredients: ["Garlic oil base", "Mozz", "Italian sausage", "Thinly sliced apple", "Sage"],
        why: "A fall combination \u2014 sausage and apple are a classic pairing the thick crust can hold.",
      },
    ],
  },

  "st-louis": {
    name: "St. Louis",
    combos: [
      {
        tier: "Classic",
        name: "The Deluxe (STL Classic)",
        ingredients: ["Provel cheese", "Sweet sauce", "Sausage", "Pepperoni", "Mushroom", "Green pepper", "Onion"],
        why: "The 'deluxe' is the default order at most St. Louis pizza joints — loaded toppings on cracker crust.",
      },
      {
        tier: "Modern",
        name: "BBQ Chicken STL",
        ingredients: ["Provel cheese", "BBQ sauce base", "Grilled chicken", "Red onion", "Cilantro"],
        why: "The gooey Provel works surprisingly well with sweet-smoky BBQ — a modern STL favorite.",
      },
      {
        tier: "Seasonal",
        name: "Garden Tomato & Basil",
        ingredients: ["Provel cheese", "Fresh tomato slices", "Basil", "Garlic oil drizzle"],
        why: "Summer tomatoes shine on the thin cracker crust with melted Provel underneath.",
      },
    ],
  },

  "new-haven": {
    name: "New Haven Apizza",
    combos: [
      {
        tier: "Classic",
        name: "Plain Tomato Pie",
        ingredients: ["Crushed tomato", "Garlic", "Pecorino Romano", "Olive oil"],
        why: "The original — no mozzarella. The charred crust, bright sauce, and salty pecorino are all you need.",
      },
      {
        tier: "Classic",
        name: "White Clam Pie",
        ingredients: ["Fresh littleneck clams", "Garlic", "Olive oil", "Pecorino", "Oregano"],
        why: "Pepe's white clam pie is legendary — briny clams, garlic, oil, no tomato, no mozzarella.",
      },
      {
        tier: "Modern",
        name: "Mashed Potato & Bacon",
        ingredients: ["Mozzarella", "Mashed potato", "Bacon", "Scallion", "Sour cream drizzle"],
        why: "A BAR specialty — the coal-fired char balances the richness of potato and bacon.",
      },
      {
        tier: "Seasonal",
        name: "Fig & Prosciutto",
        ingredients: ["Mozzarella", "Fresh figs", "Prosciutto (after bake)", "Arugula", "Honey drizzle"],
        why: "Late-summer figs with the aggressive char of a coal oven — sweet, salty, bitter, smoky.",
      },
    ],
  },

  "ohio-valley": {
    name: "Ohio Valley",
    combos: [
      {
        tier: "Classic",
        name: "The DiCarlo's Standard",
        ingredients: ["Baked: Tomato sauce, pepperoni", "After bake: Cold shredded provolone"],
        why: "Hot pepperoni, bright sauce, cold tangy cheese — the signature Ohio Valley contrast.",
      },
      {
        tier: "Modern",
        name: "Italian Cold Cut",
        ingredients: ["Baked: Sauce, pepperoni", "After bake: Cold provolone, shredded lettuce, Italian dressing"],
        why: "An Italian sub meets pizza — the cold toppings on hot crust blur the line.",
      },
      {
        tier: "Seasonal",
        name: "Garden Fresh OV",
        ingredients: ["Baked: Sauce, light mozz", "After bake: Cold provolone, diced fresh tomato, basil"],
        why: "Summer garden tomatoes added cold with the cheese amplify the hot-cold contrast.",
      },
    ],
  },

  "cast-iron": {
    name: "Cast Iron",
    combos: [
      {
        tier: "Classic",
        name: "Butter Crust Margherita",
        ingredients: ["Fresh mozzarella", "Crushed tomato", "Fresh basil", "Butter in pan"],
        why: "The butter-fried bottom adds richness to the classic Margherita — simple and stunning.",
      },
      {
        tier: "Modern",
        name: "Breakfast Pizza",
        ingredients: ["Mozzarella", "Scrambled eggs", "Bacon", "Cheddar", "Everything bagel seasoning"],
        why: "Cast iron is the natural breakfast vessel — the buttery crust is already halfway to a great egg dish.",
      },
      {
        tier: "Seasonal",
        name: "Wild Mushroom & Fontina",
        ingredients: ["Fontina cheese", "Mixed wild mushrooms", "Thyme", "Truffle oil", "Garlic"],
        why: "Fall mushrooms with nutty fontina in a butter-crisped crust — earthy, rich, satisfying.",
      },
    ],
  },

  "school-night": {
    name: "School Night (No Rise)",
    combos: [
      {
        tier: "Classic",
        name: "The Weeknight Special",
        ingredients: ["Shredded mozzarella", "Jarred marinara", "Pepperoni"],
        why: "Three ingredients from the fridge. Fast, familiar, and better than delivery.",
      },
      {
        tier: "Modern",
        name: "Pesto Chicken",
        ingredients: ["Mozzarella", "Basil pesto", "Shredded rotisserie chicken", "Sun-dried tomato", "Parmesan"],
        why: "Rotisserie chicken + jarred pesto = zero-effort flavor. No-rise dough keeps it quick.",
      },
      {
        tier: "Seasonal",
        name: "Leftover Night",
        ingredients: ["Mozzarella", "Whatever protein is in the fridge", "Whatever veggies need using up"],
        why: "School Night pizza is the ultimate fridge cleaner — speed and flexibility over precision.",
      },
    ],
  },
};

// ── Flour Guide ─────────────────────────────────────
const FLOUR_GUIDE = {
  "tipo-00": {
    name: "Tipo 00 Flour",
    proteinContent: "11\u201312.5%",
    description:
      "Tipo 00 refers to the Italian milling classification \u2014 it's the finest grind available, producing a silky, powdery flour. The \u201C00\u201D doesn't indicate protein content (which varies by brand), but the texture of the grind. This fine texture creates a smooth, extensible dough that stretches easily without tearing.",
    doughEffect:
      "Produces an extensible, elastic dough that's easy to hand-stretch into thin rounds. The fine grind hydrates quickly and evenly. The resulting crust is tender with a slight chew and distinctive charred blisters when baked at high temperatures. Lower protein 00 flours (like Caputo Red) make softer, more cake-like crusts; higher protein versions (like Caputo Blue) develop more gluten structure.",
    bestUses: ["Neapolitan", "Wood-fired pizza", "High-temperature baking"],
    buyLinks: [
      { brand: "Caputo Pizzeria (Blue)", url: "https://www.amazon.com/s?k=caputo+pizzeria+00+flour", note: "Industry standard for Neapolitan" },
      { brand: "Caputo Nuvola (Sky Blue)", url: "https://www.amazon.com/s?k=caputo+nuvola+flour", note: "Higher hydration, lighter crumb" },
      { brand: "Le 5 Stagioni", url: "https://www.amazon.com/s?k=le+5+stagioni+00+pizza+flour", note: "Great alternative, slightly lower absorption" },
      { brand: "Antimo Caputo Chef's (Red)", url: "https://www.amazon.com/s?k=caputo+chef+flour+red+bag", note: "Finer grind, lower protein, softer crust" },
    ],
  },

  "high-gluten": {
    name: "High-Gluten Bread Flour",
    proteinContent: "14\u201314.5%",
    description:
      "High-gluten flour is the workhorse of New York pizzerias. With protein content above 14%, it develops an exceptionally strong gluten network that gives NY-style pizza its signature chew. This flour is milled from hard spring wheat and is stronger than standard bread flour, designed specifically for applications that need maximum structure.",
    doughEffect:
      "Creates a very strong, elastic dough that can be stretched thin without tearing. The high protein content means the dough can absorb more water while maintaining structure. The resulting crust is chewy and foldable when warm, with a satisfying resistance when you bite through it. Cold fermentation (24\u201372 hours) is essential to relax the tight gluten and develop complex flavor.",
    bestUses: ["New York style", "Any recipe needing maximum chew"],
    buyLinks: [
      { brand: "King Arthur Sir Lancelot", url: "https://www.amazon.com/s?k=king+arthur+sir+lancelot+flour", note: "14.2% protein, the gold standard" },
      { brand: "General Mills All Trumps", url: "https://www.amazon.com/s?k=all+trumps+high+gluten+flour", note: "Industry standard for NY shops" },
      { brand: "Full Court Press", url: "https://www.amazon.com/s?k=full+court+press+flour", note: "Similar to All Trumps, widely available" },
    ],
  },

  "all-purpose": {
    name: "All-Purpose Flour",
    proteinContent: "10\u201312%",
    description:
      "All-purpose flour is the most versatile and accessible option. It's a blend of hard and soft wheat, giving it moderate protein content that works across many pizza styles. It won't develop as much gluten as bread flour, which is actually the point for styles that want a crispy or tender crust rather than a chewy one.",
    doughEffect:
      "Produces a more relaxed dough that's easy to roll with a pin (important for tavern-style and thin crust). The moderate gluten development means the crust bakes up crispy and tender rather than chewy. AP flour is also more forgiving \u2014 it's harder to over-knead, and the dough is easier to shape. The tradeoff is less structure, so it can't handle very high hydration levels.",
    bestUses: ["Chicago Tavern", "Grandma", "Thin & Crispy", "General home baking"],
    buyLinks: [
      { brand: "King Arthur AP", url: "https://www.amazon.com/s?k=king+arthur+all+purpose+flour", note: "11.7% protein \u2014 higher than most AP" },
      { brand: "Gold Medal AP", url: "https://www.amazon.com/s?k=gold+medal+all+purpose+flour", note: "10.5% protein, the standard baseline" },
      { brand: "Heckers / Ceresota", url: "https://www.amazon.com/s?k=heckers+ceresota+flour", note: "Northeast favorite, ~11.5% protein" },
    ],
  },

  "bread-flour": {
    name: "Bread Flour",
    proteinContent: "12\u201313%",
    description:
      "Bread flour sits between all-purpose and high-gluten flour. It's milled from hard wheat with enough protein to develop good gluten structure, but not so much that the dough becomes difficult to handle. This makes it the ideal choice for thick, puffy pizza styles that need structure to hold their shape but also want an airy, open crumb.",
    doughEffect:
      "Creates a dough with good elasticity and a strong enough gluten network to handle high hydration (68\u201372%). The resulting crust is chewy but not tough, with an open, airy crumb that's almost focaccia-like in thick applications. Bread flour is especially good for pan-style pizzas where you want the dough to puff up and develop air pockets during a long proof in the pan.",
    bestUses: ["Detroit", "Pan Pizza", "Sicilian", "Any thick/puffy style"],
    buyLinks: [
      { brand: "King Arthur Bread Flour", url: "https://www.amazon.com/s?k=king+arthur+bread+flour", note: "12.7% protein, the reliable choice" },
      { brand: "Gold Medal Better for Bread", url: "https://www.amazon.com/s?k=gold+medal+better+for+bread+flour", note: "12.5% protein, widely available" },
      { brand: "Bob's Red Mill Artisan Bread", url: "https://www.amazon.com/s?k=bobs+red+mill+artisan+bread+flour", note: "Great for long cold ferments" },
      { brand: "Central Milling Organic Bread", url: "https://www.amazon.com/s?k=central+milling+organic+bread+flour", note: "High-quality, consistent results" },
    ],
  },

  "semolina-blend": {
    name: "Semolina / Bread Flour Blend",
    proteinContent: "12\u201313% (blend dependent)",
    description:
      "Semolina is coarsely ground durum wheat flour with a golden yellow color and high protein content. On its own it makes a very stiff dough, so it's typically blended with bread flour at a 20\u201330% ratio. The blend gives pizza crust a distinctive golden color, a slightly gritty crunch, and a nutty, wheaty flavor that regular bread flour can't match.",
    doughEffect:
      "The semolina component absorbs water more slowly than wheat flour, so the dough needs a longer autolyse (rest period) before it comes together. Once hydrated, the blend produces a dough that's slightly stiffer to work with but bakes into a crust with audible crunch and gorgeous golden color. The bread flour in the blend provides the gluten structure for rise, while semolina adds the texture and flavor.",
    bestUses: ["Sicilian", "Grandma (variation)", "Focaccia-style"],
    buyLinks: [
      { brand: "Caputo Semola Rimacinata", url: "https://www.amazon.com/s?k=caputo+semola+rimacinata", note: "Fine re-milled, high absorption" },
      { brand: "Bob's Red Mill Semolina", url: "https://www.amazon.com/s?k=bobs+red+mill+semolina+flour", note: "Coarser grind, great crunch" },
    ],
  },
};

// ── Cheese & Sauce Guide ────────────────────────────
const CHEESE_SAUCE_GUIDE = {
  cheeses: [
    {
      id: "fresh-mozz",
      name: "Fresh Mozzarella",
      description:
        "High-moisture, milky, and delicate. Fresh mozzarella (fior di latte or mozzarella di bufala) melts into soft, creamy pools rather than a uniform sheet. It releases moisture during baking, so it works best on pizzas that bake fast at high heat \u2014 giving the cheese just enough time to melt without flooding the crust.",
      tips: "Slice into rounds and drain on paper towels for 20\u201330 minutes before topping. Never shred fresh mozzarella \u2014 it should tear or slice. On Neapolitan pizza, add it in torn chunks for the best melt pattern.",
      bestStyles: ["neapolitan"],
    },
    {
      id: "low-moisture-mozz",
      name: "Low-Moisture Mozzarella",
      description:
        "The workhorse of American pizza. Low-moisture mozzarella (whole milk, not part-skim) has less water content, so it melts into a uniform, stretchy, golden-brown sheet. It browns and blisters predictably, making it ideal for longer bakes at moderate temperatures where fresh mozzarella would release too much water.",
      tips: "Buy whole-milk low-moisture mozz in blocks and shred it yourself \u2014 pre-shredded contains anti-caking agents that affect melt. For the best stretch, let shredded cheese come to room temperature before topping.",
      bestStyles: ["new-york", "chicago-tavern", "sicilian", "grandma", "thin-crust", "new-haven", "st-louis", "cast-iron", "school-night"],
    },
    {
      id: "provolone",
      name: "Provolone (Sharp, Deli-Sliced)",
      description:
        "Sharp provolone has a tangy, assertive flavor that stands up to heavy tomato sauce and garlic. Deli-sliced rounds lay flat across the dough, creating an even layer that melts smoothly under the sauce. It's the traditional cheese for Grandma pizza, where its sharpness cuts through the oily, garlicky sauce.",
      tips: "Ask for it sliced thin at the deli counter \u2014 about 1/8 inch thick. Lay rounds slightly overlapping across the dough before adding sauce on top. Sharp provolone (aged 6+ months) has significantly more flavor than mild.",
      bestStyles: ["grandma", "ohio-valley"],
    },
    {
      id: "brick-cheese",
      name: "Wisconsin Brick Cheese",
      description:
        "A semi-soft, buttery American cheese with a mild, slightly tangy flavor. Brick cheese melts beautifully and is the traditional choice for Detroit-style pizza, where it's pushed to the edges of the pan to create the caramelized cheese crust (frico) that defines the style. It has higher fat content than mozzarella, which is what makes those crispy edges possible.",
      tips: "Push cubed or shredded brick cheese all the way to the pan walls. As it bakes, it melts down the sides of the dough and fries against the hot steel pan. If you can't find brick cheese, a 50/50 blend of Monterey Jack and mild cheddar is the closest substitute.",
      bestStyles: ["detroit"],
    },
    {
      id: "pecorino",
      name: "Pecorino Romano",
      description:
        "A hard, salty sheep's milk cheese from central Italy. Pecorino Romano is sharper and saltier than Parmesan, with a distinctive tang that adds depth as a finishing cheese. It's grated over the top of pizza before or after baking \u2014 never used as the primary melting cheese.",
      tips: "Buy it in wedges and grate it fresh. A Microplane gives a fine, snow-like texture that melts instantly. Use it sparingly \u2014 it's very salty. A tablespoon per pizza is usually enough. Add before baking for a toasted flavor, or after for a sharper hit.",
      bestStyles: ["sicilian", "grandma", "new-york", "new-haven"],
    },
    {
      id: "ricotta",
      name: "Ricotta",
      description:
        "A soft, creamy, slightly sweet fresh cheese. Ricotta is used as a topping dolloped in spoonfuls across the pizza, adding creamy richness that contrasts with acidic tomato sauce. It works best on styles with enough structure to hold the added moisture \u2014 thick crusts or fast-baked pies.",
      tips: "Use whole-milk ricotta, never part-skim. Drain it in a fine-mesh strainer for 30 minutes before use to remove excess whey. Dollop it in small spoonfuls rather than spreading \u2014 you want pockets of cream, not a uniform layer.",
      bestStyles: ["new-york", "sicilian", "pan"],
    },
    {
      id: "parmesan",
      name: "Parmesan (Parmigiano-Reggiano)",
      description:
        "A hard, granular, intensely savory cheese aged at least 12 months (often 24–36). True Parmigiano-Reggiano from Emilia-Romagna has a complex, nutty, umami-rich flavor that makes it an ideal finishing cheese. It doesn't melt into strings like mozzarella — instead it crisps and browns, adding salty, savory depth as a topping accent or mixed into other cheeses.",
      tips: "Buy it in wedges and grate fresh — pre-grated Parmesan has anti-caking agents and stale flavor. A Microplane gives a fine, fluffy texture; a box grater gives thicker shreds that crisp up when baked. Use it as a finishing touch after baking for maximum aroma, or mix into shredded mozzarella before baking for umami depth. A little goes a long way.",
      bestStyles: ["new-york", "thin-crust", "cast-iron", "school-night", "new-haven"],
    },
  ],

  sauces: [
    {
      id: "crushed-raw",
      name: "Crushed Tomato (Uncooked)",
      description:
        "Hand-crushed or blended canned San Marzano tomatoes with just salt, garlic, and maybe basil. No cooking \u2014 the sauce cooks on the pizza. This is the Neapolitan approach: the raw tomato flavor stays bright, fresh, and acidic, and the brief high-heat bake keeps it vibrant.",
      tips: "Use whole peeled San Marzano tomatoes (DOP if you can find them). Crush by hand for a chunky texture, or blend briefly for smooth. Don't add sugar \u2014 good San Marzanos are naturally sweet. Season lightly; the sauce should taste like tomatoes.",
      bestStyles: ["neapolitan", "grandma", "sicilian", "new-haven"],
    },
    {
      id: "cooked-sauce",
      name: "Cooked Tomato Sauce",
      description:
        "Crushed tomatoes simmered with garlic, oregano, sugar, and olive oil for 20\u201330 minutes. Cooking mellows the acidity, deepens the flavor, and thickens the sauce. This is the standard for New York and most American pizza styles. It's more concentrated and less watery than raw crushed tomato.",
      tips: "Simmer low and slow \u2014 don't boil or the sauce will taste bitter. A pinch of sugar balances acidity. Let it cool completely before topping pizza, or it will make the dough soggy. The sauce should be thick enough to hold its shape on a spoon.",
      bestStyles: ["new-york", "chicago-tavern", "pan", "thin-crust", "st-louis", "ohio-valley", "cast-iron", "school-night"],
    },
    {
      id: "vodka-sauce",
      name: "Vodka Sauce",
      description:
        "A pink sauce made by combining crushed tomato with heavy cream and a splash of vodka. The vodka releases flavor compounds in the tomato that neither water nor fat can access, creating a uniquely complex, slightly sweet, creamy sauce. It's become a modern pizzeria classic, especially on thick Sicilian slices.",
      tips: "Cook the vodka into the sauce for at least 5 minutes to burn off the raw alcohol flavor. The cream should be added at the end and just barely simmered. The sauce should be blush pink, not white \u2014 tomato should still dominate.",
      bestStyles: ["sicilian", "grandma", "pan"],
    },
    {
      id: "white-garlic",
      name: "White / Garlic Oil Base",
      description:
        "No tomato at all \u2014 just olive oil infused with garlic, sometimes with ricotta or b\u00E9chamel as a creamy base. White pizza (pizza bianca) lets the cheese and toppings shine without the acidity of tomato sauce. It's a traditional option in Roman pizzerias and has become popular for specialty pies in the US.",
      tips: "Mince or thinly slice garlic and warm it gently in olive oil \u2014 don't brown it or it turns bitter. Brush the garlic oil across the dough before adding cheese. For a creamier white pie, spread a thin layer of ricotta as the base.",
      bestStyles: ["neapolitan", "new-york", "thin-crust"],
    },
  ],

  pairings: {
    "fresh-mozz": {
      "crushed-raw":   { rating: "excellent", note: "The classic Neapolitan pairing. Bright tomato, creamy cheese." },
      "cooked-sauce":  { rating: "good",      note: "Works but cooked sauce can overpower the delicate fresh mozz." },
      "vodka-sauce":   { rating: "good",      note: "Creamy on creamy \u2014 rich but can lack contrast." },
      "white-garlic":  { rating: "excellent", note: "Perfect for pizza bianca. Fresh mozz melts beautifully with garlic oil." },
    },
    "low-moisture-mozz": {
      "crushed-raw":   { rating: "good",      note: "Solid combo for Sicilian and Grandma styles." },
      "cooked-sauce":  { rating: "excellent", note: "The American pizza standard. Reliable, delicious, browns perfectly." },
      "vodka-sauce":   { rating: "excellent", note: "Vodka Sicilian is a modern classic for good reason." },
      "white-garlic":  { rating: "good",      note: "Works well, but low-moisture mozz can dominate the subtle garlic." },
    },
    "provolone": {
      "crushed-raw":   { rating: "excellent", note: "Sharp provolone under raw garlic sauce \u2014 the Grandma pie way." },
      "cooked-sauce":  { rating: "good",      note: "The tanginess of provolone pairs well with sweeter cooked sauce." },
      "vodka-sauce":   { rating: "good",      note: "Interesting combo \u2014 the sharpness cuts through the cream." },
      "white-garlic":  { rating: "avoid",     note: "Both are strong flavors that compete rather than complement." },
    },
    "brick-cheese": {
      "crushed-raw":   { rating: "excellent", note: "The Detroit standard. Tomato stripes over buttery brick cheese." },
      "cooked-sauce":  { rating: "good",      note: "Cooked sauce works if you want a more mellow flavor." },
      "vodka-sauce":   { rating: "avoid",     note: "Too rich \u2014 brick cheese and cream sauce overwhelm together." },
      "white-garlic":  { rating: "good",      note: "Garlic oil with brick cheese makes an indulgent white Detroit." },
    },
    "pecorino": {
      "crushed-raw":   { rating: "excellent", note: "Sharp pecorino over raw tomato is pure Italian simplicity." },
      "cooked-sauce":  { rating: "excellent", note: "The salt and tang of pecorino brightens any cooked sauce." },
      "vodka-sauce":   { rating: "good",      note: "Pecorino adds a salty kick that balances the cream." },
      "white-garlic":  { rating: "good",      note: "Sprinkled over a white pie as a finishing accent." },
    },
    "ricotta": {
      "crushed-raw":   { rating: "excellent", note: "Dollops of ricotta on a Margherita \u2014 a Neapolitan favorite." },
      "cooked-sauce":  { rating: "excellent", note: "Classic NY white/red combo. Creamy pockets in tomato sauce." },
      "vodka-sauce":   { rating: "avoid",     note: "Ricotta + vodka cream = too much dairy, no contrast." },
      "white-garlic":  { rating: "excellent", note: "Ricotta as the base of a white pie with garlic oil is iconic." },
    },
    "parmesan": {
      "crushed-raw":   { rating: "excellent", note: "Grated Parmesan over raw crushed tomato — bright, salty, umami-rich." },
      "cooked-sauce":  { rating: "excellent", note: "A finishing shower of Parm over cooked sauce adds savory depth to any slice." },
      "vodka-sauce":   { rating: "good",      note: "Parmesan and cream are natural partners — rich and indulgent." },
      "white-garlic":  { rating: "excellent", note: "Parmesan crisped on a white pie with garlic oil is pure umami." },
    },
  },

  styleRecommendations: {
    "neapolitan":      { cheese: "fresh-mozz",        sauce: "crushed-raw" },
    "new-york":        { cheese: "low-moisture-mozz",  sauce: "cooked-sauce" },
    "chicago-tavern":  { cheese: "low-moisture-mozz",  sauce: "cooked-sauce" },
    "detroit":         { cheese: "brick-cheese",       sauce: "crushed-raw" },
    "sicilian":        { cheese: "low-moisture-mozz",  sauce: "crushed-raw" },
    "grandma":         { cheese: "provolone",          sauce: "crushed-raw" },
    "thin-crust":      { cheese: "low-moisture-mozz",  sauce: "cooked-sauce" },
    "pan":             { cheese: "low-moisture-mozz",   sauce: "cooked-sauce" },
    "st-louis":        { cheese: "low-moisture-mozz",  sauce: "cooked-sauce" },
    "new-haven":       { cheese: "fresh-mozz",         sauce: "crushed-raw" },
    "ohio-valley":     { cheese: "provolone",          sauce: "cooked-sauce" },
    "cast-iron":       { cheese: "low-moisture-mozz",  sauce: "crushed-raw" },
    "school-night":    { cheese: "low-moisture-mozz",  sauce: "cooked-sauce" },
  },
};
