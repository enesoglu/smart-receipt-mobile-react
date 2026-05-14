import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ReceiptDetail'>;
  route: RouteProp<RootStackParamList, 'ReceiptDetail'>;
};

function formatCurrency(amount: number) {
  return `₺${amount.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ReceiptDetailScreen({ navigation, route }: Props) {
  const { receipt } = route.params;

  const itemsTotal = receipt.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt Detail</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Store card */}
        <View style={styles.storeCard}>
          <View style={styles.storeIcon}>
            <Text style={{ fontSize: 32 }}>🧾</Text>
          </View>
          <Text style={styles.storeName}>{receipt.storeName}</Text>
          <Text style={styles.storeDate}>{formatDate(receipt.date)}</Text>
          {receipt.categoryName ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{receipt.categoryName}</Text>
            </View>
          ) : null}
        </View>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{receipt.items.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={[styles.summaryValue, { color: '#4A6CFA' }]}>
              {formatCurrency(receipt.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Items list */}
        {receipt.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.itemsCard}>
              {receipt.items.map((item, index) => (
                <View
                  key={item.id ?? index}
                  style={[styles.itemRow, index < receipt.items.length - 1 && styles.itemRowBorder]}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    {item.quantity !== 1 && (
                      <Text style={styles.itemQty}>
                        {item.quantity} × {formatCurrency(item.unitPrice || item.price / item.quantity)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                </View>
              ))}

              {/* Total row */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(receipt.totalAmount)}</Text>
              </View>
            </View>
          </View>
        )}

        {receipt.items.length === 0 && (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyItemsText}>No items recorded for this receipt</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  content: { padding: 16, paddingBottom: 40 },
  storeCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8, elevation: 2,
  },
  storeIcon: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#EEF1FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  storeName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  storeDate: { fontSize: 14, color: '#888', marginBottom: 8 },
  categoryBadge: {
    backgroundColor: '#EEF1FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryText: { fontSize: 12, color: '#4A6CFA', fontWeight: '600' },
  summaryRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16,
    marginBottom: 16, paddingVertical: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8, elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  summaryDivider: { width: 1, backgroundColor: '#eee' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10 },
  itemsCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8, elevation: 2,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemLeft: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 14, color: '#333', fontWeight: '500' },
  itemQty: { fontSize: 12, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#333' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#F8F9FF', borderTopWidth: 1, borderTopColor: '#eee',
  },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#4A6CFA' },
  emptyItems: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center',
  },
  emptyItemsText: { fontSize: 14, color: '#888' },
});
