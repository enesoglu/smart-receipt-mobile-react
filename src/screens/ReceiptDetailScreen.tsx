import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MEDIA_BASE_URL, Receipt, receiptsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { formatCurrency, formatDate } from '../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ReceiptDetail'>;
  route: RouteProp<RootStackParamList, 'ReceiptDetail'>;
};

export default function ReceiptDetailScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { receiptId } = route.params;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReceipt = useCallback(async () => {
    if (!token) return;
    const response = await receiptsApi.get(token, receiptId);
    if (response.success && response.data) setReceipt(response.data);
  }, [receiptId, token]);

  useEffect(() => {
    fetchReceipt().catch(() => undefined).finally(() => setLoading(false));
  }, [fetchReceipt]);

  useFocusEffect(useCallback(() => {
    fetchReceipt().catch(() => undefined);
  }, [fetchReceipt]));

  const handleDelete = () => {
    Alert.alert('Delete Receipt', 'Delete this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await receiptsApi.remove(token, receiptId);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Could not delete receipt.');
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceipt().catch(() => undefined);
    setRefreshing(false);
  };

  if (loading) return <Spinner />;
  if (!receipt) return <EmptyState title="Receipt not found" message="This receipt could not be loaded." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt Detail</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.push('AddReceipt', { receiptId })} style={styles.headerIcon}>
            <Ionicons name="pencil-outline" size={21} color="#4A6CFA" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerIcon}>
            <Ionicons name="trash-outline" size={21} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {receipt.photoUrl ? (
          <Image source={{ uri: `${MEDIA_BASE_URL}${receipt.photoUrl}` }} style={styles.photo} resizeMode="cover" />
        ) : null}

        <View style={styles.storeCard}>
          <View style={styles.storeIcon}><Ionicons name="receipt-outline" size={32} color="#4A6CFA" /></View>
          <Text style={styles.storeName}>{receipt.storeName}</Text>
          <Text style={styles.storeDate}>{formatDate(receipt.date)}</Text>
          {receipt.categoryName ? <Text style={styles.categoryBadge}>{receipt.categoryName}</Text> : null}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{receipt.items.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={[styles.summaryValue, styles.totalValue]}>{formatCurrency(receipt.totalAmount)}</Text>
          </View>
        </View>

        {receipt.items.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.itemsCard}>
              {receipt.items.map((item, index) => (
                <View key={`${item.id ?? index}-${item.itemName}`} style={[styles.itemRow, index < receipt.items.length - 1 && styles.itemRowBorder]}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    {item.quantity !== 1 ? (
                      <Text style={styles.itemQty}>{item.quantity} x {formatCurrency(item.unitPrice || item.price / item.quantity)}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{formatCurrency(receipt.totalAmount)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <EmptyState title="No items recorded" message="This receipt has no item-level details." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerIcon: { minWidth: 34, minHeight: 34, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  headerActions: { flexDirection: 'row', gap: 6 },
  content: { padding: 16, paddingBottom: 40 },
  photo: { width: '100%', height: 220, borderRadius: 12, marginBottom: 16 },
  storeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 2 },
  storeIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#EEF1FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  storeName: { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 4 },
  storeDate: { fontSize: 14, color: '#888', marginBottom: 8 },
  categoryBadge: { backgroundColor: '#EEF1FF', color: '#4A6CFA', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden', fontSize: 12, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, paddingVertical: 16, elevation: 2 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#333' },
  totalValue: { color: '#4A6CFA' },
  summaryDivider: { width: 1, backgroundColor: '#eee' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10 },
  itemsCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemLeft: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 14, color: '#333', fontWeight: '600' },
  itemQty: { fontSize: 12, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#333' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#F8F9FF' },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#333' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#4A6CFA' },
});
