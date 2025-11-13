import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardProps>;
  Content: React.FC<CardProps>;
  Footer: React.FC<CardProps>;
} = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-md shadow ${className}`} {...props}>{children}</div>
);

Card.Header = ({ children, className = '', ...props }) => (
  <div className={`border-b px-4 py-2 ${className}`} {...props}>{children}</div>
);

Card.Content = ({ children, className = '', ...props }) => (
  <div className={`p-4 ${className}`} {...props}>{children}</div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`border-t px-4 py-2 ${className}`} {...props}>{children}</div>
);

export default Card;
