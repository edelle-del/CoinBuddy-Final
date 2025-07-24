import { View, Text, ViewStyle, SafeAreaView, Platform } from "react-native";
import React from "react";
import { ScreenWrapperProps } from "@/types";
import { colors } from "@/constants/theme";
import NetworkStatusIndicator from "./NetworkStatusIndicator";

const ScreenWrapper = ({ style, children, bg }: ScreenWrapperProps) => {
  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: bg || colors.white,
          paddingTop: Platform.OS == "android" ? 30 : 0,
        },
        style,
      ]}
    >
      {children}
      <NetworkStatusIndicator />
    </SafeAreaView>
  );
};

export default ScreenWrapper;
