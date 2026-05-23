import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { receiptsApi, Receipt } from '../services/api';

function formatCurrency(amount: number) {
  return `₺${amount.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ReceiptCard({ receipt, onDelete, onPress }: { receipt: Receipt; onDelete: (id: number) => void; onPress: () => void }) {
  const handleDelete = () => {
    Alert.alert('Delete Receipt', `Delete receipt from ${receipt.storeName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(receipt.id) },
    ]);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardIcon}>
        <Text style={{ fontSize: 22 }}>🧾</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.storeName}>{receipt.storeName}</Text>
        <Text style={styles.date}>{formatDate(receipt.date)}</Text>
        {receipt.categoryName ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{receipt.categoryName}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.amount}>{formatCurrency(receipt.totalAmount)}</Text>
        <Text style={styles.itemCount}>{receipt.items.length} items</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function ReceiptsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReceipts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await receiptsApi.getAll(token);
      if (res.success && res.data) {
        const sorted = [...res.data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setReceipts(sorted);
      }
    } catch {
      // silently fail
    }
  }, [token]);

  useEffect(() => {
    fetchReceipts().finally(() => setLoading(false));
  }, [fetchReceipts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceipts();
    setRefreshing(false);
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const res = await receiptsApi.deleteReceipt(token, id);
      if (res.success) {
        setReceipts((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      Alert.alert('Error', 'Could not delete receipt');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A6CFA" />
      </View>
    );
  }

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

      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ReceiptCard
            receipt={item}
            onDelete={handleDelete}
            onPress={() => navigation.navigate('ReceiptDetail', { receipt: item })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>No Receipts Yet</Text>
            <Text style={styles.emptyText}>Scan your first receipt to get started</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12, backgroundColor: '#F5F5F5',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  addBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#4A6CFA', justifyContent: 'center', alignItems: 'center',
  },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8, elevation: 2,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#EEF1FF', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  storeName: { fontSize: 15, fontWeight: '600', color: '#333' },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
  categoryBadge: {
    marginTop: 5, alignSelf: 'flex-start',
    backgroundColor: '#EEF1FF', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  categoryText: { fontSize: 11, color: '#4A6CFA', fontWeight: '500' },
  amount: { fontSize: 15, fontWeight: 'bold', color: '#4A6CFA' },
  itemCount: { fontSize: 11, color: '#aaa', marginTop: 2 },
  deleteBtn: { marginTop: 6 },
  deleteBtnText: { fontSize: 11, color: '#FF6B6B', fontWeight: '500' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
});
