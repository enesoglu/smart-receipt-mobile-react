import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import {
  BudgetStatus, BudgetSummary, CategorySpending, DailySpending, DashboardStats,
  Insight, Receipt, StoreSpending, budgetsApi, receiptsApi,
} from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { formatCurrency, formatDate } from '../utils/format';

const { width } = Dimensions.get('window');
const CHART_COLORS = ['#4A6CFA', '#FF6B6B', '#4CAF50', '#FFC107', '#00BCD4', '#FF9800'];

function buildLast7Days(dailyData: DailySpending[]) {
  const today = new Date();
  const labels: string[] = [];
  const data: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    labels.push(String(date.getDate()));
    data.push(dailyData.find((item) => item.date === key)?.amount ?? 0);
  }

  return { labels, data };
}

export default function HomeScreen() {
  const { token, user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState({ labels: ['', '', '', '', '', '', ''], data: [0, 0, 0, 0, 0, 0, 0] });
  const [storeStats, setStoreStats] = useState<StoreSpending[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetStatus[]>([]);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;

    const now = new Date();
    const [statsRes, dailyRes, storeRes, receiptsRes, budgetRes, alertsRes, insightRes, dashboardRes] = await Promise.all([
      receiptsApi.stats(token),
      receiptsApi.dailySpending(token, now.getFullYear(), now.getMonth() + 1),
      receiptsApi.storeStats(token),
      receiptsApi.list(token),
      budgetsApi.summary(token),
      budgetsApi.alerts(token),
      receiptsApi.insights(token),
      receiptsApi.dashboard(token),
    ]);

    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    if (dailyRes.success && dailyRes.data) setChartData(buildLast7Days(dailyRes.data));
    if (storeRes.success && storeRes.data) setStoreStats(storeRes.data);
    if (budgetRes.success && budgetRes.data) setBudgetSummary(budgetRes.data);
    if (alertsRes.success && alertsRes.data) setBudgetAlerts(alertsRes.data.slice(0, 3));
    if (insightRes.success && insightRes.data) setInsight(insightRes.data);
    if (dashboardRes.success && dashboardRes.data) setCategoryData(dashboardRes.data.categoryData ?? []);
    if (receiptsRes.success && receiptsRes.data) {
      setRecentReceipts([...receiptsRes.data]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5));
    }
  }, [token]);

  useEffect(() => {
    fetchData().catch(() => undefined).finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData().catch(() => undefined);
    setRefreshing(false);
  };

  const pieData = useMemo(() => storeStats.slice(0, 6).map((store, index) => ({
    name: store.storeName,
    population: store.totalSpending,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: '#333',
    legendFontSize: 12,
  })), [storeStats]);

  const budgetRatio = budgetSummary && budgetSummary.totalBudget > 0
    ? Math.min(budgetSummary.totalSpent / budgetSummary.totalBudget, 1)
    : 0;
  const firstName = user?.fullName.split(' ')[0] || 'there';

  if (loading) return <Spinner />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.helloText}>Hello, {firstName}</Text>
        <Text style={styles.dashboardTitle}>Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.flexCard]}>
            <Text style={styles.statTitle}>Monthly Total</Text>
            <Text style={styles.statValue}>{formatCurrency(stats?.totalMonthlySpending)}</Text>
          </View>
          <View style={[styles.statCard, styles.flexCard]}>
            <Text style={styles.statTitle}>Average Receipt</Text>
            <Text style={styles.statValue}>{formatCurrency(stats?.averageReceiptValue)}</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Most Visited</Text>
          <Text style={styles.statValue}>{stats?.mostFrequentStore || '-'}</Text>
          <Text style={styles.statSubtitle}>{stats?.mostFrequentStoreVisitCount ?? 0} visits</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Budget Snapshot</Text>
        <View style={styles.budgetLine}>
          <Text style={styles.budgetAmount}>{formatCurrency(budgetSummary?.totalSpent)} / {formatCurrency(budgetSummary?.totalBudget)}</Text>
          <Text style={[styles.budgetState, (budgetSummary?.totalSpent ?? 0) > (budgetSummary?.totalBudget ?? 0) && styles.overBudget]}>
            {formatCurrency(budgetSummary?.totalRemaining)} left
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill,
            { width: `${budgetRatio * 100}%` as any },
            (budgetSummary?.totalSpent ?? 0) > (budgetSummary?.totalBudget ?? 0) && styles.progressOver,
          ]} />
        </View>
        <View style={styles.alertRow}>
          {budgetAlerts.length === 0 ? (
            <Text style={styles.mutedText}>No budget alerts this month.</Text>
          ) : budgetAlerts.map((alert) => (
            <TouchableOpacity key={alert.categoryId} style={styles.alertChip} onPress={() => navigation.navigate('Budgets')}>
              <Text style={styles.alertText}>{alert.categoryName}: Spent {formatCurrency(alert.spent)} of {formatCurrency(alert.monthlyBudgetLimit)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Spending (Last 7 Days)</Text>
        <LineChart
          data={{ labels: chartData.labels, datasets: [{ data: chartData.data }] }}
          width={width - 64}
          height={210}
          yAxisLabel="\u20BA"
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spending by Store</Text>
        {pieData.length > 0 ? (
          <>
            <PieChart
              data={pieData}
              width={width - 64}
              height={190}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              hasLegend={false}
              absolute
            />
            {pieData.map((item) => (
              <View key={item.name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.legendValue}>{formatCurrency(item.population)}</Text>
              </View>
            ))}
          </>
        ) : <EmptyState title="No store data yet" message="Add receipts to see spending by store." />}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Smart Insight</Text>
        <Text style={styles.insightText}>{insight?.message ?? 'No spending insight yet.'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spending by Category</Text>
        {categoryData.length === 0 ? (
          <Text style={styles.mutedText}>No category spending yet.</Text>
        ) : categoryData.map((category) => (
          <View key={category.categoryId} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{category.categoryName}</Text>
            <Text style={styles.categoryValue}>{formatCurrency(category.totalSpending)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.cardTitle}>Recent Receipts</Text>
        {recentReceipts.length === 0 ? (
          <EmptyState title="No receipts added yet" message="Scan your first receipt to get started." />
        ) : recentReceipts.map((receipt) => (
          <TouchableOpacity
            key={receipt.id}
            style={styles.receiptCard}
            onPress={() => navigation.navigate('ReceiptDetail', { receiptId: receipt.id })}
          >
            <View style={styles.receiptIcon}><Text style={styles.receiptIconText}>R</Text></View>
            <View style={styles.receiptBody}>
              <Text style={styles.receiptStore}>{receipt.storeName}</Text>
              <Text style={styles.receiptDate}>{formatDate(receipt.date)}</Text>
            </View>
            <Text style={styles.receiptAmount}>{formatCurrency(receipt.totalAmount)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(74,108,250,${opacity})`,
  labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#4A6CFA' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 16, paddingTop: 24 },
  helloText: { fontSize: 14, color: '#888' },
  dashboardTitle: { fontSize: 24, fontWeight: '700', color: '#333' },
  statsContainer: { paddingHorizontal: 16, gap: 12, marginBottom: 18 },
  statsRow: { flexDirection: 'row', gap: 12 },
  flexCard: { flex: 1 },
  statCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2 },
  statTitle: { fontSize: 12, color: '#888', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#333' },
  statSubtitle: { fontSize: 11, color: '#aaa', marginTop: 2 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 18, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  budgetLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  budgetAmount: { fontSize: 15, fontWeight: '700', color: '#333', flex: 1 },
  budgetState: { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
  overBudget: { color: '#FF6B6B' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#EEF1FF', overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#4A6CFA' },
  progressOver: { backgroundColor: '#FF6B6B' },
  alertRow: { gap: 8, marginTop: 12 },
  alertChip: { borderRadius: 8, backgroundColor: '#FFF0F0', paddingHorizontal: 10, paddingVertical: 8 },
  alertText: { color: '#D64545', fontSize: 12, fontWeight: '600' },
  mutedText: { color: '#888', fontSize: 13 },
  chart: { borderRadius: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { flex: 1, fontSize: 13, color: '#555' },
  legendValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  insightText: { fontSize: 14, color: '#555', lineHeight: 20 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F1F1' },
  categoryName: { fontSize: 14, color: '#444', fontWeight: '600' },
  categoryValue: { fontSize: 14, color: '#4A6CFA', fontWeight: '700' },
  recentSection: { paddingHorizontal: 16, paddingBottom: 40 },
  receiptCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2 },
  receiptIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#EEF1FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  receiptIconText: { color: '#4A6CFA', fontWeight: '800' },
  receiptBody: { flex: 1 },
  receiptStore: { fontSize: 14, fontWeight: '700', color: '#333' },
  receiptDate: { fontSize: 12, color: '#888', marginTop: 2 },
  receiptAmount: { fontSize: 15, fontWeight: '700', color: '#4A6CFA' },
});
