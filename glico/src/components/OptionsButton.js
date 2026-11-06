import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

const colors = {
  background: '#1B1B45',
  optionBackground: '#292966',
  optionBorder: '#3A3A78',
  optionSelectedBackground: '#33339A',
  optionSelectedBorder: '#4DDFD8',
  accent: '#4DDFD8',
  accentDark: '#2FB8B1',
  textPrimary: '#FFFFFF',
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function OptionsButton({ label, index, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.badge, selected && styles.badgeSelected]}>
        <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
          {LETTERS[index] || index + 1}
        </Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.optionBackground,
    borderColor: colors.optionBorder,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  containerSelected: {
    backgroundColor: colors.optionSelectedBackground,
    borderColor: colors.optionSelectedBorder,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeSelected: {
    backgroundColor: colors.accentDark,
  },
  badgeText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  badgeTextSelected: {
    color: colors.textPrimary,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
});