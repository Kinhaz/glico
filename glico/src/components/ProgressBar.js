import React from 'react';
import { View, StyleSheet } from 'react-native';

const colors = {
  progressTrack: '#2A2A63',
  accent: '#4DDFD8',
};

export default function ProgressBar({ progress }) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${safeProgress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
});