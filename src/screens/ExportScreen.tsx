import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatDate } from '../utils/format';

type ExportKind = 'csv' | 'xlsx' | 'pdf';

export default function ExportScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [start, setStart] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const [end, setEnd] = useState(new Date());
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const [exporting, setExporting] = useState<ExportKind | null>(null);

  const exportReport = async (kind: ExportKind) => {
    if (!token) return;
    setExporting(kind);
    try {
      const result = kind === 'csv'
        ? await reportsApi.downloadCsv(token, start, end)
        : kind === 'xlsx'
          ? await reportsApi.downloadXlsx(token, start, end)
          : await reportsApi.downloadPdf(token, start, end);
      await Sharing.shareAsync(result.filePath);
    } catch {
      Alert.alert('Error', 'Could not export. Try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Export Data</Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Start</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setPicker('start')}>
          <Text style={styles.dateText}>{formatDate(start)}</Text>
          <Ionicons name="calendar-outline" size={18} color="#4A6CFA" />
        </TouchableOpacity>

        <Text style={styles.label}>End</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setPicker('end')}>
          <Text style={styles.dateText}>{formatDate(end)}</Text>
          <Ionicons name="calendar-outline" size={18} color="#4A6CFA" />
        </TouchableOpacity>

        {picker ? (
          <DateTimePicker
            value={picker === 'start' ? start : end}
            mode="date"
            onChange={(_, selected) => {
              if (selected) picker === 'start' ? setStart(selected) : setEnd(selected);
              setPicker(null);
            }}
          />
        ) : null}

        {([
          ['csv', 'Export as CSV'],
          ['xlsx', 'Export as Excel'],
          ['pdf', 'Export as PDF'],
        ] as [ExportKind, string][]).map(([kind, label]) => (
          <TouchableOpacity key={kind} style={styles.exportButton} onPress={() => exportReport(kind)} disabled={Boolean(exporting)}>
            {exporting === kind ? <ActivityIndicator color="#FFF" /> : <Text style={styles.exportText}>{label}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  headerIcon: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#333' },
  content: { padding: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 14 },
  dateButton: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E8F5' },
  dateText: { color: '#333', fontWeight: '700' },
  exportButton: { backgroundColor: '#4A6CFA', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  exportText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
