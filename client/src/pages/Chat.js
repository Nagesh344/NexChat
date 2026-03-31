import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import styles from './Chat.module.css';

export default function Chat() {
  const [activeRoom, setActiveRoom] = useState(null);

  return (
    <div className={styles.layout}>
      <Sidebar activeRoom={activeRoom} onRoomSelect={setActiveRoom} />
      <ChatWindow room={activeRoom} />
    </div>
  );
}
