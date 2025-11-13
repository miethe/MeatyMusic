import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  children?: React.ReactNode;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 0,
  },
  section: {
    padding: 12,
    borderColor: '#e5e7eb',
  },
  header: { borderBottomWidth: StyleSheet.hairlineWidth },
  footer: { borderTopWidth: StyleSheet.hairlineWidth },
});

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardProps>;
  Content: React.FC<CardProps>;
  Footer: React.FC<CardProps>;
} = ({ children, style, ...rest }) => (
  <View style={[styles.card, style]} {...rest}>{children}</View>
);

Card.Header = ({ children, style, ...rest }) => (
  <View style={[styles.section, styles.header, style]} {...rest}>{children}</View>
);

Card.Content = ({ children, style, ...rest }) => (
  <View style={[styles.section, style]} {...rest}>{children}</View>
);

Card.Footer = ({ children, style, ...rest }) => (
  <View style={[styles.section, styles.footer, style]} {...rest}>{children}</View>
);

export default Card;
