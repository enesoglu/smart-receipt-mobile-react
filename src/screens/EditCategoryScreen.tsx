import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Category, categoriesApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Spinner } from '../components/Spinner';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditCategory'>;
  route: RouteProp<RootStackParamList, 'EditCategory'>;
};

export default function EditCategoryScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const categoryId = route.params?.categoryId;
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('receipt');
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState('');
  const [loading, setLoading] = useState(Boolean(categoryId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !categoryId) return;
    categoriesApi.list(token)
      .then((response) => {
        const found = response.data?.find((item) => item.id === categoryId) ?? null;
        setCategory(found);
        if (found) {
          setName(found.name);
          setIconUrl(found.iconUrl ?? 'receipt');
          setMonthlyBudgetLimit(found.monthlyBudgetLimit ? String(found.monthlyBudgetLimit) : '');
        }
      })
      .finally(() => setLoading(false));
  }, [categoryId, token]);

  const save = async () => {
    if (!token) return;
    if (name.trim().length < 2 || name.trim().length > 50) {
      Alert.alert('Error', 'Category name must be between 2 and 50 characters.');
      return;
    }
    const limit = monthlyBudgetLimit.trim() ? Number(monthlyBudgetLimit) : null;
    if (limit !== null && (Number.isNaN(limit) || limit < 0)) {
      Alert.alert('Error', 'Monthly budget must be zero or greater.');
      return;
    }

    setSaving(true);
    try {
      if (categoryId) {
        await categoriesApi.update(token, categoryId, { name: name.trim(), iconUrl: iconUrl.trim() || 'receipt', monthlyBudgetLimit: limit });
      } else {
        await categoriesApi.create(token, { name: name.trim(), iconUrl: iconUrl.trim() || 'receipt', monthlyBudgetLimit: limit });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!token || !categoryId) return;
    Alert.alert('Delete Category', 'Delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await categoriesApi.remove(token, categoryId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) return <Spinner />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{categoryId ? 'Edit Category' : 'New Category'}</Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Coffee" />

        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconInputRow}>
          <MaterialIcons name={(iconUrl || 'receipt') as any} size={24} color="#4A6CFA" />
          <TextInput style={styles.iconInput} value={iconUrl} onChangeText={setIconUrl} placeholder="local_cafe" autoCapitalize="none" />
        </View>

        <Text style={styles.label}>Monthly Budget Limit</Text>
        <TextInput style={styles.input} value={monthlyBudgetLimit} onChangeText={setMonthlyBudgetLimit} placeholder="500" keyboardType="decimal-pad" />

        <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>

        {categoryId && !category?.isSystemDefault ? (
          <TouchableOpacity style={styles.deleteButton} onPress={remove}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  headerIcon: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },
  form: { padding: 16 },
  label: { fontSize: 13, color: '#555', fontWeight: '700', marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E8F5', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#333' },
  iconInputRow: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E8F5', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconInput: { flex: 1, fontSize: 15, color: '#333' },
  saveButton: { backgroundColor: '#4A6CFA', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  deleteButton: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#FFE0E0' },
  deleteText: { color: '#FF6B6B', fontWeight: '800', fontSize: 15 },
});
