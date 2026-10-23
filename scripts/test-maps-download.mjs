async function inspectMapsDownload(testUrl) {
  console.log('Testing URL:', testUrl);
  
  // Envoi avec cookie de bypass du mur de consentement Google (SOCS)
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
    'Cookie': 'SOCS=CAESEwgDEgk2MTc4ODU2ODIaAmZyIAEaBgiA_LyaBg; CONSENT=PENDING+999'
  };

  try {
    const res = await fetch(testUrl, { headers, redirect: 'follow' });
    console.log('Final URL:', res.url);
    console.log('Status:', res.status);
    const html = await res.text();
    console.log('HTML Length:', html.length);
    
    // Vérifier si mur de consentement
    if (res.url.includes('consent.google.com')) {
      console.log('⚠️ Redirection vers consent.google.com détectée !');
    } else {
      console.log('✅ Pas de mur de consentement ! Page de lieu atteinte.');
    }

    // Recherche de APP_INITIALIZATION_STATE
    const initStateMatch = html.match(/window\.APP_INITIALIZATION_STATE\s*=\s*(\[[^;]+\]);/);
    if (initStateMatch) {
      console.log('✅ window.APP_INITIALIZATION_STATE trouvé ! Longueur :', initStateMatch[1].length);
    } else {
      console.log('❌ window.APP_INITIALIZATION_STATE non trouvé.');
    }

    // Extraire tous les textes français / adresses / numéros de téléphone visibles dans le HTML
    const phoneMatches = html.match(/(?:0|\+33\s?)[1-9](?:[\s.-]?\d{2}){4}/g) || [];
    console.log('Numéros de téléphone trouvés :', [...new Set(phoneMatches)]);

    // Balises meta
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    console.log('Titre :', titleMatch ? titleMatch[1] : 'Non trouvé');

    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    console.log('og:title :', ogTitle ? ogTitle[1] : 'Non trouvé');

    const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    console.log('og:description :', ogDesc ? ogDesc[1] : 'Non trouvé');

  } catch (err) {
    console.error('Erreur :', err.message);
  }
}

// Test avec une URL Google Maps d'un restaurant connu à Paris
inspectMapsDownload('https://www.google.com/maps/place/Le+Bistrot+Paul+Bert/@48.853272,2.383186,17z/data=!3m1!4b1!4m6!3m5!1s0x47e672049d5bf599:0xd275d2729938b251!8m2!3d48.853272!4d2.3857609!16s%2Fg%2F1td_156d');
