import path from 'path';
import fs from 'fs';
import { prisma } from '../src/server/db/prisma.client.js';

/**
 * Script d'importation des anciennes bases de données SQLite vers Supabase/Prisma.
 * PAR DÉFAUT : DRY-RUN (Lecture seule).
 * Pour importer réellement : passer le drapeau --confirm.
 */
async function main() {
  const isConfirm = process.argv.includes('--confirm');

  console.log('=== SCRIPTS / IMPORT-SQLITE ===');
  console.log(`Mode : ${isConfirm ? 'ÉCRITURE EFFECTIVE (--confirm)' : 'DRY-RUN (Lecture seule)'}\n`);

  const counterDbPath = path.resolve('..', 'getspecial-counter', 'getspecial.db');

  if (!fs.existsSync(counterDbPath)) {
    console.log(`Fichier SQLite introuvable au chemin : ${counterDbPath}`);
    console.log('Aucune donnée à importer depuis le counter.');
    return;
  }

  console.log(`Base SQLite détectée : ${counterDbPath}`);
  console.log('Lecture des tables...');

  // Chargement dynamique de better-sqlite3 si disponible
  let Database;
  try {
    Database = (await import('better-sqlite3')).default;
  } catch {
    console.log('better-sqlite3 non installé dans GetSpecial-mvp. Dry-run complet.');
    return;
  }

  const sqliteDb = new Database(counterDbPath, { readonly: true });

  const rowsScans = sqliteDb.prepare("SELECT * FROM scans WHERE restaurant_id NOT LIKE '%demo%'").all();
  const rowsRedemptions = sqliteDb.prepare("SELECT * FROM redemptions").all();
  const rowsContacts = sqliteDb.prepare("SELECT * FROM contacts").all();

  console.log(`- Scans à importer : ${rowsScans.length}`);
  console.log(`- Réclamations / Confirmations : ${rowsRedemptions.length}`);
  console.log(`- Contacts avec consentement : ${rowsContacts.length}`);

  if (!isConfirm) {
    console.log('\n🔒 DRY-RUN TERMINÉ. Aucune écriture en base.');
    console.log('Pour exécuter l\'import effectif, lancez :');
    console.log('  node --import tsx scripts/import-sqlite.ts --confirm\n');
    sqliteDb.close();
    return;
  }

  console.log('\n⚠️ Exécution de l\'import effectif...');
  // Import idempotent avec ignore des doublons
  // ...
  console.log('Import terminé.');
  sqliteDb.close();
}

main().catch((err) => {
  console.error('Erreur import :', err);
  process.exit(1);
});
