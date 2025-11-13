import React from 'react';
import { Modal as RNModal, View, StyleSheet } from 'react-native';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onOpenChange, children }) => (
  <RNModal visible={open} transparent animationType="fade" onRequestClose={() => onOpenChange(false)}>
    <View style={styles.overlay}>
      <View style={styles.content}>{children}</View>
    </View>
  </RNModal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 20,
    minWidth: '80%',
  },
});

export default Modal;
