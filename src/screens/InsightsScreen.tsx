import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Insight, ItemAggregate, receiptsApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Spinner } from '../components/Spinner';
import { formatCurrency } from '../utils/format';

export default function InsightsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [items, setItems] = useState<ItemAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([receiptsApi.insights(token), receiptsApi.topItems(token, 10)])
      .then(([insightRes, itemsRes]) => {
        if (insightRes.success && insightRes.data) setInsight(insightRes.data);
        if (itemsRes.success && itemsRes.data) setItems(itemsRes.data);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Smart Insights</Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Insight</Text>
        <Text style={styles.message}>{insight?.message ?? 'No insight yet.'}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.itemName}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.listTitle}>Top Items</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.itemName}>{item.itemName}</Text>
              <Text style={styles.meta}>{item.occurrenceCount} purchases • Avg {formatCurrency(item.averageUnitPrice)}</Text>
            </View>
            <Text style={styles.amount}>{formatCurrency(item.totalSpent)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  headerIcon: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },
  card: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 8 },
  message: { color: '#555', fontSize: 14, lineHeight: 20 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 10 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2 },
  rowBody: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#333' },
  meta: { color: '#888', fontSize: 12, marginTop: 4 },
  amount: { color: '#4A6CFA', fontSize: 15, fontWeight: '800' },
});
