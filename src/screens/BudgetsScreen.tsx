import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { BudgetSummary, BudgetStatus, budgetsApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Spinner } from '../components/Spinner';
import { formatCurrency, monthLabel } from '../utils/format';

function shiftMonth(date: Date, delta: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + delta);
  return next;
}

function statusColor(item: BudgetStatus) {
  if (item.usagePercent >= 100) return '#FF6B6B';
  if (item.usagePercent >= 80) return '#FFC107';
  return '#4A6CFA';
}

export default function BudgetsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [month, setMonth] = useState(new Date());
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async (target = month) => {
    if (!token) return;
    const response = await budgetsApi.summary(token, target.getFullYear(), target.getMonth() + 1);
    if (response.success && response.data) setSummary(response.data);
  }, [month, token]);

  useEffect(() => {
    fetchSummary().catch(() => undefined).finally(() => setLoading(false));
  }, [fetchSummary]);

  const changeMonth = async (delta: number) => {
    const next = shiftMonth(month, delta);
    setMonth(next);
    setLoading(true);
    await fetchSummary(next).catch(() => undefined);
    setLoading(false);
  };

  if (loading) return <Spinner />;

  const ratio = summary && summary.totalBudget > 0 ? Math.min(summary.totalSpent / summary.totalBudget, 1) : 0;
  const categories = summary?.categories ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Monthly Budget</Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={24} color="#4A6CFA" /></TouchableOpacity>
        <Text style={styles.monthText}>{monthLabel(month)}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={24} color="#4A6CFA" /></TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{formatCurrency(summary?.totalSpent)} / {formatCurrency(summary?.totalBudget)}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${ratio * 100}%` as any }, (summary?.totalSpent ?? 0) > (summary?.totalBudget ?? 0) && styles.progressOver]} />
        </View>
        <Text style={styles.summaryMeta}>Remaining: {formatCurrency(summary?.totalRemaining)}</Text>
        <Text style={styles.summaryMeta}>Over budget: {summary?.overBudgetCategoryCount ?? 0} categories</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.categoryId)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const color = statusColor(item);
          const width = item.hasBudget ? Math.min(item.usagePercent, 100) : 0;
          return (
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('EditCategory', { categoryId: item.categoryId })}>
              <MaterialIcons name={(item.iconUrl || 'receipt') as any} size={22} color="#4A6CFA" />
              <View style={styles.rowBody}>
                <Text style={styles.categoryName}>{item.categoryName}</Text>
                <View style={styles.progressTrackSmall}>
                  <View style={[styles.progressFillSmall, { width: `${width}%` as any, backgroundColor: color }]} />
                </View>
                <Text style={styles.rowMeta}>
                  {item.hasBudget ? `${formatCurrency(item.spent)} / ${formatCurrency(item.monthlyBudgetLimit)}` : 'No budget set'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  headerIcon: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  monthText: { fontSize: 16, color: '#333', fontWeight: '800' },
  summaryCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: '#333' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#EEF1FF', overflow: 'hidden', marginVertical: 12 },
  progressFill: { height: '100%', backgroundColor: '#4A6CFA' },
  progressOver: { backgroundColor: '#FF6B6B' },
  summaryMeta: { color: '#666', fontSize: 13, marginTop: 3 },
  list: { padding: 16, paddingBottom: 32 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, elevation: 2 },
  rowBody: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '800', color: '#333' },
  progressTrackSmall: { height: 6, borderRadius: 3, backgroundColor: '#EEF1FF', overflow: 'hidden', marginTop: 8 },
  progressFillSmall: { height: '100%' },
  rowMeta: { color: '#777', fontSize: 12, marginTop: 6 },
});
