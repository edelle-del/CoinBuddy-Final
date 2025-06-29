import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Modal,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import * as Icons from "phosphor-react-native";
import { verticalScale } from "@/utils/styling";
import HomeCard from "@/components/HomeCard";
import Button from "@/components/Button";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { useAuth } from "@/contexts/authContext";
import { useRouter } from "expo-router";
import TransactionList from "@/components/TransactionList";
import { limit, orderBy, where } from "firebase/firestore";
import useFetchData from "@/hooks/useFetchData";
import { TransactionType } from "@/types";
import XPProgressBar from "@/components/XPProgressBar";
import * as FileSystem from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
const CoinBuddyLogo = require("@/assets/images/CoinBuddyLogo.png");
import { Timestamp } from "firebase/firestore";

// Updated Achievement interface
interface Achievement {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  claimable: boolean;
  xpPoints: number;
  icon: keyof typeof Icons;
}

const Home = () => {
  const { user, refreshKey } = useAuth();
  const router = useRouter();
  const [savedMoney, setSavedMoney] = useState(240);
  const [weeklyGoal, setWeeklyGoal] = useState(500);
  const [weeklyExpenses, setWeeklyExpenses] = useState(260);
  const [showXPDetails, setShowXPDetails] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All"); // All, Income, Expense
  const xpPerPeso = 1;
  const [userXP, setUserXP] = useState(0);

  // Common expense categories - you can customize these based on your app
  const expenseCategories = [
    "All",
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Education",
    "Travel",
    "Other"
  ];

  const transactionTypes = ["All", "Income", "Expense"];

  // Mock achievements with new properties
  const [achievements, setAchievements] = useState<Achievement[]>([
    { 
      id: 1, 
      title: "Money Saver", 
      description: "Save your first ₱100", 
      completed: true, 
      claimable: true, 
      xpPoints: 50,
      icon: "Wallet" 
    },
    { 
      id: 2, 
      title: "Budget Master", 
      description: "Stay under budget for 3 weeks", 
      completed: true, 
      claimable: true, 
      xpPoints: 100,
      icon: "ChartBar" 
    },
    { 
      id: 3, 
      title: "Level 5 Reached", 
      description: "Reach level 5 in your saving journey", 
      completed: false, 
      claimable: false, 
      xpPoints: 150,
      icon: "Star" 
    },
    { 
      id: 4, 
      title: "Track Star", 
      description: "Log transactions for 7 consecutive days", 
      completed: true, 
      claimable: true, 
      xpPoints: 75,
      icon: "CheckCircle" 
    },
    { 
      id: 5, 
      title: "Big Saver", 
      description: "Save ₱1000 in a single month", 
      completed: false, 
      claimable: false, 
      xpPoints: 200,
      icon: "CurrencyCircleDollar" 
    },
  ]);

  // Calculate XP based on saved money
  const calculateMoneyXP = () => {
    return Math.floor(savedMoney * xpPerPeso);
  };

  // Total XP is the sum of claimed achievements and money saved
  const totalXP = userXP + calculateMoneyXP();

  const constraints = [
    where("uid", "==", user?.uid),
    orderBy("date", "desc"),
    limit(100), // Increased limit to have more data for filtering
  ];

  // Use the useFetchData hook with the 'transactions' collection and constraints
  const {
    data: recentTransactions,
    loading: transactionsLoading,
    error,
  } = useFetchData<TransactionType>("transactions", constraints, [user?.uid, refreshKey]);

  // Filter transactions based on selected category and type
  const filteredTransactions = useMemo(() => {
    if (!recentTransactions) return [];

    let filtered = recentTransactions;

    // Filter by transaction type (Income/Expense)
    if (selectedType !== "All") {
      filtered = filtered.filter(transaction => 
        transaction.type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(transaction => 
        (transaction.category || "Uncategorized") === selectedCategory
      );
    }

    return filtered.slice(0, 30); // Limit to 30 for display
  }, [recentTransactions, selectedCategory, selectedType]);

  // Calculate saved money based on transactions
  useEffect(() => {
    if (recentTransactions && recentTransactions.length > 0) {
      const lastWeekTransactions = recentTransactions.filter(
        (t) => {
          const transactionDate = typeof t.date === 'string' 
            ? new Date(t.date) 
            : t.date instanceof Date 
              ? t.date 
              : new Date();
              
          return transactionDate.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
        }
      );
    
      const incomeTransactions = lastWeekTransactions.filter(t => t.type === "income");
      const expenseTransactions = lastWeekTransactions.filter(t => t.type === "expense");
      
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      setWeeklyExpenses(totalExpense);
      setSavedMoney(totalIncome - totalExpense > 0 ? totalIncome - totalExpense : 0);
    }
  }, [recentTransactions]);

  const logout = async () => {
    await signOut(auth);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedType("All");
  };

  // Get unique categories from transactions for dynamic filtering
  const getUniqueCategories = () => {
    if (!recentTransactions) return expenseCategories;
    
    const categories = recentTransactions
      .map(t => t.category || "Uncategorized")
      .filter((category, index, self) => category && self.indexOf(category) === index);
    
    return ["All", ...categories];
  };

  // Filter Modal Component
  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showCategoryFilter}
      onRequestClose={() => setShowCategoryFilter(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.modalHeader}>
            <Typo size={18} fontWeight="bold" color={colors.neutral900}>
              Filter Transactions
            </Typo>
            <TouchableOpacity onPress={() => setShowCategoryFilter(false)}>
              <Icons.X size={verticalScale(24)} color={colors.neutral900} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Transaction Type Filter */}
            <View style={styles.filterSection}>
              <Typo size={16} fontWeight="600" color={colors.neutral900} style={styles.filterTitle}>
                Transaction Type
              </Typo>
              <View style={styles.filterOptions}>
                {transactionTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      selectedType === type && styles.selectedFilterOption
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Typo
                      size={14}
                      color={selectedType === type ? colors.white : colors.neutral700}
                      fontWeight={selectedType === type ? "600" : "400"}
                    >
                      {type}
                    </Typo>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Typo size={16} fontWeight="600" color={colors.neutral900} style={styles.filterTitle}>
                Category
              </Typo>
              <View style={styles.filterOptions}>
                {getUniqueCategories().map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterOption,
                      selectedCategory === category && styles.selectedFilterOption
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Typo
                      size={14}
                      color={selectedCategory === category ? colors.white : colors.neutral700}
                      fontWeight={selectedCategory === category ? "600" : "400"}
                    >
                      {category || "Uncategorized"}
                    </Typo>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Typo size={14} color={colors.neutral700} fontWeight="500">
                  Reset Filters
                </Typo>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowCategoryFilter(false)}
              >
                <Typo size={14} color={colors.white} fontWeight="600">
                  Apply Filters
                </Typo>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render achievement item
  const renderAchievementItem = (achievement: Achievement) => {
    const IconComponent = Icons[achievement.icon] as React.ElementType;
    
    return (
      <View key={achievement.id} style={styles.achievementItem}>
        <View style={[styles.achievementIcon, { backgroundColor: achievement.completed ? colors.green : colors.neutral300 }]}>
          <IconComponent 
            size={verticalScale(22)} 
            color={colors.white} 
            weight="fill" 
          />
        </View>
        <View style={styles.achievementInfo}>
          <Typo size={14} fontWeight="500" color={colors.neutral900}>
            {achievement.title}
          </Typo>
          <Typo size={12} color={colors.neutral700}>
            {achievement.description}
          </Typo>
          {achievement.completed && achievement.claimable && (
            <Typo size={12} color={colors.green}>
              +{achievement.xpPoints} XP Available
            </Typo>
          )}
        </View>
        {achievement.completed && achievement.claimable && (
          <TouchableOpacity onPress={() => claimAchievementXP(achievement)}>
            <Icons.ArrowCircleUp
              size={verticalScale(20)} 
              color={colors.green} 
              weight="fill" 
            />
          </TouchableOpacity>
        )}
        {achievement.completed && !achievement.claimable && (
          <Icons.CheckCircle 
            size={verticalScale(20)} 
            color={colors.green} 
            weight="fill" 
          />
        )}
      </View>
    );
  };

  // Function to claim achievement XP
  const claimAchievementXP = (achievement: Achievement) => {
    if (achievement.completed && achievement.claimable) {
      setUserXP(prevXP => prevXP + achievement.xpPoints);
      
      setAchievements(prevAchievements => 
        prevAchievements.map(a => 
          a.id === achievement.id 
            ? { ...a, claimable: false } 
            : a
        )
      );

      setShowAchievements(false);
      setShowXPDetails(true);
    }
  };

  const generateTransactionsPDF = async () => {
    try {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString();
      const formattedTime = currentDate.toLocaleTimeString();

      let htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1 { color: #22c55e; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f2f2f2; }
              .timestamp { margin-top: 10px; font-size: 12px; color: #666; }
              .filter-info { margin: 10px 0; font-size: 14px; color: #333; }
              @page {
                size: auto;
                margin: 20mm;
              }
            </style>
          </head>
          <body>
            <h1>CoinBuddy Transactions</h1>
            <p class="timestamp">Generated on ${formattedDate} at ${formattedTime}</p>
            <div class="filter-info">
              <strong>Filters Applied:</strong> 
              Type: ${selectedType} | Category: ${selectedCategory}
            </div>

            <table>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
      `;

      // Add filtered transaction rows
      if (filteredTransactions && filteredTransactions.length > 0) {
        filteredTransactions.forEach(transaction => {
          let date = 'Unknown date';
          if (transaction.date instanceof Timestamp) {
            date = transaction.date.toDate().toLocaleDateString();
          } else if (transaction.date instanceof Date) {
            date = transaction.date.toLocaleDateString();
          } else if (typeof transaction.date === 'string' || typeof transaction.date === 'number') {
            date = new Date(transaction.date).toLocaleDateString();
          }

          htmlContent += `
            <tr>
              <td>${date}</td>
              <td>${transaction.description || "No description"}</td>
              <td>${transaction.category || "Uncategorized"}</td>
              <td>${transaction.type}</td>
              <td>₱${transaction.amount.toFixed(2)}</td>
            </tr>
          `;
        });
      } else {
        htmlContent += `
          <tr>
            <td colspan="5" style="text-align: center;">No transactions to display</td>
          </tr>
        `;
      }

      htmlContent += `
            </table>
          </body>
        </html>
      `;

      const { uri } = await printToFileAsync({
        html: htmlContent,
        base64: false
      });

      const fileName = `CoinBuddy_Transactions_${currentDate.toISOString().split('T')[0]}.pdf`;
      const pdfUri = FileSystem.documentDirectory + fileName;

      await FileSystem.moveAsync({
        from: uri,
        to: pdfUri
      });

      await shareAsync(pdfUri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Update the achievements progress calculation
  const completedAchievements = achievements.filter(a => a.completed);
  const claimableAchievements = achievements.filter(a => a.completed && a.claimable);

  // Check if filters are active
  const hasActiveFilters = selectedCategory !== "All" || selectedType !== "All";

  return (
    <ScreenWrapper>
      {/* Logo + Title */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 20 }}>
        <Image
          source={CoinBuddyLogo}  
          style={{ width: 130, height: 50, resizeMode: "contain" }} 
        />
      </View>

      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          {/*greeting*/}
          <View style={{ gap: 4 }}>
            <Typo fontWeight={"500"} size={20} color={colors.neutral900}>
              Hello, <Typo fontWeight={"500"} size={20} color={colors.green}>
              {user?.name || "Name"}
            </Typo>
            </Typo>
          </View>
          
          {/*trophy*/}
          <TouchableOpacity
            style={styles.trophyButton}
            onPress={() => setShowAchievements(true)}
          >
            <Icons.Trophy
              size={verticalScale(22)}
              color={colors.neutral900}
              weight="bold"
            />
            {claimableAchievements.length > 0 && (
              <View style={styles.notificationBadge}>
                <Typo size={10} color={colors.white} fontWeight="500">
                  {claimableAchievements.length}
                </Typo>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* XP Progress Bar */}
        <XPProgressBar 
          savedMoney={savedMoney}
          weeklyGoal={weeklyGoal}
          weeklyExpenses={weeklyExpenses}
          initialLevel={0}
          showDetails={showXPDetails}
          onPress={() => setShowXPDetails(!showXPDetails)}
          userXP={totalXP}
        />

        <ScrollView
          contentContainerStyle={styles.scrollViewStyle}
          showsVerticalScrollIndicator={false}
        >
          {/* card */}
          <View>
            <HomeCard />
          </View>

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersContainer}>
              <Typo size={12} color={colors.neutral700}>
                Filters: {selectedType !== "All" && `Type: ${selectedType}`}
                {selectedType !== "All" && selectedCategory !== "All" && " • "}
                {selectedCategory !== "All" && `Category: ${selectedCategory}`}
              </Typo>
              <TouchableOpacity onPress={resetFilters}>
                <Typo size={12} color={colors.green} fontWeight="500">
                  Clear All
                </Typo>
              </TouchableOpacity>
            </View>
          )}

          <TransactionList 
            title={"Recent Transactions"}
            loading={transactionsLoading}
            data={filteredTransactions}
            emptyListMessage="No Transactions found with current filters!"
            rightElement={
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <TouchableOpacity onPress={() => setShowCategoryFilter(true)}>
                  <Icons.Funnel
                    size={verticalScale(22)}
                    color={hasActiveFilters ? colors.green : colors.neutral900}
                    weight={hasActiveFilters ? "fill" : "bold"}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={generateTransactionsPDF}>
                  <Icons.FilePdf
                    size={verticalScale(22)}
                    color={colors.neutral900}
                    weight="bold"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(modals)/searchModal" as any)}
                >
                  <Icons.MagnifyingGlass
                    size={verticalScale(22)}
                    color={colors.neutral900}
                    weight="bold"
                  />
                </TouchableOpacity>
              </View>
            }
          />
        </ScrollView>
        
        <Button
          onPress={() => router.push("/(modals)/transactionModal" as any)}
          style={styles.floatingButton}
        >
          <Icons.Plus
            color={colors.black}
            weight="bold"
            size={verticalScale(24)}
          />
        </Button>
        
        {/* Filter Modal */}
        {renderFilterModal()}
        
        {/* Achievements Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAchievements}
          onRequestClose={() => setShowAchievements(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typo size={18} fontWeight="bold" color={colors.neutral900}>
                  Your Achievements
                </Typo>
                <TouchableOpacity onPress={() => setShowAchievements(false)}>
                  <Icons.X size={verticalScale(24)} color={colors.neutral900} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.achievementsProgress}>
                <Typo size={14} color={colors.neutral700}>
                  {completedAchievements.length} of {achievements.length} completed
                </Typo>
                <Typo size={12} color={colors.green}>
                  {claimableAchievements.length} achievements ready to claim
                </Typo>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${(completedAchievements.length / achievements.length) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
              
              <ScrollView style={styles.achievementsList}>
                {achievements.map(renderAchievementItem)}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    marginTop: verticalScale(8),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  trophyButton: {
    alignItems: "center", 
    justifyContent: "center", 
    width: verticalScale(30),
    height: verticalScale(30),
    borderRadius: 15,
    backgroundColor: colors.neutral100,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.green,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30),
  },
  scrollViewStyle: {
    marginTop: spacingY._10,
    paddingBottom: verticalScale(100),
    gap: spacingY._25,
  },
  // Active filters indicator
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral100,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._7,
    borderRadius: 8,
    marginBottom: spacingY._10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingX._20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacingX._20,
    width: '100%',
    maxHeight: '80%',
  },
  filterModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacingX._20,
    width: '100%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingBottom: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  // Filter styles
  filterSection: {
    marginBottom: spacingY._20,
  },
  filterTitle: {
    marginBottom: spacingY._10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._7,
    borderRadius: 20,
    backgroundColor: colors.neutral100,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  selectedFilterOption: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingX._10,
    marginTop: spacingY._20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: spacingY._12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral300,
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacingY._12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.green,
  },
  // Achievement styles
  achievementsProgress: {
    marginBottom: spacingY._15,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.neutral200,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.green,
    borderRadius: 4,
  },
  achievementsList: {
    maxHeight: '80%',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  achievementIcon: {
    width: verticalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._10,
  },
  achievementInfo: {
    flex: 1,
  }
});