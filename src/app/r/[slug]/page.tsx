import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/server/db/prisma.client';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import CustomerContactForm from '@/components/public-offer/CustomerContactForm';

export const dynamic = 'force-dynamic';

export default async function CustomerPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ claimed?: string; offerId?: string }>;
}) {
  const { slug } = await params;
  const { claimed, offerId } = await searchParams;

  // Récupérer le restaurant
  const restaurant = await (prisma as any).restaurant.findFirst({
    where: {
      OR: [
        { id: slug },
        { name: { contains: slug, mode: 'insensitive' } },
      ],
    },
    include: {
      profile: true,
      offers: { where: { status: 'active' }, take: 5 },
    },
  });

  const cookieStore = await cookies();
  let deviceId = cookieStore.get('device_id')?.value;
  let isNewDevice = false;

  if (!deviceId) {
    deviceId = 'dev_' + crypto.randomUUID();
    isNewDevice = true;
  }

  // Enregistrer le scan réel en base si nouveau visiteur ou première visite du jour
  if (restaurant) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentScan = await (prisma as any).feedbackEvent.findFirst({
        where: {
          restaurantId: restaurant.id,
          type: 'scan',
          reason: deviceId,
          createdAt: { gte: oneDayAgo },
        },
      });

      if (!recentScan) {
        await (prisma as any).feedbackEvent.create({
          data: {
            restaurantId: restaurant.id,
            type: 'scan',
            reason: deviceId,
            value: 1,
            status: 'active',
          },
        });
      }

      // Si le client vient de cliquer sur une offre (claimed)
      if (claimed) {
        const matchingOffer = (restaurant.offers || []).find(
          (o: any) => (o.codeWord || '').toUpperCase() === claimed.toUpperCase() || o.id === offerId
        );
        const refOfferId = matchingOffer?.id || offerId || 'general';

        // Enregistrer l'intention (claim)
        const recentClaim = await (prisma as any).feedbackEvent.findFirst({
          where: {
            restaurantId: restaurant.id,
            type: 'claim',
            reason: `offer:${refOfferId}`,
            createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
          },
        });

        if (!recentClaim) {
          await (prisma as any).feedbackEvent.create({
            data: {
              restaurantId: restaurant.id,
              type: 'claim',
              reason: `offer:${refOfferId}`,
              value: 1,
              status: 'active',
            },
          });
        }
      }
    } catch (e) {
      console.warn('[PUBLIC_PAGE_METRICS_ERROR]', e);
    }
  }

  const restName = restaurant?.name || "L'Atelier Culinaire";
  const brandColor = restaurant?.profile?.brandColor || '#ff6600';
  const offers = (restaurant?.offers && restaurant.offers.length > 0)
    ? restaurant.offers
    : [
        {
          id: 'off_default_1',
          title: 'Offre du jour : Cuisine de saison',
          description: 'Avantage exclusif sur notre formule du jour pour toute commande mentionnant le mot-code.',
          codeWord: 'SPECIAL',
        },
      ];

  return (
    <div
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '20px 16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#0f172a',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      {/* En-tête Restaurant */}
      <div
        style={{
          background: '#ffffff',
          border: '2px solid #cbd5e1',
          borderRadius: '16px',
          padding: '24px 16px',
          textAlign: 'center',
          marginBottom: '20px',
          borderTop: `6px solid ${brandColor}`,
        }}
      >
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0' }}>{restName}</h1>
        <p style={{ margin: 0, color: brandColor, fontWeight: 700, fontSize: '15px' }}>
          Offres exclusives & Formules du jour
        </p>
      </div>

      {/* Modale d'offre activée avec compte à rebours de 10 minutes */}
      {claimed && (
        <div
          style={{
            background: '#ffffff',
            border: `3px solid ${brandColor}`,
            borderRadius: '16px',
            padding: '24px 16px',
            textAlign: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 25px rgba(255, 102, 0, 0.15)',
          }}
        >
          <span
            style={{
              background: '#dcfce7',
              color: '#15803d',
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
            }}
          >
            Offre Prête à Table
          </span>

          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '12px 0 6px' }}>
            Montrez ce mot-code au serveur :
          </h2>

          <div
            style={{
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
            }}
          >
            {claimed}
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Valable pendant 10 minutes lors de votre commande au bar ou à table.
          </p>
        </div>
      )}

      {/* Liste des offres actives */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 800,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🔥</span> Offres disponibles aujourd&apos;hui ({offers.length})
        </h2>

        {offers.map((o: any) => (
          <div
            key={o.id}
            style={{
              background: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '14px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>{o.title}</h3>
            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px 0' }}>{o.description}</p>

            <form method="GET" action={`/r/${slug}`}>
              <input type="hidden" name="claimed" value={o.codeWord || o.title.slice(0, 6).toUpperCase()} />
              <input type="hidden" name="offerId" value={o.id} />
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

      {/* Formulaire Contact Opt-in réel connecté à l'API */}
      <CustomerContactForm slug={slug} restaurantName={restName} />
    </div>
  );
}
