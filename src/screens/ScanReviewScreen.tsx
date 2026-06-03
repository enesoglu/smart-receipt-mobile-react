import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { ScanResult, receiptsApi } from '../services/api';
import { Spinner } from '../components/Spinner';
import { formatCurrency, formatDate } from '../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ScanReview'>;
  route: RouteProp<RootStackParamList, 'ScanReview'>;
};

export default function ScanReviewScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { imageUri } = route.params;
  const [scanResult, setScanResult] = useState<ScanResult | null>(route.params.scanResult ?? null);
  const [loading, setLoading] = useState(!route.params.scanResult);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token || scanResult) return;
    receiptsApi.scan(token, imageUri)
      .then((response) => {
        if (response.success && response.data) setScanResult(response.data);
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [imageUri, scanResult, token]);

  if (loading) return <Spinner caption="Reading your receipt..." />;

  const canContinue = Boolean(scanResult && !failed);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
        <View style={styles.card}>
          {canContinue ? (
            <>
              <Text style={styles.title}>Receipt Found</Text>
              <Text style={styles.row}>Store: {scanResult?.storeName ?? '-'}</Text>
              <Text style={styles.row}>Date: {scanResult?.date ? formatDate(scanResult.date) : '-'}</Text>
              <Text style={styles.row}>Total: {scanResult?.totalAmount ? formatCurrency(scanResult.totalAmount) : '-'}</Text>
              <Text style={styles.row}>Items: {scanResult?.items.length ?? 0}</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>We couldn't read this receipt.</Text>
              <Text style={styles.row}>You can fill it in by hand.</Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={[styles.primaryButton, !canContinue && styles.disabledButton]}
          disabled={!canContinue}
          onPress={() => navigation.replace('AddReceipt', { imageUri, scanResult: scanResult ?? undefined })}
        >
          <Text style={styles.primaryText}>Looks Good - Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.replace('AddReceipt', { imageUri })}>
          <Text style={styles.secondaryText}>Skip & Enter Manually</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  photo: { width: '100%', height: 260, borderRadius: 12, marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 10 },
  row: { fontSize: 14, color: '#555', marginBottom: 8 },
  primaryButton: { backgroundColor: '#4A6CFA', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  disabledButton: { backgroundColor: '#AAB5EE' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E8F5' },
  secondaryText: { color: '#4A6CFA', fontSize: 15, fontWeight: '700' },
});
