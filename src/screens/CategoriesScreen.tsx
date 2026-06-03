import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Category, categoriesApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { formatCurrency } from '../utils/format';

export default function CategoriesScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    const response = await categoriesApi.list(token);
    if (response.success && response.data) setCategories(response.data);
    setLoading(false);
  }, [token]);

  useFocusEffect(useCallback(() => {
    fetchCategories().catch(() => setLoading(false));
  }, [fetchCategories]));

  const cloneCategory = (category: Category) => {
    Alert.alert('System default - clone to edit', 'Create a personal copy?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create a personal copy',
        onPress: async () => {
          if (!token) return;
          await categoriesApi.create(token, {
            name: category.name,
            iconUrl: category.iconUrl ?? 'receipt',
            monthlyBudgetLimit: null,
          });
          await fetchCategories();
        },
      },
    ]);
  };

  if (loading) return <Spinner />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Categories & Budgets</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditCategory', {})} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => item.isSystemDefault ? cloneCategory(item) : navigation.navigate('EditCategory', { categoryId: item.id })}
          >
            <View style={styles.iconWrap}>
              <MaterialIcons name={(item.iconUrl || 'receipt') as any} size={22} color="#4A6CFA" />
            </View>
            <View style={styles.rowBody}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.isSystemDefault ? <Ionicons name="lock-closed-outline" size={14} color="#999" /> : null}
              </View>
              <Text style={styles.budgetText}>
                {item.monthlyBudgetLimit ? `Budget: ${formatCurrency(item.monthlyBudgetLimit)} / month` : 'No budget'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#BBB" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState title="No categories" message="Create a category to organize receipts." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  headerIcon: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#333' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4A6CFA', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 2 },
  iconWrap: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#EEF1FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowBody: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, color: '#333', fontWeight: '700' },
  budgetText: { fontSize: 12, color: '#888', marginTop: 3 },
});
