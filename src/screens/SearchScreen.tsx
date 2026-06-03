import React, { useState } from 'react';
import {
  ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Receipt, receiptsApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';

export default function SearchScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!token) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);

    try {
      const response = await receiptsApi.search(token, query.trim());
      setResults(response.success && response.data
        ? [...response.data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search by store or item..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#4A6CFA" /></View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}>
              <View style={styles.cardIcon}><Ionicons name="receipt-outline" size={22} color="#4A6CFA" /></View>
              <View style={styles.cardBody}>
                <Text style={styles.storeName}>{item.storeName}</Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <Text style={styles.itemCount}>{item.items.length} items</Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            searched
              ? <EmptyState icon="search-outline" title="No results found" message="Try a different store or item name." />
              : <EmptyState icon="search-outline" title="Search your receipts" message="Type a store name or product to find receipts." />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#333' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, alignItems: 'center', gap: 8 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 46, elevation: 2 },
  searchIcon: { marginRight: 6 },
  input: { flex: 1, fontSize: 14, color: '#333' },
  searchButton: { backgroundColor: '#4A6CFA', borderRadius: 12, paddingHorizontal: 16, height: 46, justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2 },
  cardIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EEF1FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  storeName: { fontSize: 15, fontWeight: '700', color: '#333' },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
  itemCount: { fontSize: 11, color: '#999', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', color: '#4A6CFA' },
});
