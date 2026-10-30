import type { Activity } from "@/lib/types";

/** The texts of an activity that differ in English; everything else comes from activities.ts. */
export type ActivityTranslation = Pick<Activity, "title" | "location" | "description" | "info">;

// English texts by activity id. Place names stay as they are; prices stay in KM or €, with the
// currency explained once in the details popup.
export const activitiesEn: Record<string, ActivityTranslation> = {
  "trebevic-hiking": {
    title: "Hiking on Trebević",
    location: "Trebević, Sarajevo",
    description:
      "Marked trails through spruce and pine forest to the top of Trebević (1629 m), with a view over all of Sarajevo. For families there is an easy loop of about 3.5 km by the bobsleigh track.",
    info: "Free. About 2 hours' walk to the top. You can also go up by cable car (return ticket 6 KM for BiH citizens, children under 7 free).",
  },
  sunnyland: {
    title: "Sunnyland Trebević",
    location: "Zlatište, Trebević",
    description:
      "Adventure park on Trebević: an alpine coaster through the forest (up to 40 km/h), a giant swing, a zip coaster and children's play areas. Parents can have a coffee in the Kids Café.",
    info: "About 5 minutes' drive from the centre. An alpine coaster ride is about 10 KM. The Kids Café is open 10:00–22:00.",
  },
  "vrelo-bosne": {
    title: "Vrelo Bosne",
    location: "Ilidža, Sarajevo",
    description:
      "Nature park at the spring of the Bosna river, with swans, streams and little wooden bridges. You reach it on foot or by horse-drawn carriage along the Velika aleja avenue.",
    info: "Entry 6 KM adults, 3 KM children 6–18, under 6 free (2024 prices). Carriage ride along the avenue about 10 KM. Open 9:00–21:00.",
  },
  "hotel-hills-kinderland": {
    title: "Hotel Hills – Kinderland",
    location: "Ilidža, Sarajevo",
    description:
      "Large indoor play centre, Kinderland, at Hotel Hills, next to an adventure park for children and adults. Parents can have a coffee in the hotel.",
    info: "Prices and opening hours of the play centre are not published – check with the hotel before you go.",
  },
  "mini-city": {
    title: "Mini City",
    location: "Nikole Šopa 9, Sarajevo",
    description:
      "Indoor play centre built like a little town, where children take on roles and play while parents relax in a separate area. They also host birthday parties.",
    info: "Tel. 062 59 55 55. Prices are not published. At weekends the number of parties is limited.",
  },
  "pionirska-dolina": {
    title: "Pionirska dolina",
    location: "Koševo, Sarajevo",
    description:
      "The oldest zoo in BiH, in an 8.5-hectare park with ponds, swans and ducks. For children there are also electric cars, a little train, carousels and playgrounds.",
    info: "About 2 km from the centre. Entry about 2.5–3 KM (sources differ, under 5 free). In June 2026 it was briefly closed while the ponds were cleaned – check before you go.",
  },
  "tunel-spasa": {
    title: "Tunnel of Hope (Tunel spasa)",
    location: "Butmir, Ilidža",
    description:
      "Museum in Butmir at the tunnel that ran under the airport during the siege of Sarajevo. Suitable for older children and families who want to learn about the city's history.",
    info: "Adults 20 KM, pupils and students 8 KM, under 6 free. Cash only. Apr–Oct 8:30–17:00, Nov–Mar 9:00–16:00.",
  },
  "playland-city-center": {
    title: "Playland at City Center",
    location: "City Center, Sarajevo",
    description:
      "Indoor play area on the upper floors of the shopping centre: slides, carousels, a ball pit and electric cars. Good for rainy days.",
    info: "Single attractions cost about 2–4 KM (from a tourist guide, may be out of date).",
  },
  kravice: {
    title: "Kravice Waterfalls",
    location: "Studenci, near Ljubuški",
    description:
      "Wide waterfall on the Trebižat river in Herzegovina, with a lake for swimming, a picnic spot, a rope swing and a small café. Most beautiful in spring; in summer you can swim.",
    info: "Entry about €5–10 per person (sources differ). Bring swimwear and towels. From Sarajevo it is a full day, with a drive of several hours each way.",
  },
  jajce: {
    title: "Jajce – Pliva waterfall and watermills",
    location: "Jajce",
    description:
      "A 21-metre waterfall in the middle of town, a medieval fortress and the Pliva lakes with wooden watermills about 5 km from the centre. A real full-day trip.",
    info: "Waterfall entry: adults €2 (1 Oct–30 Apr) or €4 (1 May–30 Sep), schoolchildren €0.50, under 7 free. A trip from Sarajevo takes about 10–11 hours with stops on the way.",
  },
  "stari-most": {
    title: "Old Bridge in Mostar",
    location: "Mostar",
    description:
      "A 16th-century stone bridge over the Neretva and the old Kujundžiluk bazaar with craft shops. Children usually love watching the divers jump from the bridge into the river.",
    info: "Walking over the bridge and through the old town is free. Divers jump once onlookers have collected enough money. The stone on the bridge is steep and slippery – wear sturdy shoes.",
  },
  "blagaj-tekija": {
    title: "Blagaj – Tekke at the Buna spring",
    location: "Blagaj, near Mostar",
    description:
      "A 16th-century dervish house under a tall cliff, right where the Buna river flows out of a cave. The water is crystal clear, and along the river there are restaurants overlooking the spring.",
    info: "About 12 km from Mostar. Entry to the tekke about €2–5 (sources differ); the view of the spring is free. Dress modestly to go inside the tekke.",
  },
  "panonska-jezera": {
    title: "Pannonian Lakes in Tuzla",
    location: "Tuzla",
    description:
      "Salt lakes in the centre of Tuzla with pebble beaches, sunshades and water slides. In summer they feel like a little seaside holiday in the middle of town, and families with children love them.",
    info: "Swimming in summer. Entry about 4.50–9 KM (2025 season, unofficial sources), children up to 4 free. Out of season entry is free.",
  },
  "strbacki-buk": {
    title: "Štrbački buk – Una National Park",
    location: "Una National Park, near Bihać",
    description:
      "The biggest waterfall on the Una river, about 24 metres high, with viewpoints and paths above the cascades. Part of Una National Park, right on the border with Croatia.",
    info: "There is an entry fee that depends on the part of the park – check the park's website. According to guides it is open Jun–Aug 9:00–20:00, Apr, May and Oct 9:00–18:00, shorter in winter.",
  },
  kastel: {
    title: "Kastel Fortress in Banja Luka",
    location: "Banja Luka",
    description:
      "An old fortress in the town centre on the bank of the Vrbas. You can walk around inside the walls and sit on a terrace, and along the river there are swimming spots and a rafting base.",
    info: "Entry to the fortress is free (according to tourist guides). The Museum of Republika Srpska nearby is also free.",
  },
  "vrbas-rafting": {
    title: "Rafting and kayaking on the Vrbas",
    location: "Vrbas Canyon, near Banja Luka",
    description:
      "A trip down the Vrbas canyon (Tijesno, Karanovac), close to Banja Luka. The calmer stretches of the river suit families, with a guide and full equipment.",
    info: "Go with a licensed rafting agency; check the price and the minimum age for children with them. The season runs from spring to autumn, and the water is calmest in summer.",
  },
  "banj-brdo": {
    title: "Banj brdo",
    location: "Banja Luka",
    description: "A wooded hill above Banja Luka with walking paths, a monument at the top and a view over the whole town and the Vrbas valley.",
    info: "Free. You can drive to the top, and from there take short walks through the forest. A good spot for a picnic.",
  },
  "fortica-mostar": {
    title: "Fortica – zipline and skywalk",
    location: "Fortica, above Mostar",
    description: "Adventure park on the hill above Mostar: a glass viewing platform over a drop, a zipline and a view over the whole town and the Neretva.",
    info: "The view is free. The zipline has two sections (about 570 m and 430 m) and is paid separately – one tour offer lists about €25, but check the price on site.",
  },
  pocitelj: {
    title: "Počitelj",
    location: "Počitelj, near Čapljina",
    description: "A stone old town on a steep hill above the Neretva, with a mosque, a clock tower and a fortress at the top overlooking the whole valley.",
    info: "Walking around the town is free. The steps are steep and made of stone – not for pushchairs. Easy to combine with Blagaj and Kravice in one trip.",
  },
  "hutovo-blato": {
    title: "Hutovo blato Nature Park",
    location: "Karaotok, near Čapljina",
    description: "A wetland of lakes and channels where thousands of birds gather in winter. Best seen from a boat, with a guide.",
    info: "Entry to the park is a token fee (about €1 per person, according to an older source). Boat trips must be arranged with the park in advance; the price is not published.",
  },
  "martin-brod": {
    title: "Martin Brod – Una National Park",
    location: "Martin Brod, Una National Park",
    description:
      "A web of waterfalls and cascades where the Unac flows into the Una, with wooden paths and little bridges over the water. Quieter than Štrbački buk.",
    info: "There is an entry fee that depends on the season (the park's 2026 price list is on npuna.com). Open about 9:00–20:00 in summer, shorter in winter.",
  },
  "una-rafting": {
    title: "Rafting on the Una",
    location: "Bihać",
    description: "A trip down the Una through green canyons and over small waterfalls. Shorter stretches near Bihać are suited to families with children.",
    info: "Go with a licensed agency from Bihać; check the price and the family route with them. The season runs from April to October.",
  },
  ostrozac: {
    title: "Ostrožac Fortress",
    location: "Ostrožac, near Cazin",
    description: "A fairy-tale castle above the Una valley, with towers, walls and a sculpture park. Children love exploring the passages and towers.",
    info: "According to tourist guides entry is free or a token fee. Part of the castle is being restored, so not all rooms are open.",
  },
  smetovi: {
    title: "Smetovi",
    location: "Smetovi, near Zenica",
    description: "A picnic area on the mountain above Zenica with meadows, forest and a viewpoint. In summer you can watch paragliders take off.",
    info: "Free. About 20 minutes by car from the centre of Zenica. There is a mountain hut and barbecue spots.",
  },
  stanisici: {
    title: "Stanišići Ethno Village",
    location: "Pavlovića put, near Bijeljina",
    description: "A recreated old village with wooden houses, a church, a watermill and a lake. Children can see animals and how people used to live in the countryside.",
    info: "Entry and parking are free; the restaurants in the village are not. Check opening hours on etno-selo.com.",
  },
  "doboj-gradina": {
    title: "Gradina Fortress in Doboj",
    location: "Doboj",
    description: "A medieval fortress on the hill above Doboj, with restored walls, towers and a view over the Bosna valley.",
    info: "According to tourist guides entry is free. Medieval festivals are held at the fortress in summer.",
  },
  "kozara-mrakovica": {
    title: "Kozara National Park – Mrakovica",
    location: "Mrakovica, near Prijedor",
    description:
      "The forests of Kozara, the large monument at Mrakovica and an adventure park with over 60 platforms in the treetops – from low courses for small children to ziplines.",
    info: "The adventure park is open at weekends from May (on weekdays for booked groups). The lowest level is for small children, the zipline for 16+. Prices: Mrakovica info centre, 052 480 680.",
  },
  "trebinje-arslanagica-most": {
    title: "Trebinje – old town and Arslanagić Bridge",
    location: "Trebinje",
    description: "A walk under the plane trees along the Trebišnjica, through the old town and the market, to the 16th-century Arslanagić Bridge.",
    info: "Free. The market on the square is open every morning. It is hot in summer – best to go in the morning or early evening.",
  },
  "hercegovacka-gracanica": {
    title: "Hercegovačka Gračanica",
    location: "Crkvina, Trebinje",
    description: "A monastery on Crkvina hill above Trebinje, with a view over the whole town and the Trebišnjica valley.",
    info: "Free. You can drive to the top. Dress modestly to go inside the church.",
  },
  "travnik-plava-voda": {
    title: "Travnik – Old Fortress and Plava voda",
    location: "Travnik",
    description: "A medieval fortress above Travnik, then a walk to the Plava voda spring, with restaurants and ćevapi grills along the stream.",
    info: "The fortress is run by the Travnik Regional Museum; there is an entry fee, check the price on site. Plava voda is free.",
  },
  vlasic: {
    title: "Vlašić – Babanovac",
    location: "Babanovac, Vlašić",
    description: "A mountain above Travnik: sledging and beginner skiing in winter; meadows, walks and the famous Vlašić cheese in summer.",
    info: "Walking and sledging are free; ski passes and equipment hire are not. In winter bring snow chains.",
  },
  "jablanica-muzej": {
    title: "Museum of the Battle of the Neretva",
    location: "Jablanica",
    description: "A museum of the battle for the wounded, next to the destroyed bridge in Jablanica, with an old train and a tank in the yard.",
    info: "According to guides open every day 9:00–16:00. There is an entry fee; the price is not published (tel. +387 61 175 317). On the way to Mostar – stop for the local roast lamb.",
  },
  "neretva-rafting": {
    title: "Rafting on the Neretva",
    location: "Konjic",
    description: "The best-known rafting in BiH, through the emerald Neretva canyon near Konjic. With a guide, equipment and lunch at the end.",
    info: "Prices from about €41–50 per person, with breakfast, lunch and equipment. Some camps take children from 5, some from 8 – check when booking.",
  },
  "titov-bunker": {
    title: "Tito's Bunker ARK D-0",
    location: "Konjic",
    description: "A secret Cold War nuclear bunker hidden in a hill near Konjic, with corridors, rooms and the original equipment.",
    info: "Visits only with a guide and by appointment; check the price when booking. It is cold inside all year – bring a jacket.",
  },
  "boracko-jezero": {
    title: "Boračko Lake",
    location: "Boračko jezero, near Konjic",
    description: "A mountain lake surrounded by forest, with a beach for swimming in summer and paths around the lake.",
    info: "Free. Swimming in summer; there are restaurants and campsites by the lake. About 20 km from Konjic.",
  },
  visegrad: {
    title: "Višegrad – the bridge and Andrićgrad",
    location: "Višegrad",
    description:
      "The 16th-century Mehmed Paša Sokolović Bridge (UNESCO), known from the novel “The Bridge on the Drina”, and the little stone town of Andrićgrad beside it.",
    info: "Walking over the bridge and around Andrićgrad is free. In summer small boats take trips on the Drina.",
  },
  sutjeska: {
    title: "Sutjeska National Park – Tjentište",
    location: "Tjentište, near Foča",
    description:
      "The oldest national park in BiH: the monument at Tjentište, forest paths along the Sutjeska and a viewpoint over the Perućica primeval forest and Mount Maglić.",
    info: "There is an entry fee; check the price on npsutjeska.net. The Perućica primeval forest itself can only be visited with a guide.",
  },
  "ravne-visoko": {
    title: "Ravne 2 Park – Visoko",
    location: "Visoko",
    description: "A forest park with paths, wooden sculptures and places to rest, next to the underground Ravne tunnels, which are visited with a guide.",
    info: "About 30 km from Sarajevo. The park and the tunnels are paid separately; check the prices on site.",
  },
  "prokosko-jezero": {
    title: "Prokoško Lake",
    location: "Vranica, near Fojnica",
    description: "A glacial lake high on Mount Vranica, surrounded by old wooden huts. A short walk from the car park to the lake.",
    info: "Free. Part of the road from Fojnica is gravel – you need a car with higher ground clearance. Best from June to October.",
  },
  "livno-konji": {
    title: "Wild horses near Livno",
    location: "Cincar, near Livno",
    description: "Herds of wild horses roam freely on the plateau above Livno, below Mount Cincar. An unforgettable sight for children.",
    info: "Free. The horses are wild – watch them from a distance and do not feed them. A gravel road leads up to the plateau.",
  },
  blidinje: {
    title: "Blidinje Nature Park",
    location: "Blidinje, near Posušje",
    description:
      "A large mountain plateau between Čvrsnica and Vran, with a lake, medieval tombstones (stećci) and flocks of sheep. Beginner skiing in winter.",
    info: "Entry to the park is free. In winter there are ski slopes at Risovac, and ski passes are paid.",
  },
  neum: {
    title: "Neum – a day at the sea",
    location: "Neum",
    description: "BiH's only stretch of coast: pebble beaches, shallow water for small children and a walk along the seafront.",
    info: "Public beaches are free; sun loungers and umbrellas are paid. About 3.5 hours' drive from Sarajevo.",
  },
  skakavac: {
    title: "Skakavac Waterfall",
    location: "Nahorevo, Sarajevo",
    description: "A 98-metre waterfall, one of the highest in the Balkans, reached by a walk through beech forest above Sarajevo.",
    info: "Free. From the car park it is about 1 km on foot to the waterfall (about an hour's walk). The car park is small – arrive early at weekends.",
  },
};
