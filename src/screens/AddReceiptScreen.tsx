import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { Category, ReceiptItem, categoriesApi, receiptsApi } from '../services/api';
import { Spinner } from '../components/Spinner';
import { formatCurrency, formatDate } from '../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddReceipt'>;
  route: RouteProp<RootStackParamList, 'AddReceipt'>;
};

type ItemForm = {
  itemName: string;
  price: string;
  quantity: string;
  unitPrice: string;
  barcode?: string | null;
  unit?: string | null;
};

function itemToForm(item: ReceiptItem): ItemForm {
  return {
    itemName: item.itemName,
    price: String(item.price || ''),
    quantity: String(item.quantity || 1),
    unitPrice: String(item.unitPrice || item.price || ''),
    barcode: item.barcode,
    unit: item.unit,
  };
}

function emptyItem(): ItemForm {
  return { itemName: '', price: '', quantity: '1', unitPrice: '' };
}

export default function AddReceiptScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const params = route.params;
  const receiptId = params?.receiptId;
  const [imageUri, setImageUri] = useState(params?.imageUri);
  const [storeName, setStoreName] = useState(params?.scanResult?.storeName ?? '');
  const [date, setDate] = useState(params?.scanResult?.date ? new Date(params.scanResult.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalAmount, setTotalAmount] = useState(params?.scanResult?.totalAmount ? String(params.scanResult.totalAmount) : '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ItemForm[]>(params?.scanResult?.items?.length ? params.scanResult.items.map(itemToForm) : [emptyItem()]);
  const [loading, setLoading] = useState(Boolean(receiptId));
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(receiptId);

  useEffect(() => {
    if (!token) return;
    categoriesApi.list(token).then((response) => {
      if (response.success && response.data) setCategories(response.data);
    }).catch(() => undefined);
  }, [token]);

  useEffect(() => {
    if (!token || !receiptId) return;
    receiptsApi.get(token, receiptId)
      .then((response) => {
        if (!response.success || !response.data) return;
        const receipt = response.data;
        setStoreName(receipt.storeName);
        setDate(new Date(receipt.date));
        setTotalAmount(String(receipt.totalAmount));
        setSelectedCategoryId(receipt.categoryId ?? null);
        setItems(receipt.items.length ? receipt.items.map(itemToForm) : [emptyItem()]);
      })
      .catch(() => Alert.alert('Error', 'Could not load receipt.'))
      .finally(() => setLoading(false));
  }, [receiptId, token]);

  const validItems = useMemo<ReceiptItem[]>(() => items
    .filter((item) => item.itemName.trim() && Number(item.price) > 0)
    .map((item) => ({
      itemName: item.itemName.trim(),
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || Number(item.price),
      barcode: item.barcode ?? null,
      unit: item.unit ?? null,
    })), [items]);

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) setImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!token) return;
    if (!storeName.trim()) { Alert.alert('Error', 'Store name is required.'); return; }
    if (!Number(totalAmount) || Number(totalAmount) <= 0) { Alert.alert('Error', 'Enter a valid total amount.'); return; }
    if (Number.isNaN(date.getTime())) { Alert.alert('Error', 'Pick a valid date.'); return; }

    setSaving(true);
    try {
      const payload = {
        storeName: storeName.trim(),
        date: date.toISOString(),
        totalAmount: Number(totalAmount),
        categoryId: selectedCategoryId,
        items: validItems,
      };

      const response = isEditing && receiptId
        ? await receiptsApi.update(token, receiptId, payload)
        : await receiptsApi.create(token, payload);

      if (!response.success || !response.data) {
        Alert.alert('Error', response.message ?? 'Could not save receipt.');
        return;
      }

      if (imageUri) {
        try {
          await receiptsApi.uploadPhoto(token, response.data.id, imageUri);
        } catch {
          Alert.alert('Warning', 'Receipt saved, but photo upload failed.');
        }
      }

      navigation.replace('ReceiptDetail', { receiptId: response.data.id });
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Receipt' : 'Add Receipt'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerIcon}>
            {saving ? <ActivityIndicator size="small" color="#4A6CFA" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" /> : null}
          <TouchableOpacity style={styles.pickImageBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={18} color="#4A6CFA" />
            <Text style={styles.pickImageText}>{imageUri ? 'Change Photo' : 'Pick Photo'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Store Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Migros" value={storeName} onChangeText={setStoreName} />

          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity style={styles.inputButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.inputButtonText}>{formatDate(date)}</Text>
            <Ionicons name="calendar-outline" size={18} color="#4A6CFA" />
          </TouchableOpacity>
          {showDatePicker ? (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) setDate(selected);
              }}
            />
          ) : null}

          <Text style={styles.label}>Total Amount ({formatCurrency(0).slice(0, 1)}) *</Text>
          <TextInput style={styles.input} placeholder="0.00" value={totalAmount} onChangeText={setTotalAmount} keyboardType="decimal-pad" />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryChip, selectedCategoryId === category.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)}
              >
                <Text style={[styles.categoryChipText, selectedCategoryId === category.id && styles.categoryChipTextActive]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.itemsHeader}>
            <Text style={styles.label}>Items</Text>
            <TouchableOpacity onPress={() => setItems((current) => [...current, emptyItem()])} style={styles.addItemBtn}>
              <Ionicons name="add-circle-outline" size={20} color="#4A6CFA" />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={`${index}-${item.itemName}`} style={styles.itemRow}>
              <TextInput style={[styles.input, styles.itemNameInput]} placeholder="Item name" value={item.itemName} onChangeText={(value) => updateItem(index, 'itemName', value)} />
              <TextInput style={[styles.input, styles.itemPriceInput]} placeholder="0.00" value={item.price} onChangeText={(value) => updateItem(index, 'price', value)} keyboardType="decimal-pad" />
              {items.length > 1 ? (
                <TouchableOpacity onPress={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={styles.removeItemBtn}>
                  <Ionicons name="close-circle" size={22} color="#FF6B6B" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          <TouchableOpacity style={styles.saveButtonFull} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Receipt</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerIcon: { minWidth: 44, minHeight: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  saveText: { fontSize: 16, fontWeight: '700', color: '#4A6CFA' },
  content: { padding: 16, paddingBottom: 40 },
  imagePreview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10 },
  pickImageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E8F5' },
  pickImageText: { color: '#4A6CFA', fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#E8E8E8' },
  inputButton: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E8E8E8', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputButtonText: { fontSize: 15, color: '#333' },
  categoryRow: { marginBottom: 4 },
  categoryChip: { borderWidth: 1, borderColor: '#DDD', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff' },
  categoryChipActive: { backgroundColor: '#4A6CFA', borderColor: '#4A6CFA' },
  categoryChipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addItemText: { fontSize: 13, color: '#4A6CFA', fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  itemNameInput: { flex: 2 },
  itemPriceInput: { flex: 1 },
  removeItemBtn: { padding: 2 },
  saveButtonFull: { backgroundColor: '#4A6CFA', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
