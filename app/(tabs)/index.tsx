import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Modal,
} from "react-native";
import React, { useState, useEffect } from "react";
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
import { Timestamp } from "firebase/firestore"; // Make sure this is imported


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
  const [savedMoney, setSavedMoney] = useState(240); // Example: money saved
  const [weeklyGoal, setWeeklyGoal] = useState(500); // Weekly spending goal
  const [weeklyExpenses, setWeeklyExpenses] = useState(260); // Weekly expenses
  const [showXPDetails, setShowXPDetails] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const xpPerPeso = 1; // XP per peso saved
  const [userXP, setUserXP] = useState(0);


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
    where("uid", "==", user?.uid), // Filter by user ID
    orderBy("date", "desc"), // Order by creation date in descending order
    limit(30), // Limit the results to 30 transactions
  ];

  // Use the useFetchData hook with the 'transactions' collection and constraints
  const {
    data: recentTransactions,
    loading: transactionsLoading,
    error,
  } = useFetchData<TransactionType>("transactions", constraints, [user?.uid, refreshKey]);

  // Calculate saved money based on transactions (example calculation)
  useEffect(() => {
    if (recentTransactions && recentTransactions.length > 0) {
      // If t.date is a string (which appears to be the case based on the error)
        const lastWeekTransactions = recentTransactions.filter(
          (t) => {
            // Parse the date string to a Date object if it's a string
            const transactionDate = typeof t.date === 'string' 
              ? new Date(t.date) 
              : t.date instanceof Date 
                ? t.date 
                : new Date(); // Fallback in case t.date is neither string nor Date
                
            // Compare with 7 days ago
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

  // Modify the renderAchievementItem to include XP claim
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
      // Update XP
      setUserXP(prevXP => prevXP + achievement.xpPoints);
      
      // Mark achievement as claimed using state update
      setAchievements(prevAchievements => 
        prevAchievements.map(a => 
          a.id === achievement.id 
            ? { ...a, claimable: false } 
            : a
        )
      );

      // Close the modal to show XP increase (optional - provides better feedback)
      setShowAchievements(false);
      
      // Optionally show XP details after claiming
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
            @page {
              size: auto;
              margin: 20mm;
            }
            @media print {
              @page {
                margin: 20mm;
                counter-increment: page;
              }
              body {
                counter-reset: page;
              }
              .footer {
                position: fixed;
                bottom: 0;
                width: 100%;
                text-align: center;
                font-size: 12px;
                color: #999;
              }
              .footer:after {
                content: "Page " counter(page); 
              }
            }
          </style>
        </head>
        <body>
          <h1>CoinBuddy Transactions</h1>
          <p class="timestamp">Generated on ${formattedDate} at ${formattedTime}</p>

          <table>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
    `;

    // Add transaction rows
    if (recentTransactions && recentTransactions.length > 0) {
      recentTransactions.forEach(transaction => {
        let date = 'Unknown date';
          // **Crucial change here: Handle Firestore Timestamp objects**
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
          <div class="footer"></div>
        </body>
      </html>
    `;

    // Generate the PDF file
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

        {/* XP Progress Bar - Now passing totalXP */}
        <XPProgressBar 
          savedMoney={savedMoney}
          weeklyGoal={weeklyGoal}
          weeklyExpenses={weeklyExpenses}
          initialLevel={0}
          showDetails={showXPDetails}
          onPress={() => setShowXPDetails(!showXPDetails)}
          userXP={totalXP} // Pass the total XP including achievements
        />

        <ScrollView
          contentContainerStyle={styles.scrollViewStyle}
          showsVerticalScrollIndicator={false}
        >
          {/* card */}
          <View>
            <HomeCard />
          </View>

          <TransactionList 
          title={"Recent Transactions"}
          loading={transactionsLoading}
          data={recentTransactions}
          emptyListMessage="No Transactions added yet!"
          rightElement={
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingBottom: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
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