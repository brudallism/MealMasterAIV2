import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AgePickerModal from './AgePickerModal';
import WeightPickerModal from './WeightPickerModal';
import HeightPickerModal from './HeightPickerModal';

interface ProfileData {
  age: string;
  weight: string;
  height: string;
}

interface CompactProfileInputsProps {
  profileData: ProfileData;
  isMetric: boolean;
  onProfileChange: (field: keyof ProfileData, value: string) => void;
}

const CompactProfileInputs: React.FC<CompactProfileInputsProps> = ({
  profileData,
  isMetric,
  onProfileChange,
}) => {
  const [agePickerVisible, setAgePickerVisible] = useState(false);
  const [weightPickerVisible, setWeightPickerVisible] = useState(false);
  const [heightPickerVisible, setHeightPickerVisible] = useState(false);

  const formatHeightDisplay = (height: string, metric: boolean) => {
    if (!height) return metric ? '175 cm' : '5 ft 8 in';

    if (metric) {
      return `${height} cm`;
    } else {
      const [feet, inches] = height.split('.');
      return `${feet || '5'} ft ${inches || '8'} in`;
    }
  };

  const getDisplayValue = (field: keyof ProfileData, value: string) => {
    if (!value) {
      switch (field) {
        case 'age':
          return '25';
        case 'weight':
          return isMetric ? '70' : '150';
        case 'height':
          return isMetric ? '175' : '5.8';
        default:
          return '';
      }
    }
    return value;
  };

  return (
    <View>
      <View style={styles.compactInputRow}>
        <View style={styles.compactInputContainer}>
          <Text style={styles.compactLabel}>Age</Text>
          <TouchableOpacity
            style={styles.compactTextInput}
            onPress={() => setAgePickerVisible(true)}
          >
            <Text style={[styles.inputText, !profileData.age && styles.placeholderText]}>
              {getDisplayValue('age', profileData.age)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.compactInputContainer}>
          <Text style={styles.compactLabel}>Weight ({isMetric ? 'kg' : 'lbs'})</Text>
          <TouchableOpacity
            style={styles.compactTextInput}
            onPress={() => setWeightPickerVisible(true)}
          >
            <Text style={[styles.inputText, !profileData.weight && styles.placeholderText]}>
              {getDisplayValue('weight', profileData.weight)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.compactInputContainer}>
          <Text style={styles.compactLabel}>Height ({isMetric ? 'cm' : 'ft/in'})</Text>
          <TouchableOpacity
            style={styles.compactTextInput}
            onPress={() => setHeightPickerVisible(true)}
          >
            <Text style={[styles.inputText, !profileData.height && styles.placeholderText]}>
              {formatHeightDisplay(profileData.height, isMetric)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Age Picker Modal */}
      <AgePickerModal
        visible={agePickerVisible}
        selectedAge={getDisplayValue('age', profileData.age)}
        onCancel={() => setAgePickerVisible(false)}
        onConfirm={(age) => {
          onProfileChange('age', age);
          setAgePickerVisible(false);
        }}
      />

      {/* Weight Picker Modal */}
      <WeightPickerModal
        visible={weightPickerVisible}
        selectedWeight={getDisplayValue('weight', profileData.weight)}
        isMetric={isMetric}
        onCancel={() => setWeightPickerVisible(false)}
        onConfirm={(weight) => {
          onProfileChange('weight', weight);
          setWeightPickerVisible(false);
        }}
      />

      {/* Height Picker Modal */}
      <HeightPickerModal
        visible={heightPickerVisible}
        selectedHeight={getDisplayValue('height', profileData.height)}
        isMetric={isMetric}
        onCancel={() => setHeightPickerVisible(false)}
        onConfirm={(height) => {
          onProfileChange('height', height);
          setHeightPickerVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  compactInputRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  compactInputContainer: {
    flex: 1,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  compactTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
});

export default CompactProfileInputs;