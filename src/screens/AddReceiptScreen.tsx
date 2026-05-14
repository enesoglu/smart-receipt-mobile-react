import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { receiptsApi, categoriesApi, Category, CreateReceiptItem } from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddReceipt'>;
  route: RouteProp<RootStackParamList, 'AddReceipt'>;
};

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AddReceiptScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const imageUri = route.params?.imageUri;

  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(todayString());
  const [totalAmount, setTotalAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<{ name: string; price: string }[]>([{ name: '', price: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    categoriesApi.getAll(token).then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, [token]);

  const addItem = () => setItems((prev) => [...prev, { name: '', price: '' }]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, field: 'name' | 'price', value: string) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const handleSave = async () => {
    if (!token) return;
    if (!storeName.trim()) { Alert.alert('Error', 'Store name is required'); return; }
    if (!totalAmount || isNaN(parseFloat(totalAmount))) { Alert.alert('Error', 'Valid total amount is required'); return; }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Error', 'Date must be in YYYY-MM-DD format'); return; }

    const validItems: CreateReceiptItem[] = items
      .filter((i) => i.name.trim() && i.price.trim())
      .map((i) => ({
        productName: i.name.trim(),
        price: parseFloat(i.price),
        quantity: 1,
        unitPrice: parseFloat(i.price),
      }));

    setSaving(true);
    try {
      const res = await receiptsApi.create(token, {
        storeName: storeName.trim(),
        date: `${date}T00:00:00`,
        totalAmount: parseFloat(totalAmount),
        categoryId: selectedCategoryId,
        items: validItems,
      });

      if (res.success) {
        Alert.alert('Success', 'Receipt saved!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Could not save receipt');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Receipt</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? <ActivityIndicator size="small" color="#4A6CFA" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Image preview */}
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          ) : null}

          {/* Store name */}
          <Text style={styles.label}>Store Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Migros"
            value={storeName}
            onChangeText={setStoreName}
          />

          {/* Date */}
          <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-04-26"
            value={date}
            onChangeText={setDate}
            keyboardType="numeric"
          />

          {/* Total Amount */}
          <Text style={styles.label}>Total Amount (₺) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="decimal-pad"
          />

          {/* Category */}
          {categories.length > 0 && (
            <>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipActive]}
                    onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? undefined : cat.id)}
                  >
                    <Text style={[styles.categoryChipText, selectedCategoryId === cat.id && styles.categoryChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Items */}
          <View style={styles.itemsHeader}>
            <Text style={styles.label}>Items</Text>
            <TouchableOpacity onPress={addItem} style={styles.addItemBtn}>
              <Ionicons name="add-circle-outline" size={20} color="#4A6CFA" />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <TextInput
                style={[styles.input, styles.itemNameInput]}
                placeholder="Product name"
                value={item.name}
                onChangeText={(v) => updateItem(index, 'name', v)}
              />
              <TextInput
                style={[styles.input, styles.itemPriceInput]}
                placeholder="₺0.00"
                value={item.price}
                onChangeText={(v) => updateItem(index, 'price', v)}
                keyboardType="decimal-pad"
              />
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeItemBtn}>
                  <Ionicons name="close-circle" size={22} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.saveButtonFull} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Receipt</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  saveBtn: { padding: 4 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#4A6CFA' },
  content: { padding: 16, paddingBottom: 40 },
  imagePreview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: '#333',
    borderWidth: 1, borderColor: '#e8e8e8',
  },
  categoryRow: { marginBottom: 4 },
  categoryChip: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, backgroundColor: '#fff',
  },
  categoryChipActive: { backgroundColor: '#4A6CFA', borderColor: '#4A6CFA' },
  categoryChipText: { fontSize: 13, color: '#555' },
  categoryChipTextActive: { color: '#fff', fontWeight: '600' },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addItemText: { fontSize: 13, color: '#4A6CFA', fontWeight: '500' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  itemNameInput: { flex: 2, marginTop: 0 },
  itemPriceInput: { flex: 1, marginTop: 0 },
  removeItemBtn: { padding: 2 },
  saveButtonFull: {
    backgroundColor: '#4A6CFA', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 28,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
