import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Dimensions, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { receiptsApi, DashboardStats, DailySpending, StoreSpending, Receipt } from '../services/api';

const { width } = Dimensions.get('window');
const CHART_COLORS = ['#4A6CFA', '#FF6B6B', '#4CAF50', '#FFC107', '#9C27B0', '#00BCD4', '#FF9800'];

function formatCurrency(amount: number) {
  return `₺${amount.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildLast7Days(dailyData: DailySpending[]): { labels: string[]; data: number[] } {
  const today = new Date();
  const labels: string[] = [];
  const data: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const found = dailyData.find((ds) => ds.date === dateStr);
    labels.push(String(d.getDate()));
    data.push(found ? found.amount : 0);
  }

  return { labels, data };
}

export default function HomeScreen() {
  const { token, username } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({
    labels: ['', '', '', '', '', '', ''],
    data: [0, 0, 0, 0, 0, 0, 0],
  });
  const [storeStats, setStoreStats] = useState<StoreSpending[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const now = new Date();
      const [statsRes, dailyRes, storeRes, receiptsRes] = await Promise.all([
        receiptsApi.getStats(token),
        receiptsApi.getDailySpending(token, now.getFullYear(), now.getMonth() + 1),
        receiptsApi.getStoreStats(token),
        receiptsApi.getAll(token),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (dailyRes.success && dailyRes.data) setChartData(buildLast7Days(dailyRes.data));
      if (storeRes.success && storeRes.data) setStoreStats(storeRes.data);
      if (receiptsRes.success && receiptsRes.data) {
        const sorted = [...receiptsRes.data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecentReceipts(sorted.slice(0, 5));
      }
    } catch {
      // silently fail — data stays as empty defaults
    }
  }, [token]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const pieData = storeStats.slice(0, 6).map((store, i) => ({
    name: store.storeName,
    population: store.totalSpending,
    color: CHART_COLORS[i % CHART_COLORS.length],
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A6CFA" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.helloText}>Hello, {username ?? 'User'}</Text>
        <Text style={styles.dashboardTitle}>Dashboard</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.statTitle}>Monthly Total</Text>
            <Text style={styles.statValue}>{formatCurrency(stats?.totalMonthlySpending ?? 0)}</Text>
          </View>
          <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.statTitle}>Average Receipt</Text>
            <Text style={styles.statValue}>{formatCurrency(stats?.averageReceiptValue ?? 0)}</Text>
          </View>
        </View>
        <View style={[styles.statCard, { marginTop: 16 }]}>
          <Text style={styles.statTitle}>Most Visited</Text>
          <Text style={styles.statValue}>{stats?.mostFrequentStore ?? '-'}</Text>
          <Text style={styles.statSubtitle}>{stats?.mostFrequentStoreVisitCount ?? 0} visits</Text>
        </View>
      </View>

      {/* Daily Spending Line Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily Spending (Last 7 Days)</Text>
        <LineChart
          data={{ labels: chartData.labels, datasets: [{ data: chartData.data }] }}
          width={width - 64}
          height={220}
          yAxisLabel="₺"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(74, 108, 250, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#4A6CFA' },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>

      {/* Store Spending Pie Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Spending by Store</Text>
        {pieData.length > 0 ? (
          <>
            <PieChart
              data={pieData}
              width={width - 64}
              height={200}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              hasLegend={false}
            />
            <View style={styles.legendContainer}>
              {pieData.map((item, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.legendValue}>{formatCurrency(item.population)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data yet</Text>
          </View>
        )}
      </View>

      {/* Recent Receipts */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Text style={styles.chartTitle}>Recent Receipts</Text>
        {recentReceipts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No receipts added yet</Text>
          </View>
        ) : (
          recentReceipts.map((receipt) => (
            <TouchableOpacity
              key={receipt.id}
              style={styles.receiptCard}
              onPress={() => navigation.navigate('ReceiptDetail', { receipt })}
              activeOpacity={0.7}
            >
              <View style={styles.receiptIcon}>
                <Text style={{ fontSize: 22 }}>🧾</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptStore}>{receipt.storeName}</Text>
                <Text style={styles.receiptDate}>{formatDate(receipt.date)}</Text>
              </View>
              <Text style={styles.receiptAmount}>{formatCurrency(receipt.totalAmount)}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { padding: 16, paddingTop: 24 },
  helloText: { fontSize: 14, color: '#888' },
  dashboardTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statsContainer: { paddingHorizontal: 16, marginBottom: 24 },
  statCard: {
    backgroundColor: '#fff', padding: 16, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, elevation: 2,
  },
  statTitle: { fontSize: 12, color: '#888', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statSubtitle: { fontSize: 11, color: '#aaa', marginTop: 2 },
  chartCard: {
    backgroundColor: '#fff', marginHorizontal: 16, padding: 16,
    borderRadius: 16, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  legendContainer: { marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { flex: 1, fontSize: 13, color: '#555' },
  legendValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  emptyContainer: {
    padding: 24, backgroundColor: '#fff', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { color: '#888', fontSize: 14 },
  receiptCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6, elevation: 2,
  },
  receiptIcon: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: '#EEF1FF', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  receiptStore: { fontSize: 14, fontWeight: '600', color: '#333' },
  receiptDate: { fontSize: 12, color: '#888', marginTop: 2 },
  receiptAmount: { fontSize: 15, fontWeight: 'bold', color: '#4A6CFA' },
});
