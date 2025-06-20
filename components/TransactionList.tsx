import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Typo from "./Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import {
  TransactionItemProps,
  TransactionListType,
  TransactionType,
} from "@/types";
import * as Icons from "phosphor-react-native";
import { expenseCategories, incomeCategory } from "@/constants/data";
import { verticalScale } from "@/utils/styling";
import Loading from "./Loading";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";

// Helper function to safely handle different date formats from Firestore or backups
const getSafeDate = (date: Date | Timestamp | string | undefined): Date => {
  if (!date) return new Date(); // Fallback for undefined or null date

  // Check if it's a Firestore Timestamp (which has a toDate method)
  if (typeof (date as Timestamp).toDate === 'function') {
    return (date as Timestamp).toDate();
  }

  // Check if it's a string and try to parse it
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    // Return the parsed date if it's valid, otherwise fallback
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  // Check if it's already a JavaScript Date object
  if (date instanceof Date) {
    return date;
  }

  // Final fallback for any other unexpected type
  return new Date();
};

const TransactionList = ({
  data,
  title,
  loading,
  emptyListMessage,
  rightElement,
  titleColor,
}: TransactionListType) => {
  //   console.log("got data: ", data);
  const router = useRouter();

  const handleClick = (item: TransactionType) => {
    console.log("opeingin: ", item.image);
    router.push({
      pathname: "/(modals)/transactionModal" as any,
      params: {
        id: item.id,
        type: item.type,
        amount: item.amount.toString(), // Convert number to string
        category: item.category,
        date: getSafeDate(item.date).toISOString(), // Use helper to safely get and format date
        description: item.description,
        image: item?.image,
        uid: item.uid,
        walletId: item.walletId,
      },
    });
  };
  return (
    <View style={styles.container}>
      {title && (
  <View style={styles.headerRow}> 
    <Typo fontWeight={"500"} size={20} color={colors.neutral900}>
      {title}
    </Typo>
    {rightElement}
  </View>
)}

      <View style={styles.list}>
        <FlashList
          data={data}
          renderItem={({ item, index }) => (
            <TransactionItem
              handleClick={handleClick}
              item={item}
              // key={item?.id}
              index={index}
            />
          )}
          estimatedItemSize={60}
        />
        {/* {data.map((item, index) => (
          <TransactionItem
            handleClick={handleClick}
            item={item}
            key={item?.id}
            index={index}
          />
        ))} */}
      </View>

      {!loading && data.length == 0 && (
        <Typo
          size={15}
          color={colors.neutral500}
          style={{ textAlign: "center", marginTop: spacingY._15 }}
        >
          {emptyListMessage}
        </Typo>
      )}
      {loading && (
        <View style={{ top: verticalScale(100) }}>
          <Loading />
        </View>
      )}
    </View>
  );
};

const TransactionItem = ({
  item,
  index,
  handleClick,
}: TransactionItemProps) => {
  let category =
    item?.type == "income" ? incomeCategory : expenseCategories[item.category!];
  const IconComponent = category.icon;

  // Use the getSafeDate helper to handle different date formats
  const date = getSafeDate(item?.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  //   console.log("date: ", date);
  // string category.icon will match one of the keys from the Icons object, which is a valid icon component.
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .springify()
        .damping(14)}
    >
      <TouchableOpacity style={styles.row} onPress={() => handleClick(item)}>
        <View style={[styles.icon, { backgroundColor: category.bgColor }]}>
          {IconComponent && (
            <IconComponent
              size={verticalScale(25)}
              weight="fill"
              color={colors.white}
            />
          )}
        </View>

        <View style={styles.categoryDes}>
          <Typo size={17} color={colors.black}>{category.label}</Typo>
          <Typo
            size={12}
            color={colors.neutral500}
            textProps={{ numberOfLines: 1 }}
          >
            {item?.description}
          </Typo>
        </View>
        <View style={styles.amountDate}>
          <Typo
            fontWeight={"500"}
            color={item?.type == "income" ? colors.primary : colors.rose}
          >{`${item?.type == "income" ? "+ ₱" : "- ₱"}${item?.amount}`}</Typo>
          <Typo size={13} color={colors.neutral800}>
            {date}
          </Typo>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default TransactionList;

const styles = StyleSheet.create({
  container: {
    gap: spacingY._17,
    // flex: 1,
    // backgroundColor: "red",
  },
  list: {
    minHeight: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingX._12,
    marginBottom: spacingY._12,

    // list with background
    backgroundColor: colors.neutral100,
    padding: spacingY._10,
    paddingHorizontal: spacingY._10,
    borderRadius: 20,
    borderColor: colors.neutral400,
    borderWidth: 1,
  },
  icon: {
    height: verticalScale(44),
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius._12,
    borderCurve: "continuous",
  },
  categoryDes: {
    flex: 1,
    gap: 2.5,
  },
  amountDate: {
    alignItems: "flex-end",
    gap: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
