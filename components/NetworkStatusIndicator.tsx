import React from 'react';
import { View, StyleSheet } from 'react-native';
import Typo from '@/components/Typo';
import { useNetwork } from '@/contexts/networkContext';
import { colors } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';

const NetworkStatusIndicator = () => {
  const { isConnected } = useNetwork();

  if (isConnected === true || isConnected === null) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Typo color={colors.white} size={14}>
        You are currently offline
      </Typo>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.rose,
    padding: verticalScale(4),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 1000,
  },
});

export default NetworkStatusIndicator; 