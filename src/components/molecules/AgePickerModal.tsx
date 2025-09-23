import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ScrollWheelPicker from '@/components/atoms/ScrollWheelPicker';

interface AgePickerModalProps {
  visible: boolean;
  selectedAge: string;
  onCancel: () => void;
  onConfirm: (age: string) => void;
}

const AgePickerModal: React.FC<AgePickerModalProps> = ({
  visible,
  selectedAge,
  onCancel,
  onConfirm,
}) => {
  const [tempAge, setTempAge] = useState(selectedAge || '25');

  const ageData = Array.from({ length: 90 }, (_, i) => (i + 10).toString()); // 10-99

  const handleConfirm = () => {
    onConfirm(tempAge);
  };

  const handleCancel = () => {
    setTempAge(selectedAge || '25');
    onCancel();
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
            <Text style={styles.modalTitle}>Select Age</Text>
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerContainer}>
            <ScrollWheelPicker
              data={ageData}
              selectedValue={tempAge}
              onValueChange={setTempAge}
              itemHeight={50}
              visibleItemCount={7}
            />
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
  pickerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});

export default AgePickerModal;