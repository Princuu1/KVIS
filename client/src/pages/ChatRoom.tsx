"use client";

import React, { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import { useAuth } from "@/hooks/useAuth";
import { useSocket, type ChatMessage } from "@/hooks/useSocket";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Users } from "lucide-react";

type TranslatedState = { text: string; loading: boolean; error?: string; target?: string; };

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "bho", label: "Bhojpuri" },
  { code: "gu", label: "Gujarati" },
  { code: "pa", label: "Punjabi" },
  { code: "mr", label: "Marathi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "auto", label: "Auto Detect" },
];

function extractTranslatedText(payload: any): string | null {
  if (!payload) return null;
  if (typeof payload.translated_text === "string") return payload.translated_text;
  if (typeof payload.translated === "string") return payload.translated;
  if (typeof payload.text === "string") return payload.text;
  if (typeof payload.trans === "string") return payload.trans;
  if (Array.isArray(payload) && payload.length) {
    const first = payload[0];
    if (typeof first === "string") return first;
    if (first.trans) return first.trans;
    if (first.translated_text) return first.translated_text;
    if (first.translated) return first.translated;
    if (first.text) return first.text;
  }
  if (payload?.data?.translations?.length) {
    const t = payload.data.translations[0];
    return t.translatedText || t.text || t.translation || null;
  }
  if (payload.result && typeof payload.result === "string") return payload.result;
  if (payload.translations && Array.isArray(payload.translations) && payload.translations[0]) {
    const t = payload.translations[0];
    return t.text || t.translatedText || t.translated || null;
  }
  if (typeof payload.translatedText === "string") return payload.translatedText;
  return null;
}

function getInitials(name?: string) {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
}
function getMessageTime(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function ChatRoom() {
  const { user } = useAuth();
  const { isConnected, messages, onlineCount, sendMessage } = useSocket();
  const [messageText, setMessageText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [translations, setTranslations] = useState<Record<string, Record<string, TranslatedState>>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const API_HOST = ((import.meta.env.VITE_API_HOST as string) || window.location.origin).replace(/\/+$/, "");

  useEffect(() => { try { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); } catch {} }, [messages, translations]);

  async function detectLanguage(text: string): Promise<string> {
    try {
      const res = await fetch(`${API_HOST}/api/v1/translator/detect-language`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok) return "auto";
      const payload = await res.json().catch(() => null);
      return payload?.source_lang_code || payload?.lang || payload?.language || "auto";
    } catch { return "auto"; }
  }

  async function translateText(text: string, from: string, to: string): Promise<string> {
    let source = from;
    if (from === "auto") source = await detectLanguage(text);
    const res = await fetch(`${API_HOST}/api/v1/translator/text`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, from: source, to }) });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`translate HTTP ${res.status}: ${body || res.statusText}`);
    }
    const payload = await res.json().catch(() => null);
    const translated = extractTranslatedText(payload);
    return translated ?? text;
  }

  const handleSend = (e?: React.FormEvent) => { e?.preventDefault(); if (!messageText.trim() || !isConnected) return; sendMessage(messageText.trim()); setMessageText(""); };

  const handleTranslateClick = async (msg: ChatMessage) => {
    const lang = targetLang;
    const existing = translations[msg.id]?.[lang];
    if (existing && !existing.error) { setShowOriginal((p) => ({ ...p, [msg.id]: !p[msg.id] })); return; }
    setTranslations((prev) => ({ ...prev, [msg.id]: { ...(prev[msg.id] || {}), [lang]: { text: prev[msg.id]?.[lang]?.text || "", loading: true, target: lang } } as any }));
    try {
      const tt = await translateText(msg.message, "auto", lang);
      setTranslations((prev) => ({ ...prev, [msg.id]: { ...(prev[msg.id] || {}), [lang]: { text: tt, loading: false, target: lang } } as any }));
      setShowOriginal((prev) => ({ ...prev, [msg.id]: false }));
    } catch (err: any) {
      setTranslations((prev) => ({ ...prev, [msg.id]: { ...(prev[msg.id] || {}), [lang]: { text: prev[msg.id]?.[lang]?.text || "", loading: false, error: String(err?.message || err), target: lang } } as any }));
    }
  };

  if (!user) return <div className="p-6 text-center">⚠️ Please log in to access the chat.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-16 pb-20 md:pt-0 md:pb-0 md:ml-64 min-h-screen">
        <div className="p-4 md:p-6 h-full">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Chat Room – { (user as any).student_Class ?? (user as any).studentClass }</h2>
                <p className="text-muted-foreground">Class Discussion</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm text-muted-foreground">{isConnected ? `${onlineCount || 0} online` : "Disconnected"}</span>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="mb-4 flex items-center space-x-3">
              <label className="text-sm text-foreground font-medium">Translate to:</label>
              <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="border rounded p-1 text-sm">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <div className="text-xs text-muted-foreground">Click "See Translation" for a message to translate it into the selected language.</div>
            </div>

            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]" data-testid="chat-messages">
                  {messages.length > 0 ? messages.map((msg, idx) => {
                    const isMine = msg.userId === user.id;
                    const tstate = translations[msg.id]?.[targetLang];
                    const showTrans = tstate && !showOriginal[msg.id];
                    const avatarUrl = (msg as any).idPhotoUrl || (user as any)?.idPhotoUrl || undefined;
                    return (
                      <div key={`${msg.id}-${idx}`} className={`flex space-x-3 ${isMine ? "justify-end" : ""}`}>
                        {!isMine && (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                            {avatarUrl ? <img src={avatarUrl} alt={msg.fullName} className="w-full h-full object-cover" /> : <span className="text-xs font-medium flex items-center justify-center h-full text-foreground">{getInitials(msg.fullName)}</span>}
                          </div>
                        )}

                        <div className={`flex-1 ${isMine ? "max-w-xs" : ""}`}>
                          {!isMine && (<div className="flex items-center space-x-2 mb-1"><span className="font-medium text-foreground text-sm">{msg.fullName || "Unknown"}</span><span className="text-xs text-muted-foreground">{getMessageTime(msg.createdAt)}</span></div>)}

                          <div className={`p-3 rounded-lg ${isMine ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-foreground"}`}>
                            <p className="text-sm">{showTrans && tstate ? tstate.text : msg.message}</p>

                            <div className="mt-1 flex items-center space-x-3">
                              {tstate?.loading ? <span className="text-xs text-muted-foreground">Translating…</span> : tstate?.error ? <>
                                <span className="text-xs text-red-500">Translation error: {tstate.error}</span>
                                <button type="button" className="text-xs text-muted-foreground underline ml-2" onClick={() => handleTranslateClick(msg)}>Retry</button>
                              </> : <button type="button" className="text-xs text-blue-500 underline" onClick={() => handleTranslateClick(msg)}>{showOriginal[msg.id] ? "See Original" : " See Translation"}</button>}

                              <button type="button" className="text-xs text-muted-foreground underline" onClick={async () => {
                                setTranslations((prev) => ({ ...prev, [msg.id]: { ...(prev[msg.id] || {}), [targetLang]: { text: prev[msg.id]?.[targetLang]?.text || "", loading: true, target: targetLang } } as any }));
                                try {
                                  const tt = await translateText(msg.message, "auto", targetLang);
                                  setTranslations((prev) => ({ ...prev, [msg.id]: { ...(prev[msg.id] || {}), [targetLang]: { text: tt, loading: false, target: targetLang } } as any }));
                                  setShowOriginal((p) => ({ ...p, [msg.id]: false }));
                                } catch (err: any) {
                                  setTranslations((prev) => ({ ...prev, [msg.id]: { ...(prev[msg.id] || {}), [targetLang]: { text: prev[msg.id]?.[targetLang]?.text || "", loading: false, error: String(err?.message || err), target: targetLang } } as any }));
                                }
                              }}>Re-translate</button>

                              {isMine && (<div className="flex-1 flex justify-end"><span className="text-xs opacity-70">{getMessageTime(msg.createdAt)}</span></div>)}
                            </div>
                          </div>
                        </div>

                        {isMine && (<div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-secondary">{((user as any)?.idPhotoUrl) ? <img src={(user as any).idPhotoUrl} alt={(user as any).fullName} className="w-full h-full object-cover" /> : <span className="text-xs font-medium flex items-center justify-center h-full text-secondary-foreground">{getInitials((user as any).fullName)}</span>}</div>)}
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4"><Send className="w-8 h-8 text-muted-foreground" /></div>
                      <h3 className="font-medium text-foreground mb-2">No messages yet</h3>
                      <p className="text-muted-foreground">Start the conversation by sending a message</p>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-border">
                  <form onSubmit={handleSend} className="flex space-x-3">
                    <Input type="text" placeholder={isConnected ? "Type your message..." : "Connecting..."} value={messageText} onChange={(e) => setMessageText(e.target.value)} disabled={!isConnected} className="flex-1" data-testid="input-message" />
                    <Button type="submit" disabled={!messageText.trim() || !isConnected} data-testid="button-send-message"><Send className="w-4 h-4" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
