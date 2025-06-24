import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { colors, spacingX, spacingY } from "@/constants/theme";
import Typo from "./Typo";
import * as Icons from "phosphor-react-native";
import { verticalScale } from "@/utils/styling";

const XPProgressBar = ({ 
  savedMoney = 0,
  weeklyGoal = 100, 
  weeklyExpenses = 0,
  dailyExpenses = 0,
  userXP = 0, // XP from external sources (achievements, etc.)
  initialLevel = 0,
  onPress,
  showDetails = false,
  getRequiredXP = (level, baseXP = 50) => Math.floor(baseXP * Math.pow(Math.max(level, 1), 1.5))
}) => {
  const [level, setLevel] = useState(initialLevel);
  const [currentXP, setCurrentXP] = useState(0);
  const [requiredXP, setRequiredXP] = useState(getRequiredXP(Math.max(initialLevel, 1)));
  const [progress, setProgress] = useState(0);
  const [animation] = useState(new Animated.Value(0));
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [achievementUnlocked, setAchievementUnlocked] = useState(false);
  const [totalXP, setTotalXP] = useState(0);

  // Calculate daily goal based on weekly goal
  useEffect(() => {
    const calculatedDailyGoal = Math.round(weeklyGoal / 7);
    setDailyGoal(calculatedDailyGoal);
  }, [weeklyGoal]);

  // Main XP calculation and level determination
  useEffect(() => {
    // Check if this is truly a new account with no activity
    const hasAnyActivity = savedMoney > 0 || weeklyExpenses > 0 || dailyExpenses > 0 || userXP > 0;
    
    if (!hasAnyActivity) {
      // Completely new account - start at level 0 with 0 XP
      setLevel(0);
      setCurrentXP(0);
      setRequiredXP(getRequiredXP(1));
      setProgress(0);
      setWeeklyProgress(0);
      setDailyProgress(0);
      setTotalXP(0);
      
      Animated.timing(animation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false
      }).start();
      
      return;
    }

    // Calculate progress percentages
    const weekProgress = weeklyGoal > 0 ? Math.min(1, Math.max(0, (weeklyGoal - weeklyExpenses) / weeklyGoal)) : 0;
    const dayProgress = dailyGoal > 0 ? Math.min(1, Math.max(0, (dailyGoal - dailyExpenses) / dailyGoal)) : 0;
    
    setWeeklyProgress(weekProgress);
    setDailyProgress(dayProgress);

    // XP calculation from activities
    const savingXP = Math.floor(savedMoney * 0.2);
    const weeklyBonus = (weeklyExpenses > 0 && weekProgress >= 0.8) ? 50 : 
                      (weeklyExpenses > 0 && weekProgress >= 0.5) ? 20 : 0;
    const dailyBonus = (dailyExpenses > 0 && dayProgress >= 0.9) ? 15 : 
                      (dailyExpenses > 0 && dayProgress >= 0.7) ? 8 : 0;
    
    // Combine activity XP with external XP (from achievements)
    const activityXP = savingXP + weeklyBonus + dailyBonus;
    const calculatedTotalXP = activityXP + userXP;
    
    setTotalXP(calculatedTotalXP);
    
    // Handle accounts with minimal XP (should still be level 0 or 1)
    if (calculatedTotalXP === 0) {
      setLevel(0);
      setCurrentXP(0);
      setRequiredXP(getRequiredXP(1));
      setProgress(0);
      
      Animated.timing(animation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false
      }).start();
      
      return;
    }

    // Calculate level and XP for current level
    let currentLevel = 1;
    let accumulatedXP = 0;
    let xpForNextLevel = getRequiredXP(currentLevel);
    
    // Find the correct level
    while (calculatedTotalXP >= accumulatedXP + xpForNextLevel) {
      accumulatedXP += xpForNextLevel;
      currentLevel++;
      xpForNextLevel = getRequiredXP(currentLevel);
    }
    
    const xpInCurrentLevel = calculatedTotalXP - accumulatedXP;
    const progressValue = xpForNextLevel > 0 ? xpInCurrentLevel / xpForNextLevel : 0;
    
    // Check for level up
    if (currentLevel > level && level > 0) {
      setAchievementUnlocked(true);
      setTimeout(() => setAchievementUnlocked(false), 5000);
    }
    
    setLevel(currentLevel);
    setCurrentXP(xpInCurrentLevel);
    setRequiredXP(xpForNextLevel);
    setProgress(progressValue);
    
    // Animate progress bar
    Animated.timing(animation, {
      toValue: progressValue,
      duration: 1000,
      useNativeDriver: false
    }).start();
  }, [savedMoney, weeklyGoal, weeklyExpenses, dailyGoal, dailyExpenses, userXP, level, getRequiredXP]);

  const width = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  });

  const getProgressColor = (progress) => {
    if (progress >= 0.8) return colors.green;
    if (progress >= 0.5) return "#FFC107"; // Amber
    return "#2196F3"; // Blue
  };

  const getProgressMessage = (progress, type) => {
    const xpBonus = type === 'daily' 
      ? (progress >= 0.9 ? 15 : progress >= 0.7 ? 8 : 0)
      : (progress >= 0.8 ? 50 : progress >= 0.5 ? 20 : 0);
    
    if (xpBonus > 0) {
      return `Great! (+${xpBonus} XP)`;
    }
    return 'Keep Going!';
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {achievementUnlocked && (
        <View style={styles.achievementBadge}>
          <Icons.Trophy 
            size={verticalScale(16)} 
            color={colors.white} 
            weight="fill" 
          />
          <Typo color={colors.white} size={10} fontWeight="bold">
            LEVEL UP!
          </Typo>
        </View>
      )}
      
      <View style={styles.levelBadge}>
        <Icons.Star 
          size={verticalScale(16)} 
          color={colors.white} 
          weight="fill" 
        />
        <Typo color={colors.white} size={12} fontWeight="bold">
          {level}
        </Typo>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Typo size={14} fontWeight="500" color={colors.neutral900}>
            {level === 0 ? "Start Your Journey" : `LVL ${level}`}
          </Typo>
          <Typo size={14} fontWeight="500" color={colors.neutral900}>
            {currentXP}/{requiredXP} XP
          </Typo>
        </View>
        
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { width }
            ]} 
          />
        </View>
        
        {showDetails && (
          <>
            <View style={styles.progressFooter}>
              <Typo size={12} color={colors.neutral700}>
                {level === 0 ? "Earn XP to reach Level 1" : `Next level in ${requiredXP - currentXP} XP`}
              </Typo>
              <Typo size={12} color={colors.neutral700} fontWeight="500">
                {Math.round(progress * 100)}%
              </Typo>
            </View>
            
            {/* Daily Goal Section */}
            {dailyGoal > 0 && (
              <View style={styles.goalContainer}>
                <View style={styles.goalHeader}>
                  <Typo size={12} fontWeight="500" color={colors.neutral700}>
                    Daily Saving Goal
                  </Typo>
                  <Typo size={12} color={colors.neutral600}>
                    {Math.round(dailyProgress * 100)}% Complete
                  </Typo>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.dailyProgressBar, 
                      { 
                        width: `${dailyProgress * 100}%`,
                        backgroundColor: getProgressColor(dailyProgress)
                      }
                    ]} 
                  />
                </View>
                
                <View style={styles.progressFooter}>
                  <Typo size={12} color={colors.neutral700}>
                    ₱{dailyExpenses} spent of ₱{dailyGoal} goal
                  </Typo>
                  <Typo 
                    size={12} 
                    color={dailyProgress >= 0.7 ? getProgressColor(dailyProgress) : colors.neutral700} 
                    fontWeight="500"
                  >
                    {getProgressMessage(dailyProgress, 'daily')}
                  </Typo>
                </View>
              </View>
            )}
            
            {/* Weekly Goal Section */}
            {weeklyGoal > 0 && (
              <View style={styles.goalContainer}>
                <View style={styles.goalHeader}>
                  <Typo size={12} fontWeight="500" color={colors.neutral700}>
                    Weekly Saving Goal
                  </Typo>
                  <Typo size={12} color={colors.neutral600}>
                    {Math.round(weeklyProgress * 100)}% Complete
                  </Typo>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.weeklyProgressBar, 
                      { 
                        width: `${weeklyProgress * 100}%`,
                        backgroundColor: getProgressColor(weeklyProgress)
                      }
                    ]} 
                  />
                </View>
                
                <View style={styles.progressFooter}>
                  <Typo size={12} color={colors.neutral700}>
                    ₱{weeklyExpenses} spent of ₱{weeklyGoal} goal
                  </Typo>
                  <Typo 
                    size={12} 
                    color={weeklyProgress >= 0.5 ? getProgressColor(weeklyProgress) : colors.neutral700} 
                    fontWeight="500"
                  >
                    {getProgressMessage(weeklyProgress, 'weekly')}
                  </Typo>
                </View>
              </View>
            )}
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Icons.Wallet size={verticalScale(16)} color={colors.green} weight="fill" />
                <Typo size={12} color={colors.neutral700}>
                  ₱{savedMoney} Saved
                </Typo>
              </View>
              <View style={styles.statItem}>
                <Icons.ChartLineUp size={verticalScale(16)} color={colors.green} weight="fill" />
                <Typo size={12} color={colors.neutral700}>
                  {totalXP} Total XP
                </Typo>
              </View>
              {userXP > 0 && (
                <View style={styles.statItem}>
                  <Icons.Trophy size={verticalScale(16)} color="#FFC107" weight="fill" />
                  <Typo size={12} color={colors.neutral700}>
                    {userXP} Achievement XP
                  </Typo>
                </View>
              )}
            </View>
          </>
        )}
        
        {!showDetails && (
          <View style={styles.hintContainer}>
            <Icons.Info size={verticalScale(12)} color={colors.neutral600} />
            <Typo size={10} color={colors.neutral600}>
              Tap to view details
            </Typo>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacingX._15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: spacingY._10,
    position: "relative",
  },
  levelBadge: {
    backgroundColor: "#00723F",
    width: verticalScale(35),
    height: verticalScale(35),
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacingX._10,
    flexDirection: "row",
    gap: 2,
  },
  progressContainer: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.neutral200,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#00723F",
    borderRadius: 4,
  },
  weeklyProgressBar: {
    height: "100%",
    borderRadius: 4,
  },
  dailyProgressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  goalContainer: {
    marginTop: spacingY._10,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacingY._10,
    flexWrap: "wrap",
    gap: spacingX._10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 2,
  },
  achievementBadge: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: "#FFC107",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 1,
  }
});

export default XPProgressBar;