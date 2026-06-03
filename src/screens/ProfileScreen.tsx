import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { DashboardStats, receiptsApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatCurrency } from '../utils/format';

type MenuRoute = 'Categories' | 'Budgets' | 'Insights' | 'Export' | 'EditProfile';

function MenuRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={20} color="#4A6CFA" />
      <Text style={styles.menuLabel}>{label}</Text>
      {value ? <Text style={styles.menuValue} numberOfLines={1}>{value}</Text> : <Ionicons name="chevron-forward" size={18} color="#BBB" />}
    </>
  );

  return onPress ? (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>{content}</TouchableOpacity>
  ) : (
    <View style={styles.menuItem}>{content}</View>
  );
}

export default function ProfileScreen() {
  const { token, user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    receiptsApi.stats(token)
      .then((response) => { if (response.success && response.data) setStats(response.data); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { void logout(); } },
    ]);
  };

  const go = (route: MenuRoute) => navigation.navigate(route as any);
  const initial = user?.fullName?.[0]?.toUpperCase() ?? '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
        <Text style={styles.fullName}>{user?.fullName ?? 'SmartReceipt User'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#4A6CFA" style={{ marginVertical: 24 }} />
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(stats?.totalMonthlySpending)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(stats?.averageReceiptValue)}</Text>
            <Text style={styles.statLabel}>Avg Receipt</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.mostFrequentStoreVisitCount ?? 0}</Text>
            <Text style={styles.statLabel}>Store Visits</Text>
          </View>
        </View>
      )}

      <View style={styles.menu}>
        <MenuRow icon="person-outline" label="Full Name" value={user?.fullName ?? '-'} />
        <MenuRow icon="mail-outline" label="Email" value={user?.email ?? '-'} />
        <MenuRow icon="pricetags-outline" label="Categories & Budgets" onPress={() => go('Categories')} />
        <MenuRow icon="wallet-outline" label="Monthly Budget" onPress={() => go('Budgets')} />
        <MenuRow icon="bulb-outline" label="Smart Insights" onPress={() => go('Insights')} />
        <MenuRow icon="download-outline" label="Export Data" onPress={() => go('Export')} />
        <MenuRow icon="create-outline" label="Edit Profile" onPress={() => go('EditProfile')} />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 32 },
  avatarSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 24, backgroundColor: '#fff' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#4A6CFA', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  fullName: { fontSize: 20, fontWeight: '700', color: '#333' },
  email: { fontSize: 13, color: '#888', marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 16, marginHorizontal: 16, borderRadius: 12, paddingVertical: 18, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#4A6CFA' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  divider: { width: 1, backgroundColor: '#eee' },
  menu: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuLabel: { flex: 1, fontSize: 14, color: '#555', marginLeft: 12 },
  menuValue: { fontSize: 14, color: '#333', fontWeight: '600', maxWidth: 170 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 24, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, gap: 8, elevation: 2 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#FF6B6B' },
});
