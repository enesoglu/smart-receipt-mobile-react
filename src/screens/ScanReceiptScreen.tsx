import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Scan'> };

async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export default function ScanReceiptScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const reviewImage = async (uri: string) => {
    const imageUri = await compressImage(uri);
    navigation.navigate('ScanReview', { imageUri });
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      await reviewImage(result.assets[0].uri);
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) await reviewImage(photo.uri);
    } catch {
      Alert.alert('Error', 'Could not capture photo.');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.galleryBtn]} onPress={openGallery}>
          <Ionicons name="images-outline" size={20} color="#4A6CFA" />
          <Text style={styles.galleryBtnText}>Pick from Gallery Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <Text style={styles.scanText}>Scan your receipt</Text>
          <View style={styles.frame} />
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.galleryButton} onPress={openGallery}>
              <Ionicons name="images-outline" size={28} color="#FFF" />
              <Text style={styles.galleryButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={capturePhoto} disabled={capturing}>
              <View style={styles.innerCaptureButton} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryButton} onPress={() => navigation.goBack()}>
              <Ionicons name="close-outline" size={28} color="#FFF" />
              <Text style={styles.galleryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  permissionText: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20, paddingHorizontal: 32 },
  btn: { backgroundColor: '#4A6CFA', padding: 15, borderRadius: 10, marginHorizontal: 40, alignItems: 'center', marginBottom: 12 },
  btnText: { color: 'white', fontWeight: '700' },
  galleryBtn: { backgroundColor: '#fff', flexDirection: 'row', gap: 8 },
  galleryBtnText: { color: '#4A6CFA', fontWeight: '700' },
  camera: { flex: 1, width: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 50 },
  scanText: { color: 'white', fontSize: 20, fontWeight: '700' },
  frame: { width: 260, height: 360, borderWidth: 2, borderColor: 'white', borderRadius: 8 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', paddingHorizontal: 20 },
  galleryButton: { alignItems: 'center', gap: 4 },
  galleryButtonText: { color: '#fff', fontSize: 12 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  innerCaptureButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'white' },
});
