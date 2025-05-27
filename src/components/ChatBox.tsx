import React, { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { useAgent } from '../lib/state';

type Message = {
  text: string;
  isBot: boolean;
  timestamp: Date;
};

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { client, connected } = useLiveAPIContext();
  const { current: agent } = useAgent();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleContent = (content: any) => {
      if (content.modelTurn?.parts?.[0]?.text) {
        setMessages(prev => [
          ...prev,
          {
            text: content.modelTurn.parts[0].text,
            isBot: true,
            timestamp: new Date(),
          },
        ]);
      }
    };

    client.on('content', handleContent);
    return () => {
      client.off('content', handleContent);
    };
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !connected) return;

    const newMessage = {
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    client.send({ text: inputText });
    setInputText('');
  };

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.isBot ? 'bot' : 'user'}`}
          >
            <div className="message-header">
              <span className="sender">
                {message.isBot ? agent.name : 'You'}
              </span>
              <span className="timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{message.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Type your message..."
          disabled={!connected}
        />
        <button type="submit" disabled={!connected}>
          Send
        </button>
      </form>
    </div>
  );
}