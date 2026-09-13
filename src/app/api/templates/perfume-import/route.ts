export function GET() {
  const csv = "brand,name,listing_type,price_inr,min_bid_inr,bid_duration_hours,kind,ml,shipping_included,collection,description,top_notes,middle_notes,base_notes\nMaison Margiela,Replica Jazz Club,buy,8500,,,retail,100,yes,Evening scents,Full presentation,\"Pink Pepper, Rum\",\"Tobacco Leaf, Vanilla\",Styrax\nAfnan,Supremacy Not Only Intense,bid,,1200,24,decant,20,yes,Decants,Lightly used decant,\"Apple, Bergamot\",\"Pineapple, Birch\",\"Ambergris, Musk\"";
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=atelier-perfume-import-template.csv" } });
}
