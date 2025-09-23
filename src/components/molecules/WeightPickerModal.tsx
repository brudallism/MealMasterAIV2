import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ScrollWheelPicker from '@/components/atoms/ScrollWheelPicker';

interface WeightPickerModalProps {
  visible: boolean;
  selectedWeight: string;
  isMetric: boolean;
  onCancel: () => void;
  onConfirm: (weight: string) => void;
}

interface WeightDigits {
  hundreds: string;
  tens: string;
  ones: string;
}

const WeightPickerModal: React.FC<WeightPickerModalProps> = ({
  visible,
  selectedWeight,
  isMetric,
  onCancel,
  onConfirm,
}) => {
  const defaultWeight = isMetric ? '70' : '150';
  const weight = selectedWeight || defaultWeight;
  const paddedWeight = weight.padStart(3, '0');

  const [tempWeight, setTempWeight] = useState<WeightDigits>({
    hundreds: paddedWeight[0] || '0',
    tens: paddedWeight[1] || '0',
    ones: paddedWeight[2] || '0'
  });

  const digitData = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const handleConfirm = () => {
    const weightValue = `${tempWeight.hundreds}${tempWeight.tens}${tempWeight.ones}`;
    const finalWeight = parseInt(weightValue).toString(); // Remove leading zeros
    onConfirm(finalWeight);
  };

  const handleCancel = () => {
    const resetWeight = weight.padStart(3, '0');
    setTempWeight({
      hundreds: resetWeight[0] || '0',
      tens: resetWeight[1] || '0',
      ones: resetWeight[2] || '0'
    });
    onCancel();
  };

  const getDisplayWeight = () => {
    const weightValue = `${tempWeight.hundreds}${tempWeight.tens}${tempWeight.ones}`;
    const numericWeight = parseInt(weightValue);
    return `${numericWeight} ${isMetric ? 'kg' : 'lbs'}`;
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
              Select Weight ({isMetric ? 'kg' : 'lbs'})
            </Text>
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weightPickerContainer}>
            <View style={styles.digitPickerWrapper}>
              <ScrollWheelPicker
                data={digitData}
                selectedValue={tempWeight.hundreds}
                onValueChange={(value) => setTempWeight(prev => ({ ...prev, hundreds: value }))}
                itemHeight={50}
                visibleItemCount={5}
                infinite={true}
              />
            </View>
            <View style={styles.digitPickerWrapper}>
              <ScrollWheelPicker
                data={digitData}
                selectedValue={tempWeight.tens}
                onValueChange={(value) => setTempWeight(prev => ({ ...prev, tens: value }))}
                itemHeight={50}
                visibleItemCount={5}
                infinite={true}
              />
            </View>
            <View style={styles.digitPickerWrapper}>
              <ScrollWheelPicker
                data={digitData}
                selectedValue={tempWeight.ones}
                onValueChange={(value) => setTempWeight(prev => ({ ...prev, ones: value }))}
                itemHeight={50}
                visibleItemCount={5}
                infinite={true}
              />
            </View>
          </View>

          <View style={styles.weightDisplay}>
            <Text style={styles.weightDisplayText}>
              {getDisplayWeight()}
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
  weightPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  digitPickerWrapper: {
    width: 80,
    marginHorizontal: 5,
  },
  weightDisplay: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  weightDisplayText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4F46E5',
  },
});

export default WeightPickerModal;