import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';

export default function ScanReceiptScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <View style={styles.overlay}>
           <Text style={styles.scanText}>Scan your receipt</Text>
           <View style={styles.frame} />
           <TouchableOpacity style={styles.captureButton} onPress={() => console.log('Captured!')}>
             <View style={styles.innerCaptureButton} />
           </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  btn: {
     backgroundColor: '#4A6CFA',
     padding: 15,
     borderRadius: 10,
     marginHorizontal: 40,
     alignItems: 'center'
  },
  btnText: {
     color: 'white',
     fontWeight: 'bold'
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  scanText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  frame: {
    width: 250,
    height: 350,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent'
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCaptureButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  }
});
