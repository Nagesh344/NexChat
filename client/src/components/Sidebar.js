import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWS } from '../context/WSContext';
import api from '../utils/api';
import styles from './Sidebar.module.css';

export default function Sidebar({ activeRoom, onRoomSelect }) {
  const { user, logout } = useAuth();
  const { connected } = useWS();
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('rooms');
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data.rooms);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/rooms', { name: newRoom.trim() });
      setRooms((prev) => [data.room, ...prev]);
      setNewRoom('');
      setShowCreate(false);
      onRoomSelect(data.room.name);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || '??';

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span>NexChat</span>
        </div>
        <div className={`${styles.wsStatus} ${connected ? styles.online : styles.offline}`}>
          <span className={styles.dot} />
          {connected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      {/* User */}
      <div className={styles.userBar}>
        <div className={styles.avatar}>{getInitials(user?.username)}</div>
        <div className={styles.userInfo}>
          <span className={styles.username}>{user?.username}</span>
          <span className={styles.userEmail}>{user?.email}</span>
        </div>
        <button className={styles.logoutBtn} onClick={logout} title="Logout">⏻</button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'rooms' ? styles.active : ''}`}
          onClick={() => setTab('rooms')}
        >
          # Rooms
        </button>
        <button
          className={`${styles.tab} ${tab === 'users' ? styles.active : ''}`}
          onClick={() => setTab('users')}
        >
          ⊕ Users
        </button>
      </div>

      {/* Content */}
      <div className={styles.list}>
        {tab === 'rooms' && (
          <>
            <div className={styles.sectionHeader}>
              <span>Channels</span>
              <button className={styles.addBtn} onClick={() => setShowCreate(!showCreate)}>+</button>
            </div>

            {showCreate && (
              <form onSubmit={createRoom} className={styles.createForm}>
                <input
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="room-name"
                  maxLength={30}
                  autoFocus
                />
                <button type="submit" disabled={creating}>
                  {creating ? '...' : 'Create'}
                </button>
              </form>
            )}

            {rooms.map((room) => (
              <button
                key={room._id}
                className={`${styles.roomItem} ${activeRoom === room.name ? styles.roomActive : ''}`}
                onClick={() => onRoomSelect(room.name)}
              >
                <span className={styles.roomHash}>#</span>
                <span className={styles.roomName}>{room.name}</span>
                {room.members?.length > 0 && (
                  <span className={styles.memberCount}>{room.members.length}</span>
                )}
              </button>
            ))}

            {rooms.length === 0 && (
              <p className={styles.empty}>No rooms yet. Create one!</p>
            )}
          </>
        )}

        {tab === 'users' && (
          <>
            <div className={styles.sectionHeader}>
              <span>Online — {users.filter((u) => u.status === 'online').length}</span>
            </div>
            {users.map((u) => (
              <div key={u._id} className={styles.userItem}>
                <div className={styles.userAvatar}>
                  {getInitials(u.username)}
                  <span className={`${styles.statusDot} ${styles[u.status]}`} />
                </div>
                <span className={styles.userName}>{u.username}</span>
              </div>
            ))}
            {users.length === 0 && (
              <p className={styles.empty}>No other users yet.</p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
