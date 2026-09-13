export function GET() {
  const csv = "brand,name,listing_intent,listing_type,price_inr,min_bid_inr,bid_duration_hours,kind,ml,shipping_included,collection,description,top_notes,middle_notes,base_notes\nMaison Margiela,Replica Jazz Club,marketplace,buy,8500,,,retail,100,yes,Evening scents,Full presentation,\"Pink Pepper, Rum\",\"Tobacco Leaf, Vanilla\",Styrax\nAfnan,Supremacy Not Only Intense,marketplace,bid,,1200,24,decant,20,yes,Decants,Lightly used decant,\"Apple, Bergamot\",\"Pineapple, Birch\",\"Ambergris, Musk\"\nByredo,Bal d'Afrique,collection,,,,,,,Personal shelf,Favourite in my own collection,,,";
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=atelier-perfume-import-template.csv" } });
}
