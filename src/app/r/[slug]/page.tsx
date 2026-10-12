import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/server/db/prisma.client';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export default async function CustomerPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ claimed?: string }>;
}) {
  const { slug } = await params;
  const { claimed } = await searchParams;

  // Récupérer le restaurant
  const restaurant = await (prisma as any).restaurant.findFirst({
    where: {
      OR: [
        { id: slug },
        { name: { contains: slug, mode: 'insensitive' } }
      ]
    },
    include: {
      profile: true,
      offers: { where: { status: 'active' }, take: 3 }
    }
  });

  const cookieStore = await cookies();
  let deviceId = cookieStore.get('device_id')?.value;
  if (!deviceId) {
    deviceId = 'dev_' + crypto.randomUUID();
  }

  const restName = restaurant?.name || "L'Atelier Culinaire";
  const brandColor = '#ff6600';
  const offers = restaurant?.offers || [
    {
      id: 'off_1',
      title: 'Privilège du jour : Cuisine de saison',
      description: 'Avantage exclusif sur notre formule de saison pour toute commande mentionnant le mot-code.',
      codeWord: 'MON15',
    }
  ];

  return (
    <div style={{
      maxWidth: '640px',
      margin: '0 auto',
      padding: '20px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0f172a',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
    }}>
      {/* En-tête Restaurant */}
      <div style={{
        background: '#ffffff',
        border: '2px solid #cbd5e1',
        borderRadius: '16px',
        padding: '24px 16px',
        textAlign: 'center',
        marginBottom: '20px',
        borderTop: `6px solid ${brandColor}`,
      }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0' }}>{restName}</h1>
        <p style={{ margin: 0, color: brandColor, fontWeight: 700, fontSize: '15px' }}>
          Offres exclusives & Formules du jour
        </p>
      </div>

      {/* Modale d'offre activée avec compte à rebours de 10 minutes */}
      {claimed && (
        <div style={{
          background: '#ffffff',
          border: `3px solid ${brandColor}`,
          borderRadius: '16px',
          padding: '24px 16px',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: '0 8px 25px rgba(255, 102, 0, 0.15)',
        }}>
          <span style={{
            background: '#dcfce7',
            color: '#15803d',
            fontSize: '12px',
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: '9999px',
            textTransform: 'uppercase',
          }}>
            Offre Prête à Table
          </span>

          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '12px 0 6px' }}>
            Montrez ce mot-code au serveur :
          </h2>

          <div style={{
            background: '#f8fafc',
            border: `2px dashed ${brandColor}`,
            borderRadius: '12px',
            padding: '16px',
            margin: '16px 0',
            fontSize: '36px',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: brandColor,
            letterSpacing: '4px',
          }}>
            {claimed}
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Valable pendant 10 minutes lors de votre commande au bar ou à table.
          </p>
        </div>
      )}

      {/* Liste des offres actives */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔥</span> Offres disponibles aujourd&apos;hui ({offers.length}/3)
        </h2>

        {offers.map((o: any) => (
          <div key={o.id} style={{
            background: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '14px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>{o.title}</h3>
            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px 0' }}>{o.description}</p>

            <form method="GET" action={`/r/${slug}`}>
              <input type="hidden" name="claimed" value={o.codeWord || 'SPECIAL'} />
              <button
                type="submit"
                style={{
                  width: '100%',
                  minHeight: '52px',
                  backgroundColor: brandColor,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Profiter de cette offre
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* Formulaire Contact Opt-in facultatif */}
      <div style={{
        background: '#ffffff',
        border: '2px dashed #cbd5e1',
        borderRadius: '14px',
        padding: '20px',
        textAlign: 'center',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0' }}>
          🎁 Recevoir nos prochaines offres exclusives
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
          Laissez votre email ou téléphone pour être prévenu en avant-première.
        </p>

        <input
          type="text"
          placeholder="email@exemple.com ou 0601020304"
          style={{
            width: '100%',
            minHeight: '46px',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1.5px solid #cbd5e1',
            fontSize: '15px',
            marginBottom: '12px',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', textAlign: 'left', marginBottom: '14px' }}>
          <input type="checkbox" id="consent" style={{ width: '18px', height: '18px', marginTop: '2px' }} />
          <label htmlFor="consent" style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
            J&apos;accepte de recevoir les offres et nouveaux menus de {restName}. Désinscription possible en 1 clic.
          </label>
        </div>

        <button
          type="button"
          style={{
            width: '100%',
            minHeight: '44px',
            backgroundColor: '#334155',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Je m&apos;inscris
        </button>
      </div>
    </div>
  );
}
