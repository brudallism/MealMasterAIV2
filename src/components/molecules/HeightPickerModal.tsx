import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ScrollWheelPicker from '@/components/atoms/ScrollWheelPicker';

interface HeightPickerModalProps {
  visible: boolean;
  selectedHeight: string;
  isMetric: boolean;
  onCancel: () => void;
  onConfirm: (height: string) => void;
}

interface HeightMetric {
  cm: string;
}

interface HeightImperial {
  feet: string;
  inches: string;
}

const HeightPickerModal: React.FC<HeightPickerModalProps> = ({
  visible,
  selectedHeight,
  isMetric,
  onCancel,
  onConfirm,
}) => {
  const getInitialHeight = () => {
    if (isMetric) {
      return { cm: selectedHeight || '175' };
    } else {
      const height = selectedHeight || '5.8';
      const [feet, inches] = height.split('.');
      return {
        feet: feet || '5',
        inches: inches || '8'
      };
    }
  };

  const [tempHeight, setTempHeight] = useState<HeightMetric | HeightImperial>(getInitialHeight());

  // Data arrays
  const cmData = Array.from({ length: 140 }, (_, i) => (i + 120).toString()); // 120-259 cm
  const feetData = ['4', '5', '6', '7', '8']; // 4-8 feet
  const inchesData = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']; // 0-11 inches

  const handleConfirm = () => {
    if (isMetric) {
      const metricHeight = tempHeight as HeightMetric;
      onConfirm(metricHeight.cm);
    } else {
      const imperialHeight = tempHeight as HeightImperial;
      const heightValue = `${imperialHeight.feet}.${imperialHeight.inches}`;
      onConfirm(heightValue);
    }
  };

  const handleCancel = () => {
    setTempHeight(getInitialHeight());
    onCancel();
  };

  const getDisplayHeight = () => {
    if (isMetric) {
      const metricHeight = tempHeight as HeightMetric;
      return `${metricHeight.cm} cm`;
    } else {
      const imperialHeight = tempHeight as HeightImperial;
      return `${imperialHeight.feet} ft ${imperialHeight.inches} in`;
    }
  };

  const updateMetricHeight = (cm: string) => {
    setTempHeight({ cm });
  };

  const updateImperialHeight = (field: 'feet' | 'inches', value: string) => {
    setTempHeight(prev => ({
      ...(prev as HeightImperial),
      [field]: value
    }));
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select Height ({isMetric ? 'cm' : 'ft/in'})
            </Text>
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {isMetric ? (
            // Metric height picker (cm)
            <View style={styles.singlePickerContainer}>
              <ScrollWheelPicker
                data={cmData}
                selectedValue={(tempHeight as HeightMetric).cm}
                onValueChange={updateMetricHeight}
                itemHeight={50}
                visibleItemCount={7}
              />
            </View>
          ) : (
            // Imperial height picker (ft/in)
            <View style={styles.heightPickerContainer}>
              <View style={styles.digitPickerWrapper}>
                <Text style={styles.pickerLabel}>Feet</Text>
                <ScrollWheelPicker
                  data={feetData}
                  selectedValue={(tempHeight as HeightImperial).feet}
                  onValueChange={(value) => updateImperialHeight('feet', value)}
                  itemHeight={50}
                  visibleItemCount={5}
                  infinite={true}
                />
              </View>
              <View style={styles.digitPickerWrapper}>
                <Text style={styles.pickerLabel}>Inches</Text>
                <ScrollWheelPicker
                  data={inchesData}
                  selectedValue={(tempHeight as HeightImperial).inches}
                  onValueChange={(value) => updateImperialHeight('inches', value)}
                  itemHeight={50}
                  visibleItemCount={5}
                  infinite={true}
                />
              </View>
            </View>
          )}

          <View style={styles.heightDisplay}>
            <Text style={styles.heightDisplayText}>
              {getDisplayHeight()}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding for iOS
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  singlePickerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heightPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  digitPickerWrapper: {
    width: 80,
    marginHorizontal: 15,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  heightDisplay: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  heightDisplayText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4F46E5',
  },
});

export default HeightPickerModal;