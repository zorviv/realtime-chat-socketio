import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Listen for incoming messages
    socket.on('message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Listen for user connected events
    socket.on('user-connected', (data) => {
      setMessages((prevMessages) => [...prevMessages, {
        username: 'System',
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
    });

    // Listen for user disconnected events
    socket.on('user-disconnected', (data) => {
      setMessages((prevMessages) => [...prevMessages, {
        username: 'System',
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('message');
      socket.off('user-connected');
      socket.off('user-disconnected');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSetUsername = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('set-username', username);
      setIsUsernameSet(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('send-message', { username, message });
      setMessage('');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isUsernameSet) {
    return (
      <div className="app">
        <div className="username-container">
          <h1>Real-Time Chat</h1>
          <form onSubmit={handleSetUsername}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="username-input"
            />
            <button type="submit" className="submit-button">Join Chat</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <h2>Real-Time Chat</h2>
          <span className="username-display">Logged in as: {username}</span>
        </div>
        
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.username === 'System' ? 'system-message' : msg.username === username ? 'own-message' : 'other-message'}`}
            >
              <div className="message-header">
                <span className="message-username">{msg.username}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-text">{msg.message}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="message-input"
          />
          <button type="submit" className="send-button">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
