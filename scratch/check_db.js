const URL = "https://dyoicvurrhuokfufsrwc.supabase.co";
const KEY = "sb_publishable_4Xb4nVQw7LhlRU8xfb1jcQ_oMw_4WwB";

async function main() {
  const catRes = await fetch(`${URL}/rest/v1/category?select=*`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }});
  const categories = await catRes.json();
  
  const prodRes = await fetch(`${URL}/rest/v1/product?select=*`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }});
  const products = await prodRes.json();

  console.log("Categories:");
  console.log(categories);
  console.log("Products:");
  products.forEach(p => console.log(`ID: ${p.PRODUCT_ID}, NAME: ${p.NAME}, CAT_ID: ${p.CATEGORY_ID}, ON_HAND: ${p.ON_HAND}`));
}

main();
