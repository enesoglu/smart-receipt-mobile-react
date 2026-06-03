import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { Receipt, receiptsApi } from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { formatCurrency, formatDate, formatIsoDate } from '../utils/format';

type FilterMode = 'all' | 'month' | 'threeMonths' | 'custom';

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function ReceiptCard({ receipt, onDelete, onPress }: { receipt: Receipt; onDelete: (id: number) => void; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardIcon}><Ionicons name="receipt-outline" size={22} color="#4A6CFA" /></View>
      <View style={styles.cardBody}>
        <Text style={styles.storeName}>{receipt.storeName}</Text>
        <Text style={styles.date}>{formatDate(receipt.date)}</Text>
        {receipt.categoryName ? <Text style={styles.categoryBadge}>{receipt.categoryName}</Text> : null}
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.amount}>{formatCurrency(receipt.totalAmount)}</Text>
        <Text style={styles.itemCount}>{receipt.items.length} items</Text>
        <TouchableOpacity onPress={() => onDelete(receipt.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={17} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function ReceiptsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [customStart, setCustomStart] = useState(addMonths(new Date(), -3));
  const [customEnd, setCustomEnd] = useState(new Date());
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const sortReceipts = (items: Receipt[]) =>
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const fetchReceipts = useCallback(async (mode = filterMode, start = customStart, end = customEnd) => {
    if (!token) return;
    const today = new Date();
    let response;

    if (mode === 'all') {
      response = await receiptsApi.list(token);
    } else if (mode === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      response = await receiptsApi.filterByDate(token, firstDay, today);
    } else if (mode === 'threeMonths') {
      response = await receiptsApi.filterByDate(token, addMonths(today, -3), today);
    } else {
      response = await receiptsApi.filterByDate(token, start, end);
    }

    if (response.success && response.data) setReceipts(sortReceipts(response.data));
  }, [customEnd, customStart, filterMode, token]);

  useEffect(() => {
    fetchReceipts().catch(() => undefined).finally(() => setLoading(false));
  }, [fetchReceipts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceipts().catch(() => undefined);
    setRefreshing(false);
  };

  const changeFilter = async (mode: FilterMode) => {
    setFilterMode(mode);
    setLoading(true);
    await fetchReceipts(mode).catch(() => undefined);
    setLoading(false);
    if (mode === 'custom') setPicker('start');
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Receipt', 'Delete this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await receiptsApi.remove(token, id);
            setReceipts((prev) => prev.filter((receipt) => receipt.id !== id));
          } catch {
            Alert.alert('Error', 'Could not delete receipt.');
          }
        },
      },
    ]);
  };

  const handleDateChange = (selected?: Date) => {
    if (!selected || !picker) {
      setPicker(null);
      return;
    }

    if (picker === 'start') {
      setCustomStart(selected);
      setPicker('end');
    } else {
      setCustomEnd(selected);
      setPicker(null);
      fetchReceipts('custom', customStart, selected).catch(() => undefined);
    }
  };

  if (loading) return <Spinner />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Receipts</Text>
          <Text style={styles.subtitle}>{receipts.length} total</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddReceipt', {})}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterWrap}>
        {([
          ['all', 'All'],
          ['month', 'This Month'],
          ['threeMonths', 'Last 3 Months'],
          ['custom', 'Custom Range'],
        ] as [FilterMode, string][]).map(([mode, label]) => (
          <TouchableOpacity key={mode} style={[styles.filterBtn, filterMode === mode && styles.filterBtnActive]} onPress={() => changeFilter(mode)}>
            <Text style={[styles.filterText, filterMode === mode && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filterMode === 'custom' ? (
        <TouchableOpacity style={styles.rangeRow} onPress={() => setPicker('start')}>
          <Text style={styles.rangeText}>{formatIsoDate(customStart)} to {formatIsoDate(customEnd)}</Text>
          <Ionicons name="calendar-outline" size={18} color="#4A6CFA" />
        </TouchableOpacity>
      ) : null}

      {picker ? (
        <DateTimePicker
          value={picker === 'start' ? customStart : customEnd}
          mode="date"
          onChange={(_, selected) => handleDateChange(selected)}
        />
      ) : null}

      <FlatList
        data={receipts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ReceiptCard
            receipt={item}
            onDelete={handleDelete}
            onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState title="No receipts yet" message="Scan your first receipt to get started." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#4A6CFA', justifyContent: 'center', alignItems: 'center' },
  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4E7F5' },
  filterBtnActive: { backgroundColor: '#4A6CFA', borderColor: '#4A6CFA' },
  filterText: { fontSize: 12, color: '#555', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  rangeRow: { marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 12, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rangeText: { fontSize: 13, color: '#333', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2 },
  cardIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EEF1FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  cardRight: { alignItems: 'flex-end' },
  storeName: { fontSize: 15, fontWeight: '700', color: '#333' },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
  categoryBadge: { marginTop: 5, alignSelf: 'flex-start', backgroundColor: '#EEF1FF', color: '#4A6CFA', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden', fontSize: 11, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '700', color: '#4A6CFA' },
  itemCount: { fontSize: 11, color: '#999', marginTop: 2 },
  deleteBtn: { marginTop: 6 },
});
