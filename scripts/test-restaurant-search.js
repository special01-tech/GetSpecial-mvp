async function testSearch() {
  const tests = [
    { name: 'Le Zinc', city: 'Paris', country: 'FR' },
    { name: 'Chez Paul', city: 'Bordeaux', country: 'FR' },
    { name: 'The Brass Pelican', city: 'Austin', country: 'US' },
    { name: 'Mon Nouveau Restaurant Secret', city: 'Lyon', country: 'FR' },
  ];
  for (const t of tests) {
    const url = 'http://localhost:3000/api/restaurants/search?name=' + encodeURIComponent(t.name) + '&city=' + encodeURIComponent(t.city) + '&country=' + t.country;
    const res = await fetch(url);
    const json = await res.json();
    console.log('Search [' + t.name + ']: success =', json.success, '| count =', json.data?.length, '| first =', json.data?.[0]?.name, '| cuisine =', json.data?.[0]?.cuisineType, '| photo =', json.data?.[0]?.photoUrl?.slice(0, 45) + '...');
  }
}

testSearch().catch(console.error);
