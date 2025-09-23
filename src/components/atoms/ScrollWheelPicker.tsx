import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface ScrollWheelPickerProps {
  data: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  itemHeight?: number;
  visibleItemCount?: number;
  infinite?: boolean;
}

const ScrollWheelPicker: React.FC<ScrollWheelPickerProps> = ({
  data,
  selectedValue,
  onValueChange,
  itemHeight = 50,
  visibleItemCount = 5,
  infinite = false,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const containerHeight = itemHeight * visibleItemCount;
  const centerOffset = (containerHeight - itemHeight) / 2;

  // Create infinite data by repeating pattern 20 times
  const infiniteData = infinite
    ? Array(20).fill(data).flat()
    : data;

  const getItemLayout = (_: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  });

  const onMomentumScrollEnd = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, infiniteData.length - 1));
    const newValue = infiniteData[clampedIndex];

    // Snap to the nearest item
    flatListRef.current?.scrollToOffset({
      offset: clampedIndex * itemHeight,
      animated: true,
    });

    if (newValue !== selectedValue) {
      onValueChange(newValue);
    }
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = item === selectedValue;
    return (
      <View style={[styles.pickerItem, { height: itemHeight }]}>
        <Text style={[
          styles.pickerItemText,
          isSelected && styles.pickerItemTextSelected
        ]}>
          {item}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    if (flatListRef.current) {
      let selectedIndex;

      if (infinite) {
        // Find the middle occurrence of the selected value
        const patternLength = data.length;
        const middleRepeat = 10; // Middle of 20 repeats
        const valueIndex = data.indexOf(selectedValue);
        selectedIndex = (middleRepeat * patternLength) + valueIndex;
      } else {
        selectedIndex = infiniteData.indexOf(selectedValue);
      }

      if (selectedIndex >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: selectedIndex * itemHeight,
            animated: false,
          });
        }, 100);
      }
    }
  }, [selectedValue, data, itemHeight, infinite]);

  return (
    <View style={[styles.pickerContainer, { height: containerHeight }]}>
      {/* Selection indicator */}
      <View style={[styles.selectionIndicator, {
        top: centerOffset,
        height: itemHeight,
      }]} />

      <FlatList
        ref={flatListRef}
        data={infiniteData}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={onMomentumScrollEnd}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: centerOffset }}
        snapToInterval={itemHeight}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    paddingHorizontal: 5,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 5,
    right: 5,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 8,
    zIndex: 1,
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  pickerItemText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '400',
  },
  pickerItemTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});

export default ScrollWheelPicker;