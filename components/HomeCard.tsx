import { View, StyleSheet, TouchableOpacity, TextInput, Modal } from "react-native";
import React, { useState, useEffect } from "react";
import Typo from "./Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import * as Icons from "phosphor-react-native";
import useFetchData from "@/hooks/useFetchData";
import { WalletType } from "@/types";
import { orderBy, where } from "firebase/firestore";
import { useAuth } from "@/contexts/authContext";

const HomeCard = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [viewIncome, setViewIncome] = useState(false); // Toggle between income and expense
  const [weeklyGoal, setWeeklyGoal] = useState(500); // Default weekly goal amount
  const [goalPeriod, setGoalPeriod] = useState("week"); // Default period (month/week)
  const [showGoalModal, setShowGoalModal] = useState(false); // Modal for goal editing
  const [tempGoalAmount, setTempGoalAmount] = useState("500"); // Temporary state for editing
  const [tempGoalPeriod, setTempGoalPeriod] = useState("week"); // Temporary state for editing

  const { user } = useAuth();
  const {
    data: wallets,
    loading: walletLoading,
  } = useFetchData<WalletType>("wallets", [
    where("uid", "==", user?.uid),
    orderBy("created", "desc"),
  ]);

  // Calculate totals and adjust income when expenses are added
  const getTotals = () => {
    if (!wallets || wallets.length === 0) {
      return { income: 0, expenses: 0, adjustedIncome: 0 };
    }
    
    return wallets.reduce(
      (totals, item) => {
        totals.income += Number(item.totalIncome);
        totals.expenses += Number(item.totalExpenses);
        totals.adjustedIncome = totals.income - totals.expenses; // Subtract expenses from income
        return totals;
      },
      { income: 0, expenses: 0, adjustedIncome: 0 }
    );
  };

  // Load the goal settings when the component mounts
  useEffect(() => {
    // Here you could load the goal from AsyncStorage or your database
    // For example:
    // const loadGoal = async () => {
    //   const savedGoal = await AsyncStorage.getItem('weeklyGoal');
    //   const savedPeriod = await AsyncStorage.getItem('goalPeriod');
    //   if (savedGoal) setWeeklyGoal(Number(savedGoal));
    //   if (savedPeriod) setGoalPeriod(savedPeriod);
    // };
    // loadGoal();
  }, []);

  // Open the goal edit modal with current values
  const openGoalModal = () => {
    setTempGoalAmount(weeklyGoal.toString());
    setTempGoalPeriod(goalPeriod);
    setShowGoalModal(true);
  };

  // Save the new goal settings - this will update weeklyGoal from user input
  const saveGoal = () => {
    const newGoalAmount = Number(tempGoalAmount) || 0;
    setWeeklyGoal(newGoalAmount); // Update the weeklyGoal with user input
    setGoalPeriod(tempGoalPeriod);
    setShowGoalModal(false);
    
    // Here you could save to AsyncStorage or your database
    // For example:
    // AsyncStorage.setItem('weeklyGoal', newGoalAmount.toString());
    // AsyncStorage.setItem('goalPeriod', tempGoalPeriod);
    
    console.log("Goal updated to:", newGoalAmount, "per", tempGoalPeriod);
  };

  const totals = getTotals();

  return (
    <View style={styles.card}>
      {/* Three-dot button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setShowMenu(!showMenu)}
      >
        <Icons.DotsThree size={30} color={colors.white} weight="bold" />
      </TouchableOpacity>

      {/* Dropdown Menu */}
      {showMenu && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setViewIncome(!viewIncome);
              setShowMenu(false);
            }}
          >
            <Typo color={colors.black} size={14} fontWeight="500">
              {viewIncome ? "View Expense" : "View Income"}
            </Typo>
          </TouchableOpacity>
          
          {!viewIncome && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                openGoalModal();
                setShowMenu(false);
              }}
            >
              <Typo color={colors.black} size={14} fontWeight="500">
                Set Goal
              </Typo>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Title: Expense or Income */}
      <Typo color={colors.white} size={17} fontWeight="500">
        {viewIncome ? "Remaining Income" : "Expense Total"}
      </Typo>

      {/* Amount: Expense or Income */}
      {viewIncome ? (
        <View>
          <Typo color={colors.white} size={30} fontWeight="bold">
            ₱{walletLoading ? "----" : totals.adjustedIncome.toFixed(2)}
          </Typo>
          <Typo color={colors.white} size={14}>
            You've spent ₱{walletLoading ? "----" : totals.expenses.toFixed(2)} this {goalPeriod}
          </Typo>
        </View>
      ) : (
        <Typo color={colors.white} size={30} fontWeight="bold">
          ₱{walletLoading ? "----" : totals.expenses.toFixed(2)}{" "}
          <Typo size={14} color={colors.white}>
            /₱{weeklyGoal} per {goalPeriod}
          </Typo>
        </Typo>
      )}

      {/* Goal Setting Modal */}
      <Modal
        visible={showGoalModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Typo size={18} color={colors.black} fontWeight="bold" style={styles.modalTitle}>
              Set Budget Goal
            </Typo>
            
            <View style={styles.inputContainer}>
              <Typo size={14} color={colors.black}>Amount (₱)</Typo>
              <TextInput
                style={styles.input}
                value={tempGoalAmount}
                onChangeText={setTempGoalAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
              />
            </View>
            
            <View style={styles.periodSelector}>
              <Typo size={14} color={colors.black}>Period</Typo>
              <View style={styles.periodOptions}>
                <TouchableOpacity
                  style={[
                    styles.periodOption,
                    tempGoalPeriod === "week" && styles.periodOptionActive
                  ]}
                  onPress={() => setTempGoalPeriod("week")}
                >
                  <Typo 
                    size={14} 
                    color={tempGoalPeriod === "week" ? colors.white : colors.black}
                  >
                    Weekly
                  </Typo>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.periodOption,
                    tempGoalPeriod === "month" && styles.periodOptionActive
                  ]}
                  onPress={() => setTempGoalPeriod("month")}
                >
                  <Typo 
                    size={14} 
                    color={tempGoalPeriod === "month" ? colors.white : colors.black}
                  >
                    Monthly
                  </Typo>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowGoalModal(false)}
              >
                <Typo size={14} color={colors.black}>Cancel</Typo>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveGoal}
              >
                <Typo size={14} color={colors.white}>Save</Typo>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeCard;

const styles = StyleSheet.create({
  card: {
    width: 350,
    height: 145,
    backgroundColor: "#00723F",
    borderRadius: 20,
    padding: spacingX._20,
    justifyContent: "center",
    position: "relative",
  },
  menuButton: {
    position: "absolute",
    top: spacingY._10,
    right: spacingX._10,
    padding: 5,
  },
  dropdownMenu: {
    position: "absolute",
    top: spacingY._25,
    right: spacingX._10,
    backgroundColor: colors.white,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  menuItem: {
    padding: spacingX._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral300,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacingY._5,
  },
  changePill: {
    backgroundColor: colors.white,
    paddingHorizontal: spacingX._10,
    paddingVertical: 3,
    borderRadius: 50,
    marginRight: spacingX._5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    width: "100%",
  },
  periodSelector: {
    width: "100%",
    marginBottom: 20,
  },
  periodOptions: {
    flexDirection: "row",
    marginTop: 5,
  },
  periodOption: {
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    minWidth: 80,
    alignItems: "center",
  },
  periodOptionActive: {
    backgroundColor: "#00723F",
    borderColor: "#00723F",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.neutral300,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#00723F",
  },
});