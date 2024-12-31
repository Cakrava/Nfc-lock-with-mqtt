import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export const cancelNfcSession = async () => {
  try {
    // Batalkan sesi NFC aktif saat ini
    await NfcManager.cancelTechnologyRequest();
    console.log('NFC session successfully cancelled');
  } catch (error) {
    console.error('Error canceling NFC session:', error);
  }
};
