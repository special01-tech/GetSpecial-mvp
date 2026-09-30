'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Sparkles,
  ArrowLeft,
  Bot,
  User,
  Loader2,
  Calendar,
  AlertCircle,
  HelpCircle,
  MoreVertical,
} from 'lucide-react';
import ChatCampaignCard from '@/components/ui/ChatCampaignCard/ChatCampaignCard';
import {
  ChatMessage,
  INITIAL_CHAT_MESSAGES,
  QUICK_SUGGESTIONS,
  ChatAiService,
  QuickSuggestion,
} from '@/services/chat/chat.service';
import styles from './chat.module.css';

/**
 * Écran 12 : Chat GetSpecial
 *
 * Interface conversationnelle :
 * - Message assistant : "Voici une opportunité détectée pour vous !"
 * - Affichage campagne sous forme de carte interactive
 * - Actions carte : "Voir le détail", "Refuser"
 * - L'utilisateur peut répondre en texte libre (ex: "Parfait ! Programme-la pour ce soir.")
 * - Réponse de l'assistant (ex: "Cette publication est programmée pour ce soir à 18h...")
 * - Suggestions rapides cliquables :
 *   "Que me proposes-tu cette semaine ?"
 *   "Mets en pause"
 *   "Autre sujet"
 * - Champ de saisie & bouton d'envoi
 * - Navigation bottom bar
 */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger l'historique de conversation persisté
  useEffect(() => {
    try {
      const stored = localStorage.getItem('getspecial_chat_messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Conserver les messages initiaux
    }
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

  // Envoyer un message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsgId = `user_${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: nowTime,
    };

    saveMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    const restaurantId = typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') || undefined : undefined;

    try {
      const response = await ChatAiService.sendMessage(text, restaurantId, messages);
      const assistantMsgTime = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const assistantMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: response.message,
        timestamp: assistantMsgTime,
      };

      saveMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered a brief network glitch. Would you like to retry?',
        timestamp: nowTime,
      };
      saveMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: QuickSuggestion) => {
    handleSendMessage(suggestion.prompt);
  };

  const handleRejectCard = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId && msg.campaignCard
          ? {
              ...msg,
              campaignCard: {
                ...msg.campaignCard,
                status: 'rejected',
              },
            }
          : msg
      )
    );

    // Réponse de confirmation de refus
    setTimeout(() => {
      const nowTime = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_refuse_${Date.now()}`,
          sender: 'assistant',
          text: 'Entendu, j’ai archivé cette opportunité. Je continue de surveiller la météo et les événements pour vous proposer d’autres moments opportuns.',
          timestamp: nowTime,
        },
      ]);
    }, 400);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.chatContainer}>
        {/* Header Conversation */}
        <header className={styles.header}>
          <div className={styles.assistantIdentity}>
            <div className={styles.avatarBot}>
              <Sparkles size={18} className={styles.botIcon} />
              <span className={styles.statusOnline} />
            </div>
            <div className={styles.identityDetails}>
              <h1 className={styles.botName}>Assistant GetSpecial</h1>
              <span className={styles.botStatus}>En ligne • Prêt à optimiser</span>
            </div>
          </div>

          <Link href="/dashboard" className={styles.closeChatBtn} aria-label="Retour dashboard">
            <ArrowLeft size={18} />
          </Link>
        </header>

        {/* Zone de Messages */}
        <main className={styles.messagesArea} aria-live="polite">
          {messages.map((msg) => {
            const isAsst = msg.sender === 'assistant';

            return (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${isAsst ? styles.messageAsst : styles.messageUser}`}
              >
                {isAsst && (
                  <div className={styles.smallAvatarBot}>
                    <Sparkles size={13} />
                  </div>
                )}

                <div className={styles.messageBubbleWrapper}>
                  <div
                    className={`${styles.bubble} ${
                      isAsst ? styles.bubbleAsst : styles.bubbleUser
                    }`}
                  >
                    <p className={styles.bubbleText}>{msg.text}</p>
                    <span className={styles.timestamp}>{msg.timestamp}</span>
                  </div>

                  {/* Carte Opportunité intégrée si présente */}
                  {msg.campaignCard && (
                    <ChatCampaignCard
                      campaign={msg.campaignCard.campaign}
                      status={msg.campaignCard.status}
                      onReject={() => handleRejectCard(msg.id)}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Indicateur de saisie IA */}
          {isTyping && (
            <div className={`${styles.messageRow} ${styles.messageAsst}`}>
              <div className={styles.smallAvatarBot}>
                <Sparkles size={13} />
              </div>
              <div className={`${styles.bubble} ${styles.bubbleAsst} ${styles.typingBubble}`}>
                <Loader2 size={15} className={styles.spinner} />
                <span>GetSpecial analyse votre demande...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Suggestions rapides au-dessus de l'input */}
        <div className={styles.suggestionsContainer}>
          <div className={styles.suggestionsScroll}>
            {QUICK_SUGGESTIONS.map((sug) => (
              <button
                key={sug.id}
                type="button"
                onClick={() => handleSuggestionClick(sug)}
                className={styles.suggestionPill}
              >
                <span>{sug.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          className={styles.inputArea}
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            type="text"
            placeholder="Ex : Parfait ! Programme-la pour ce soir."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className={styles.textInput}
            aria-label="Message à GetSpecial"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={styles.sendButton}
            aria-label="Envoyer le message"
          >
            <Send size={18} />
          </button>
        </form>

        {/* Bottom spacer for nav */}
        <div className={styles.navSpacer} />
      </div>
    </div>
  );
}
