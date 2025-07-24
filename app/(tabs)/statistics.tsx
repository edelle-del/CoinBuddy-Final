import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { BarChart } from "react-native-gifted-charts";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import Loading from "@/components/Loading";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { scale, verticalScale } from "@/utils/styling";
import Header from "@/components/Header";
import * as Icons from "phosphor-react-native";
import { useAuth } from "@/contexts/authContext";
import {
  fetchMonthlyStats,
  fetchWeeklyStats,
  fetchYearlyStats,
} from "@/services/transactionService";
import TransactionList from "@/components/TransactionList";
import XPProgressBar from "@/components/XPProgressBar"; // Import your XP component
import { 
  collection, 
  query, 
  orderBy, 
  getDocs 
} from "firebase/firestore";
import { firestore } from "@/config/firebase"; // adjust path as needed

const barData = [
  {
    value: 40,
    label: "Mon",
    spacing: scale(4),
    labelWidth: scale(30),
    frontColor: colors.primary,
    // topLabelComponent: () => (
    //   <Typo size={10} style={{ marginBottom: 4 }} fontWeight={"bold"}>
    //     50
    //   </Typo>
    // ),
  },
  {
    value: 20,
    frontColor: colors.rose,
  },

  {
    value: 50,
    label: "Tue",
    spacing: scale(4),
    labelWidth: scale(30),
    frontColor: colors.primary,
  },
  { value: 40, frontColor: colors.rose },
  {
    value: 75,
    label: "Wed",
    spacing: scale(4),
    labelWidth: scale(30),
    frontColor: colors.primary,
  },
  { value: 25, frontColor: colors.rose },
  {
    value: 30,
    label: "Thu",
    spacing: scale(4),
    labelWidth: scale(30),
    frontColor: colors.primary,
  },
  { value: 20, frontColor: colors.rose },
  {
    value: 60,
    label: "Fri",
    spacing: scale(4),
    labelWidth: scale(30),
    frontColor: colors.primary,
  },
  { value: 40, frontColor: colors.rose },
  {
    value: 65,
    label: "Sat",
    spacing: scale(4),
    labelWidth: scale(30),
    frontColor: colors.primary,
  },
  { value: 30, frontColor: colors.rose },
  {
    value: 65,
    label: "Sun",
    spacing: scale(4),
    labelWidth: scale(30),
    frontColor: colors.primary,
  },
  { value: 30, frontColor: colors.rose },
  // {
  //   value: 65,
  //   label: "Sun",
  //   spacing: scale(4),
  //   labelWidth: scale(30),
  //   frontColor: colors.primary,
  // },
  // { value: 30, frontColor: colors.rose },
];

// Add this type definition at the top, outside the component
type LeaderboardItem = {
  id: string;
  name: string;
  amount: number;
  xp: number;
  avatar: string | null;
};

const Analytics = () => {
  const [chartLoading, setChartLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const { user } = useAuth();
  const { width: screenWidth } = Dimensions.get("window");
  
  // Added new state variables for leaderboard
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<'savings' | 'xp'>('savings');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  
  useEffect(() => {
    if (activeIndex == 0) {
      getWeeklyStats();
    }
    if (activeIndex == 1) {
      getMonthlyStats();
    }
    if (activeIndex == 2) {
      getYearlyStats();
    }
  }, [activeIndex]);

  // Add useEffect for leaderboard
  useEffect(() => {
    fetchLeaderboardData();
  }, [leaderboardType]);

  const getWeeklyStats = async () => {
    setChartLoading(true);
    let res = await fetchWeeklyStats(user?.uid || "");
    setChartLoading(false);
    if (res.success) {
      setChartData(res.data.stats);
      setTransactions(res.data.transactions);
    } else {
      Alert.alert("Error", res.msg);
    }
  };

  const getMonthlyStats = async () => {
    setChartLoading(true);
    let res = await fetchMonthlyStats(user?.uid as string);
    setChartLoading(false);
    if (res.success) {
      setChartData(res.data.stats);
      setTransactions(res.data.transactions);
    } else {
      Alert.alert("Error", res.msg);
    }
  };

  const getYearlyStats = async () => {
    setChartLoading(true);
    let res = await fetchYearlyStats(user?.uid as string);
    setChartLoading(false);
    if (res.success) {
      setChartData(res.data.stats);
      setTransactions(res.data.transactions);
    } else {
      Alert.alert("Error", res.msg);
    }
  };

  const refreshLeaderboard = () => {
    fetchLeaderboardData(leaderboardType);
  };

  // Add fetchLeaderboardData function
  const fetchLeaderboardData = async (type: 'savings' | 'xp' = 'savings') => {
    try {
      setLeaderboardLoading(true);
    console.log("Fetching leaderboard data for type:", type); // Add logging
    const usersRef = collection(firestore, "users");
    const usersQuery = query(
      usersRef,
      orderBy(type === 'savings' ? 'amount' : 'xp', 'desc')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    const leaderboardData = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Anonymous",
        amount: data.amount || 0,
        xp: data.xp || 0,
        avatar: data.avatar || null
      };
    });
    
    setLeaderboardData(leaderboardData);
    
    // Find user's rank
    const userIndex = leaderboardData.findIndex(item => item.id === user?.uid);
    setUserRank(userIndex !== -1 ? userIndex + 1 : null);
    setTotalUsers(leaderboardData.length);
    
    setLeaderboardLoading(false);
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    setLeaderboardLoading(false);
    Alert.alert("Error", "Failed to fetch leaderboard data");
  }
};

  // Add renderLeaderboardItem function
  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    const isCurrentUser = item.id === user?.uid;
    const displayValue = leaderboardType === 'savings' ? 
      `₱${item.amount.toLocaleString()}` : 
      `${item.xp.toLocaleString()} XP`;
    
    // Determine medal for top 3
    const getMedalIcon = (rank: number) => {
      if (rank === 0) return <Icons.Medal size={verticalScale(16)} color="#FFD700" weight="fill" />;
      if (rank === 1) return <Icons.Medal size={verticalScale(16)} color="#C0C0C0" weight="fill" />;
      if (rank === 2) return <Icons.Medal size={verticalScale(16)} color="#CD7F32" weight="fill" />;
      return null;
    };
    
    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          {index < 3 ? (
            <View style={styles.medalContainer}>
              {getMedalIcon(index)}
            </View>
          ) : (
            <Typo size={14} style={styles.rankText}>{index + 1}</Typo>
          )}
        </View>
        
        <View style={styles.userInfoContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.neutral300, justifyContent: 'center', alignItems: 'center' }]}>
              <Icons.User size={verticalScale(16)} color={colors.neutral600} />
            </View>
          )}
          <Typo size={14} fontWeight={isCurrentUser ? "bold" : "normal"} style={styles.nameText} color={colors.neutral900}>
            {item.name}
          </Typo>
        </View>
        
        <Typo size={14} fontWeight="500" style={styles.amountText}>
          {displayValue}
        </Typo>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* segments */}
        <View style={styles.header}>
          <Header
            title="Statistics"
            // rightIcon={
            //   <TouchableOpacity style={styles.searchIcon}>
            //     <Icons.MagnifyingGlass
            //       size={verticalScale(22)}
            //       color={colors.white}
            //     />
            //   </TouchableOpacity>
            // }
          />
        </View>
        <ScrollView
          contentContainerStyle={{
            gap: spacingY._20,
            paddingTop: spacingY._5,
            paddingBottom: verticalScale(100),
          }}
          showsVerticalScrollIndicator={false}
        >
          <SegmentedControl
            values={["Weekly", "Monthly", "Yearly"]}
            selectedIndex={activeIndex}
            tintColor={colors.neutral350}
            backgroundColor={colors.neutral200}
            appearance="dark"
            activeFontStyle={styles.segmentFontStyle}
            fontStyle={{ ...styles.segmentFontStyle, color: colors.neutral900 }}
            style={styles.segmentStyle}
            onChange={(event) =>
              setActiveIndex(event.nativeEvent.selectedSegmentIndex)
            }
          />

          <View style={styles.chartContainer}>
            {chartData.length > 0 ? (
              <BarChart
                data={chartData}
                barWidth={scale(12)}
                spacing={[1, 2].includes(activeIndex) ? scale(25) : scale(16)}
                // width={screenWidth - spacingX._30}
                roundedTop
                roundedBottom
                hideRules
                yAxisLabelPrefix="₱ "
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisLabelWidth={
                  [1, 2].includes(activeIndex) ? scale(38) : scale(35)
                }
                // hideYAxisText
                yAxisTextStyle={{ color: colors.neutral900 }}
                xAxisLabelTextStyle={{
                  color: colors.neutral900,
                  fontSize: verticalScale(12),
                }}
                noOfSections={3}
                minHeight={5}
                // maxValue={100}
                // animationDuration={500}
                // isAnimated={true}
              />
            ) : (
              <View style={styles.noChart} />
            )}

            {chartLoading && (
              <View style={styles.chartLoadingContainer}>
                <Loading color="white" />
              </View>
            )}
          </View>

          {/* Added Leaderboard Section */}
          <View>
            <Typo size={16} fontWeight="bold" style={styles.sectionTitle} color={colors.neutral900}>
              Leaderboard
            </Typo>
            
            {/* Toggle between Savings and XP leaderboard */}
            <View style={styles.dataTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.dataTypeButton,
                  leaderboardType === 'savings' && styles.activeDataTypeButton,
                ]}
                onPress={() => setLeaderboardType('savings')}
              >
                <Icons.Wallet size={verticalScale(16)} color={colors.neutral900} style={{ marginRight: 6 }} />
                <Typo size={14} fontWeight={leaderboardType === 'savings' ? "bold" : "normal"} color={colors.neutral900}>
                  Savings
                </Typo>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.dataTypeButton,
                  leaderboardType === 'xp' && styles.activeDataTypeButton,
                ]}
                onPress={() => setLeaderboardType('xp')}
              >
                <Icons.Star size={verticalScale(16)} color={colors.neutral900} style={{ marginRight: 6 }} />
                <Typo size={14} fontWeight={leaderboardType === 'xp' ? "bold" : "normal"} color={colors.neutral900}>
                  Experience
                </Typo>
              </TouchableOpacity>
            </View>
            
            {/* User's rank card */}
            {userRank && (
              <View style={styles.userRankCard}>
                <Typo size={14} fontWeight="500">Your Ranking</Typo>
                <View style={styles.userRankContent}>
                  <View style={styles.rankInfoContainer}>
                    <View style={styles.rankIcon}>
                      <Icons.Trophy size={verticalScale(24)} color={colors.primary} weight="fill" />
                    </View>
                    <Typo size={30} fontWeight="bold" color={colors.neutral900}>{userRank}</Typo>
                  </View>
                  <View style={styles.divider} />
                  <View style={{ marginLeft: spacingX._10 }}>
                    <Typo size={14} color={colors.neutral700}>
                      {leaderboardType === 'savings' ? 'Total Saved' : 'Total XP'}
                    </Typo>
                    <Typo size={20} fontWeight="bold" color={colors.neutral900}>
                    {leaderboardType === 'savings' 
                      ? `₱${leaderboardData.find(item => item.id === user?.uid)?.amount?.toLocaleString() || 0}`
                      : `${leaderboardData.find(item => item.id === user?.uid)?.xp?.toLocaleString() || 0} XP`
                    }
                      </Typo>
                  </View>
                </View>
                <Typo size={12} color={colors.neutral600} style={styles.outOfText}>
                  Out of {totalUsers} users
                </Typo>
              </View>
            )}
            
            {/* Leaderboard list */}
            <View style={styles.leaderboardContainer}>
              {leaderboardLoading ? (
                <View style={styles.leaderboardLoadingContainer}>
                  <Loading color={colors.primary} />
                </View>
              ) : leaderboardData.length > 0 ? (
                <FlatList
                  data={leaderboardData}
                  renderItem={renderLeaderboardItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ListHeaderComponent={() => (
                    <View style={styles.leaderboardListHeader}>
                      <View style={styles.rankContainer}>
                        <Typo size={12} color={colors.neutral600}>Rank</Typo>
                      </View>
                      <View style={styles.userInfoContainer}>
                        <Typo size={12} color={colors.neutral600}>User</Typo>
                      </View>
                      <Typo size={12} color={colors.neutral600}>
                        {leaderboardType === 'savings' ? 'Saved' : 'XP'}
                      </Typo>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.emptyLeaderboard}>
                  <Icons.Users size={verticalScale(48)} color={colors.neutral400} />
                  <Typo size={14} color={colors.neutral700} style={{ marginTop: spacingY._10 }}>
                    No leaderboard data available
                  </Typo>
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={refreshLeaderboard}
                  >
                    <Icons.ArrowClockwise size={verticalScale(16)} color={colors.primary} style={{ marginRight: 4 }} />
                    <Typo size={14} color={colors.primary}>Refresh</Typo>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* XP Progress (if viewing XP leaderboard) */}
          {leaderboardType === 'xp' && (
            <View style={{ marginVertical: spacingY._10 }}>
              <XPProgressBar
                savedMoney={leaderboardData.find(item => item.id === user?.uid)?.amount || 0}
                weeklyGoal={700}
                weeklyExpenses={400}
                dailyExpenses={80}
                initialLevel={0}
                showDetails={false}
                userXP={leaderboardData.find(item => item.id === user?.uid)?.xp || 0}
                onPress={() => {/* Toggle XP details if needed */}}
              />
            </View>
          )}

          {/* transactions */}
          <View>
            <TransactionList
              title="Transactions"
              emptyListMessage="No transactions found"
              data={transactions}
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default Analytics;

const styles = StyleSheet.create({
  chartContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  chartLoadingContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: radius._12,
    backgroundColor: "rgba(0,0,0, 0.6)",
  },
  header: {},
  noChart: {
    backgroundColor: "rgba(0,0,0, 0.6)",
    height: verticalScale(210),
  },
  searchIcon: {
    backgroundColor: colors.neutral700,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    height: verticalScale(35),
    width: verticalScale(35),
    borderCurve: "continuous",
  },
  segmentStyle: {
    height: scale(37),
  },
  segmentFontStyle: {
    fontSize: verticalScale(13),
    fontWeight: "bold",
    color: colors.black,
  },
  container: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._7,
    gap: spacingY._10,
  },
  // New styles for leaderboard
  dataTypeSelector: {
    flexDirection: "row",
    backgroundColor: colors.neutral200,
    borderRadius: radius._6,
    padding: scale(4),
  },
  dataTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._7,
    borderRadius: radius._6,
  },
  activeDataTypeButton: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  leaderboardContainer: {
    marginTop: spacingY._7,
  },
  leaderboardLoadingContainer: {
    height: verticalScale(300),
    justifyContent: "center",
    alignItems: "center",
  },
  userRankCard: {
    backgroundColor: colors.white,
    borderRadius: radius._12,
    padding: spacingY._15,
    marginTop: spacingY._5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  userRankContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rankInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankIcon: {
    marginRight: spacingX._12,
  },
  divider: {
    width: 1,
    height: "80%",
    backgroundColor: colors.neutral300,
    marginHorizontal: spacingX._10,
  },
  outOfText: {
    textAlign: "right",
    marginTop: spacingY._5,
  },
  sectionTitle: {
    marginBottom: spacingY._12,
  },
  leaderboardListHeader: {
    flexDirection: "row",
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  currentUserItem: {
    backgroundColor: colors.primary + "15",
  },
  rankContainer: {
    width: scale(30),
    alignItems: "center",
    justifyContent: "center",
  },
  medalContainer: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: colors.neutral600,
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacingX._10,
  },
  avatar: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    marginRight: spacingX._5,
  },
  nameText: {
    flex: 1,
  },
  amountText: {
    color: colors.primary,
  },
  emptyLeaderboard: {
    padding: spacingY._25,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacingY._17,
    paddingVertical: spacingY._7,
  },
});