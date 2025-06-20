import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import { firestore } from '@/config/firebase';
import { collection, getDocs, query, where, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { ResponseType, TransactionType, UserType, WalletType } from '@/types';
import { updateUser } from './userService';

// Type for backup data structure
export interface BackupData {
  user: UserType;
  wallets: WalletType[];
  transactions: TransactionType[];
  backupDate: string;
  version: string;
}

/**
 * Creates a backup of user data and saves it to a file
 */
export const createBackup = async (uid?: string): Promise<ResponseType> => {
  try {
    if (!uid) {
      return { success: false, msg: 'User not authenticated' };
    }

    // Fetch user data
    const userDoc = await getDocs(query(collection(firestore, 'users'), where('uid', '==', uid)));
    if (userDoc.empty) {
      return { success: false, msg: 'User not found' };
    }
    const userData = userDoc.docs[0].data() as UserType;

    // Fetch wallets
    const walletsQuery = query(collection(firestore, 'wallets'), where('uid', '==', uid));
    const walletsSnapshot = await getDocs(walletsQuery);
    const wallets: WalletType[] = [];
    walletsSnapshot.forEach(doc => {
      wallets.push({ id: doc.id, ...doc.data() } as WalletType);
    });

    // Fetch transactions
    const transactionsQuery = query(collection(firestore, 'transactions'), where('uid', '==', uid));
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactionsToBackup: TransactionType[] = [];
    transactionsSnapshot.forEach(doc => {
      const data = doc.data();
      // Ensure date is a serializable ISO string for the backup.
      // This handles cases where date could be a Timestamp.
      if (data.date && typeof data.date.toDate === 'function') {
        data.date = data.date.toDate().toISOString();
      }
      transactionsToBackup.push({ id: doc.id, ...data } as TransactionType);
    });

    // Create backup object
    const backupData: BackupData = {
      user: userData,
      wallets,
      transactions: transactionsToBackup,
      backupDate: new Date().toISOString(),
      version: '1.0'
    };

    const backupString = JSON.stringify(backupData, null, 2);
    const fileName = `coinbuddy_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = btoa(unescape(encodeURIComponent(backupString)));
        await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/json')
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
          });
        return { success: true, msg: `Backup saved to your Downloads folder as ${fileName}` };
      } else {
        return { success: false, msg: 'Permission to save file was denied.' };
      }
    } else {
      // Fallback for iOS and other platforms
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, backupString);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save or Share your CoinBuddy Backup',
        UTI: 'public.json'
      });
      return { success: true, msg: 'Backup shared successfully.' };
    }
  } catch (error: any) {
    console.error('Error creating backup:', error);
    return { success: false, msg: error.message || 'Failed to create backup' };
  }
};

/**
 * Restores user data from a backup file
 */
export const restoreBackup = async (uid?: string): Promise<ResponseType> => {
  try {
    if (!uid) {
      return { success: false, msg: 'User not authenticated' };
    }

    // Use DocumentPicker to select a file
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, msg: 'File selection canceled' };
    }

    const asset = result.assets[0];
    const uri = asset.uri;

    // Optional: Check mime type if available
    if (asset.mimeType && asset.mimeType !== 'application/json') {
      return { 
        success: false, 
        msg: 'The selected file is not a JSON file. Please select a valid .json backup file.' 
      };
    }
    
    // Read the file content
    try {
      const fileContent = await FileSystem.readAsStringAsync(uri);
      let backupData: BackupData;
      
      try {
        backupData = JSON.parse(fileContent);
        
        // Validate backup data structure
        if (!backupData.user || !backupData.wallets || !backupData.transactions) {
          return { success: false, msg: 'Invalid backup file format' };
        }
      } catch (error) {
        return { success: false, msg: 'Could not parse backup file. Please select a valid JSON backup file.' };
      }

      // Start restoring data
      const batch = writeBatch(firestore);

      // Update user data (excluding auth-related fields)
      const { email, uid: backupUid, emailVerified, ...userDataToUpdate } = backupData.user || {};
      await updateUser(uid, userDataToUpdate as any);

      // Delete existing wallets
      const existingWalletsQuery = query(collection(firestore, 'wallets'), where('uid', '==', uid));
      const existingWalletsSnapshot = await getDocs(existingWalletsQuery);
      existingWalletsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete existing transactions
      const existingTransactionsQuery = query(collection(firestore, 'transactions'), where('uid', '==', uid));
      const existingTransactionsSnapshot = await getDocs(existingTransactionsQuery);
      existingTransactionsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Add wallets from backup
      backupData.wallets.forEach(wallet => {
        const { id, ...walletData } = wallet;
        const walletRef = id 
          ? doc(firestore, 'wallets', id) 
          : doc(collection(firestore, 'wallets'));
        
        batch.set(walletRef, {
          ...walletData,
          uid // Ensure the current user's UID is used
        });
      });

      // Add transactions from backup
      backupData.transactions.forEach(transaction => {
        const { id, ...transactionData } = transaction;
        const transactionRef = id 
          ? doc(firestore, 'transactions', id) 
          : doc(collection(firestore, 'transactions'));
        
        let finalDate;
        const dateValue = transactionData.date as any;

        // Smartly handle different possible date formats
        if (dateValue && typeof dateValue === 'object' && typeof dateValue.seconds === 'number') {
          // Handles { seconds: ..., nanoseconds: ... } format from Firestore Timestamps in JSON
          finalDate = new Timestamp(dateValue.seconds, dateValue.nanoseconds || 0);
        } else if (typeof dateValue === 'string') {
          // Handles ISO date strings
          const parsedDate = new Date(dateValue);
          if (!isNaN(parsedDate.getTime())) {
            finalDate = Timestamp.fromDate(parsedDate);
          } else {
            console.warn(`Invalid date string in backup for transaction ${id}. Using current date.`);
            finalDate = Timestamp.now();
          }
        } else {
          // Fallback for any other unexpected or missing format
          console.warn(`Unknown or missing date format for transaction ${id}. Using current date.`);
          finalDate = Timestamp.now();
        }

        const restoredTransaction = {
          ...transactionData,
          date: finalDate,
          uid
        };
        
        batch.set(transactionRef, restoredTransaction);
      });

      // Commit all changes
      await batch.commit();

      return { success: true, msg: 'Backup restored successfully' };
    } catch (error: any) {
      return { success: false, msg: error.message || 'Failed to read selected file' };
    }
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    return { success: false, msg: error.message || 'Failed to restore backup' };
  }
};

// btoa and atob polyfill for react-native
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const btoa = (input: string = '')  => {
  let str = input;
  let output = '';

  for (let block = 0, charCode, i = 0, map = chars;
  str.charAt(i | 0) || (map = '=', i % 1);
  output += map.charAt(63 & block >> 8 - i % 1 * 8)) {

    charCode = str.charCodeAt(i += 3/4);

    if (charCode > 0xFF) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }

    block = block << 8 | charCode;
  }
  
  return output;
};

const atob = (input: string = '') => {
  let str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 == 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  for (let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);

    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
}; 