'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Send,
  Sparkles,
  ArrowLeft,
  Bot,
  User,
  Loader2,
  Calendar,
  Tag,
  ArrowRight,
} from 'lucide-react';
import styles from './chat.module.css';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  campaignSuggestion?: {
    id: string;
    title: string;
    discount?: string;
    timeSlot?: string;
    platforms?: string[];
    status?: string;
  } | null;
}

export interface QuickSuggestion {
  id: string;
  label: string;
  prompt: string;
}

const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { id: '1', label: "Opportunité du jour ✨", prompt: "Que me proposes-tu pour aujourd'hui ?" },
  { id: '2', label: "Impact météo ☀️", prompt: "Quel est l'impact de la météo actuelle sur mon service ?" },
  { id: '3', label: "Mettre en avant un plat 🍲", prompt: "Comment mettre en valeur nos spécialités cette semaine ?" },
  { id: '4', label: "Remplir les jours calmes 📉", prompt: "Propose-moi une offre pour dynamiser nos jours creux." },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Mon Restaurant');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger le restaurant réel au montage
  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const res = await fetch('/api/restaurants');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && json.data.length > 0) {
            setRestaurantName(json.data[0].name);
            setRestaurantId(json.data[0].id);
          }
        }
      } catch (err) {
        console.warn('Impossible de charger le restaurant pour le chat :', err);
      }
    }
    fetchRestaurant();
  }, []);

  // Charger ou initialiser l'historique
  useEffect(() => {
    try {
      const stored = localStorage.getItem('getspecial_chat_messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // Ignorer
    }

    setMessages([
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: `Bonjour ! Je suis votre conseiller marketing IA. Je surveille la météo locale, vos spécialités et vos offres pour vous proposer les meilleures publications. De quoi avez-vous besoin aujourd'hui ?`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const saveMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setMessages((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem('getspecial_chat_messages', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    saveMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          message: text,
          history: messages.slice(-4),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data?.reply) {
        saveMessages((prev) => [...prev, json.data.reply]);
      } else {
        throw new Error('Réponse invalide');
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: "Désolé, une petite anomalie réseau est survenue. Veuillez réessayer dans quelques instants.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      saveMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.chatContainer}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.assistantIdentity}>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className={styles.closeChatBtn}
              aria-label="Retour au dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <div className={styles.avatarBot}>
              <Bot size={20} className={styles.botIcon} />
              <span className={styles.statusOnline} />
            </div>
            <div className={styles.identityDetails}>
              <h2 className={styles.botName}>Assistant IA GetSpecial</h2>
              <span className={styles.botStatus}>{restaurantName} • En ligne</span>
            </div>
          </div>
        </header>

        {/* Messages List */}
        <div className={styles.messagesList} style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: msg.sender === 'user' ? '#FF5C00' : 'rgba(255, 255, 255, 0.05)',
                  color: '#FFFFFF',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {msg.text}
              </div>

              {/* Campaign Suggestion Card */}
              {msg.campaignSuggestion && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '14px',
                    background: 'rgba(255, 92, 0, 0.08)',
                    border: '1px solid rgba(255, 92, 0, 0.3)',
                    borderRadius: '12px',
                    maxWidth: '85%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Sparkles size={16} color="#FF5C00" />
                    <span style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.9rem' }}>
                      {msg.campaignSuggestion.title}
                    </span>
                  </div>
                  {msg.campaignSuggestion.discount && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF5C00', fontSize: '0.8rem', marginBottom: '10px' }}>
                      <Tag size={13} />
                      <span>{msg.campaignSuggestion.discount}</span>
                    </div>
                  )}
                  <Link
                    href={`/creer?idea=${encodeURIComponent(msg.campaignSuggestion.title)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#FF5C00',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '8px 14px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Créer cette publication</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}

              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '4px',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                }}
              >
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: '#94A3B8' }}>
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: '0.82rem' }}>GetSpecial réfléchit...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '8px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {QUICK_SUGGESTIONS.map((sug) => (
            <button
              key={sug.id}
              type="button"
              onClick={() => handleSendMessage(sug.prompt)}
              style={{
                flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E2E8F0',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {sug.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            background: 'var(--color-bg-surface, #0B1115)',
            borderTop: '1px solid var(--color-border, rgba(255, 255, 255, 0.08))',
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Posez une question sur votre restaurant..."
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            style={{
              background: '#FF5C00',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !inputText.trim() || isTyping ? 0.5 : 1,
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
