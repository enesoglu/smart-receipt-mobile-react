import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { receiptsApi, DashboardStats } from '../services/api';

export default function ProfileScreen() {
  const { token, username, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    receiptsApi.getStats(token)
      .then((res) => { if (res.success && res.data) setStats(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{username ? username[0].toUpperCase() : '?'}</Text>
        </View>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.memberLabel}>Smart Receipt Member</Text>
      </View>

      {/* Stats Summary */}
      {loading ? (
        <ActivityIndicator color="#4A6CFA" style={{ marginVertical: 24 }} />
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ₺{(stats?.totalMonthlySpending ?? 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ₺{(stats?.averageReceiptValue ?? 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Avg Receipt</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.mostFrequentStoreVisitCount ?? 0}</Text>
            <Text style={styles.statLabel}>Store Visits</Text>
          </View>
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menu}>
        <View style={styles.menuItem}>
          <Ionicons name="person-outline" size={20} color="#4A6CFA" />
          <Text style={styles.menuLabel}>Username</Text>
          <Text style={styles.menuValue}>{username}</Text>
        </View>

        {stats?.mostFrequentStore && (
          <View style={styles.menuItem}>
            <Ionicons name="storefront-outline" size={20} color="#4A6CFA" />
            <Text style={styles.menuLabel}>Favorite Store</Text>
            <Text style={styles.menuValue} numberOfLines={1}>{stats.mostFrequentStore}</Text>
          </View>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  avatarSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 24, backgroundColor: '#fff' },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#4A6CFA', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  username: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  memberLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', marginTop: 16,
    marginHorizontal: 16, borderRadius: 16, paddingVertical: 18,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#4A6CFA' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  divider: { width: 1, backgroundColor: '#eee' },
  menu: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6, elevation: 2,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  menuLabel: { flex: 1, fontSize: 14, color: '#555', marginLeft: 12 },
  menuValue: { fontSize: 14, color: '#333', fontWeight: '500', maxWidth: 150 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 24, backgroundColor: '#fff',
    borderRadius: 16, paddingVertical: 16, gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6, elevation: 2,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#FF6B6B' },
});
